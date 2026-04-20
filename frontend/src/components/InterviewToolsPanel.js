import React, { useMemo, useState } from 'react';
import axios from 'axios';

const SCHEDULING_DIRECT_BASE = process.env.REACT_APP_SCHEDULING_URL || 'http://localhost:3004';
const TRANSCRIPTION_DIRECT_BASE = process.env.REACT_APP_TRANSCRIPTION_URL || 'http://localhost:3002';

function extractError(err) {
    return err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Request failed';
}

function isNetworkError(err) {
    return !err?.response && String(err?.message || '').toLowerCase().includes('network');
}

export default function InterviewToolsPanel({ title = 'Invite + Transcript Tools', description = '', embedded = false }) {
    const schedulingClient = useMemo(() => axios.create({ baseURL: SCHEDULING_DIRECT_BASE }), []);
    const transcriptionClient = useMemo(() => axios.create({ baseURL: TRANSCRIPTION_DIRECT_BASE }), []);

    const [sessionTitle] = useState('Universal Session');
    const [companyId] = useState('universal-company');
    const [candidateId] = useState('candidate-auto');
    const [inviteToken, setInviteToken] = useState('');
    const [assignmentInfo, setAssignmentInfo] = useState(null);

    const [videoId, setVideoId] = useState('');
    const [transcriptStatus, setTranscriptStatus] = useState('');
    const [transcriptPreview, setTranscriptPreview] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleGenerateInviteToken() {
        setLoading(true);
        setError('');
        setInviteToken('');
        setAssignmentInfo(null);

        try {
            // Uses scheduling service directly so this tool can work even if gateway auth is not set up.
            const sessionRes = await schedulingClient.post('/scheduling/sessions', {
                company_id: companyId,
                title: sessionTitle,
                status: 'OPEN',
            });

            const sessionId = sessionRes?.data?._id;
            if (!sessionId) throw new Error('Session creation failed: missing session id');

            const assignmentRes = await schedulingClient.post('/scheduling/assignments', {
                session_id: sessionId,
                candidate_id: candidateId,
            });

            const token = assignmentRes?.data?.invite_token;
            if (!token) throw new Error('Assignment creation failed: missing invite token');

            setInviteToken(token);
            setAssignmentInfo({
                session_id: sessionId,
                assignment_id: assignmentRes?.data?._id,
                candidate_id: assignmentRes?.data?.candidate_id,
            });
        } catch (err) {
            if (isNetworkError(err)) {
                setError(
                    `Invite token failed: could not reach Scheduling Service at ${SCHEDULING_DIRECT_BASE}. ` +
                    'Start scheduling-service and try again.'
                );
            } else {
                setError(`Invite token failed: ${extractError(err)}`);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckTranscript() {
        setLoading(true);
        setError('');
        setTranscriptStatus('');
        setTranscriptPreview('');

        try {
            if (!videoId.trim()) throw new Error('Enter video/job id');

            const { data } = await transcriptionClient.get(`/transcription/by-video/${videoId.trim()}`);

            setTranscriptStatus('ready');
            setTranscriptPreview((data?.full_text || '').slice(0, 400));
        } catch (err) {
            if (err?.response?.status === 404) {
                setTranscriptStatus('pending');
            } else {
                setTranscriptStatus('error');
                if (isNetworkError(err)) {
                    setError(
                        `Transcript check failed: could not reach Transcription Service at ${TRANSCRIPTION_DIRECT_BASE}. ` +
                        'Start transcription-service and try again.'
                    );
                } else {
                    setError(`Transcript check failed: ${extractError(err)}`);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={embedded ? '' : 'page'} style={embedded ? undefined : { paddingTop: '1rem' }}>
            <div className={embedded ? '' : 'container'} style={embedded ? undefined : { maxWidth: '1080px' }}>
                <div className={embedded ? 'mb-md' : 'flex-between mb-md'} style={embedded ? undefined : { alignItems: 'flex-end' }}>
                    <div>
                        <h2 style={{ marginBottom: '.25rem' }}>{title}</h2>
                        <p style={{ marginBottom: 0 }}>{description || 'Generate a universal invite token with one click, then check transcript status.'}</p>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card mt-lg">
                    <h3>Universal invite token</h3>
                    <p className="text-muted text-sm">One click creates a reusable invite token. Any candidate can paste it at login.</p>

                    <button className="btn btn-primary" onClick={handleGenerateInviteToken} disabled={loading}>Generate universal invite</button>

                    {inviteToken && (
                        <div className="mt-md">
                            <label className="form-label">Universal invite token</label>
                            <textarea className="form-input" rows={3} value={inviteToken} readOnly />
                        </div>
                    )}

                    {assignmentInfo && (
                        <div className="mt-md text-sm">
                            <div><strong>Session ID:</strong> {assignmentInfo.session_id}</div>
                            <div><strong>Assignment ID:</strong> {assignmentInfo.assignment_id}</div>
                            <div><strong>Candidate ID:</strong> {assignmentInfo.candidate_id}</div>
                        </div>
                    )}
                </div>

                <div className="card mt-lg">
                    <h3>Check transcript by video/job ID</h3>
                    <p className="text-muted text-sm">Use the upload job id (shown in review flows) to verify whether transcription is ready.</p>

                    <div className="form-group">
                        <label className="form-label">Video/job ID</label>
                        <input className="form-input" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="e.g. 69e39267cd8fc852494193d6" />
                    </div>

                    <button className="btn btn-outline" onClick={handleCheckTranscript} disabled={loading}>Check transcript</button>

                    {transcriptStatus === 'ready' && (
                        <div className="alert alert-success mt-md">Transcript is ready.</div>
                    )}
                    {transcriptStatus === 'pending' && (
                        <div className="alert alert-info mt-md">Transcript not found yet (still processing or not published).</div>
                    )}
                    {transcriptStatus === 'error' && (
                        <div className="alert alert-error mt-md">Transcript check failed. See error above.</div>
                    )}

                    {transcriptPreview && (
                        <div className="mt-md">
                            <label className="form-label">Transcript preview</label>
                            <textarea className="form-input" rows={6} value={transcriptPreview} readOnly />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
