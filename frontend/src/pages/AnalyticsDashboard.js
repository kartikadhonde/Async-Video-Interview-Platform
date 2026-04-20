import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptViewer from '../components/TranscriptViewer';
import { formatTimestamp } from '../utils/formatTimestamp';

export default function AnalyticsDashboard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [error, setError] = useState('');
  const [candidateVideos, setCandidateVideos] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [videoId, setVideoId] = useState('');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [comments, setComments] = useState([]);
  const [reviewerMap, setReviewerMap] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/upload/sessions/${sessionId}/candidates`)
      .then(({ data }) => {
        const candidates = data?.candidates || [];
        setCandidateVideos(candidates);
        setSelectedCandidateId(candidates[0]?.candidate_id || '');
      })
      .catch(() => {
        setCandidateVideos([]);
        setSelectedCandidateId('');
      });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !selectedCandidateId) {
      setVideoSrc('');
      setVideoId('');
      setVideoError('');
      setCurrentTimeMs(0);
      setComments([]);
      return;
    }

    setVideoLoading(true);
    setVideoError('');
    api.get(`/upload/sessions/${sessionId}/candidates/${encodeURIComponent(selectedCandidateId)}/latest-video`)
      .then(({ data }) => {
        setVideoSrc(data.playback_url || '');
        setVideoId(data.job_id || '');
      })
      .catch(() => {
        setVideoSrc('');
        setVideoId('');
        setVideoError('No video available for this candidate yet.');
      })
      .finally(() => setVideoLoading(false));

    api.get(`/feedback/comments/${sessionId}?candidate_id=${encodeURIComponent(selectedCandidateId)}`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]));
  }, [sessionId, selectedCandidateId]);

  useEffect(() => {
    const reviewerIds = [...new Set((comments || []).map((c) => c.reviewer_id).filter(Boolean))];
    if (!reviewerIds.length) {
      setReviewerMap({});
      return;
    }

    api.get(`/scheduling/reviewers?ids=${encodeURIComponent(reviewerIds.join(','))}`)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((reviewer) => {
          map[reviewer.id] = reviewer;
        });
        setReviewerMap(map);
      })
      .catch(() => setReviewerMap({}));
  }, [comments]);

  const reviewerAliasMap = useMemo(() => {
    const map = {};
    const orderedIds = [...new Set((comments || [])
      .sort((a, b) => a.video_timestamp_ms - b.video_timestamp_ms)
      .map((c) => c.reviewer_id)
      .filter(Boolean))];

    orderedIds.forEach((id, idx) => {
      map[id] = `reviewer${idx + 1}`;
    });

    return map;
  }, [comments]);

  const selectedCandidate = candidateVideos.find((c) => c.candidate_id === selectedCandidateId);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <h1 className="mb-md">Analytics Dashboard</h1>

          {!sessionId && (
            <div className="alert alert-info">Pass <code>?session=SESSION_ID</code> in the URL to view analytics.</div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {sessionId && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Candidate</label>
                <select
                  className="form-input"
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  disabled={candidateVideos.length === 0}
                >
                  {candidateVideos.length === 0 && <option value="">No candidate submissions yet</option>}
                  {candidateVideos.map((c) => (
                    <option key={c.candidate_id} value={c.candidate_id}>{c.candidate_name || c.candidate_id}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <>
            {sessionId && selectedCandidateId && (
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h3 style={{ marginBottom: '.75rem' }}>Interview Video</h3>
                  {videoLoading && <div className="spinner" />}
                  {!videoLoading && videoError && <p className="text-muted text-sm">{videoError}</p>}
                  {!videoLoading && !videoError && videoSrc && (
                    <VideoPlayer src={videoSrc} onTimeUpdate={setCurrentTimeMs} />
                  )}
                </div>

                <div className="card">
                  <h3>Reviewer Comments <span className="text-muted text-sm">({comments.length})</span></h3>
                  <hr className="divider" />
                  <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {comments.length === 0 && <p className="text-muted text-sm">No comments yet for this candidate.</p>}
                    {[...comments].sort((a, b) => a.video_timestamp_ms - b.video_timestamp_ms).map(c => {
                      const reviewer = reviewerMap[c.reviewer_id];
                      const reviewerLabel = reviewerAliasMap[c.reviewer_id] || reviewer?.name || 'reviewer';

                      return (
                        <div key={c._id} style={{ padding: '.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <div className="flex-between" style={{ marginBottom: '.3rem' }}>
                            <span className="badge badge-blue">{formatTimestamp(c.video_timestamp_ms)}</span>
                            <span className="text-muted text-sm">{reviewerLabel}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text)' }}>{c.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {sessionId && selectedCandidateId && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <TranscriptViewer videoId={videoId} currentTimeMs={currentTimeMs} />
              </div>
            )}

            {sessionId && selectedCandidateId && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <p className="text-muted text-sm" style={{ marginBottom: '.5rem' }}>Selected Candidate</p>
                <h3 style={{ marginBottom: '.4rem', wordBreak: 'break-all' }}>{selectedCandidate?.candidate_name || selectedCandidateId}</h3>
                <p className="text-muted text-sm" style={{ margin: 0 }}>
                  Reviewer insights are shown through timestamp comments, transcript segments, and 5-metric ratings in review workflows.
                </p>
              </div>
            )}

            {sessionId && !selectedCandidateId && (
              <p className="text-muted">No candidate submissions yet for this session.</p>
            )}

            {sessionId && selectedCandidateId && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <p className="text-muted text-sm" style={{ marginBottom: '.5rem' }}>Selected Candidate Context</p>
                <h3 style={{ marginBottom: '1rem', wordBreak: 'break-all' }}>{selectedCandidate?.candidate_name || selectedCandidateId}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <div className="flex-between text-sm">
                    <span className="text-muted">Candidate ID</span>
                    <strong>{selectedCandidateId}</strong>
                  </div>
                  <div className="flex-between text-sm">
                    <span className="text-muted">Video status</span>
                    <strong>{videoId ? 'Available' : 'Pending'}</strong>
                  </div>
                  <div className="flex-between text-sm">
                    <span className="text-muted">Comments</span>
                    <strong>{comments.length}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
}
