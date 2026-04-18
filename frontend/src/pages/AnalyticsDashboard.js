import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { formatTimestamp } from '../utils/formatTimestamp';

export default function AnalyticsDashboard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [metrics, setMetrics] = useState([]);
  const [candidateVideos, setCandidateVideos] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.get(`/analytics/sessions/${sessionId}/candidates`)
      .then(({ data }) => setMetrics(data))
      .finally(() => setLoading(false));
  }, [sessionId]);

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
      setVideoError('');
      setComments([]);
      return;
    }

    setVideoLoading(true);
    setVideoError('');
    api.get(`/upload/sessions/${sessionId}/candidates/${encodeURIComponent(selectedCandidateId)}/latest-video`)
      .then(({ data }) => setVideoSrc(data.playback_url || ''))
      .catch(() => {
        setVideoSrc('');
        setVideoError('No video available for this candidate yet.');
      })
      .finally(() => setVideoLoading(false));

    api.get(`/feedback/comments/${sessionId}?candidate_id=${encodeURIComponent(selectedCandidateId)}`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]));
  }, [sessionId, selectedCandidateId]);

  const selectedMetric = metrics.find((m) => m.candidate_id === selectedCandidateId);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <h1 className="mb-md">Analytics Dashboard</h1>

          {!sessionId && (
            <div className="alert alert-info">Pass <code>?session=SESSION_ID</code> in the URL to view analytics.</div>
          )}

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
                    <option key={c.candidate_id} value={c.candidate_id}>{c.candidate_id}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading ? <div className="spinner" /> : (
            <>
              {sessionId && selectedCandidateId && (
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '.75rem' }}>Interview Video</h3>
                    {videoLoading && <div className="spinner" />}
                    {!videoLoading && videoError && <p className="text-muted text-sm">{videoError}</p>}
                    {!videoLoading && !videoError && videoSrc && <VideoPlayer src={videoSrc} />}
                  </div>

                  <div className="card">
                    <h3>Reviewer Comments <span className="text-muted text-sm">({comments.length})</span></h3>
                    <hr className="divider" />
                    <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                      {comments.length === 0 && <p className="text-muted text-sm">No comments yet for this candidate.</p>}
                      {[...comments].sort((a, b) => a.video_timestamp_ms - b.video_timestamp_ms).map(c => (
                        <div key={c._id} style={{ padding: '.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <div className="flex-between" style={{ marginBottom: '.3rem' }}>
                            <span className="badge badge-blue">{formatTimestamp(c.video_timestamp_ms)}</span>
                            <span className="text-muted text-sm">{c.reviewer_id?.slice(0, 6)}…</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text)' }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sessionId && selectedMetric && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <p className="text-muted text-sm" style={{ marginBottom: '.5rem' }}>Selected Candidate Analytics</p>
                  <h3 style={{ marginBottom: '1rem', wordBreak: 'break-all' }}>{selectedMetric.candidate_id}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    <div className="flex-between text-sm">
                      <span className="text-muted">Filler words</span>
                      <strong>{selectedMetric.filler_word_count}</strong>
                    </div>
                    <div className="flex-between text-sm">
                      <span className="text-muted">Talk time</span>
                      <strong>{selectedMetric.talk_time_seconds}s</strong>
                    </div>
                    <div className="flex-between text-sm">
                      <span className="text-muted">Sentiment</span>
                      <strong>{selectedMetric.sentiment_score ?? '—'}</strong>
                    </div>
                    <div className="flex-between text-sm">
                      <span className="text-muted">Rank</span>
                      <strong>{selectedMetric.overall_rank ?? '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {metrics.length > 0 && (
                <div className="grid-3">
                  {metrics.map(m => (
                    <div className="card" key={m._id}>
                      <p className="text-muted text-sm" style={{ marginBottom: '.5rem' }}>Candidate</p>
                      <h3 style={{ marginBottom: '1rem', wordBreak: 'break-all' }}>{m.candidate_id}</h3>
                      <hr className="divider" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        <div className="flex-between text-sm">
                          <span className="text-muted">Filler words</span>
                          <strong>{m.filler_word_count}</strong>
                        </div>
                        <div className="flex-between text-sm">
                          <span className="text-muted">Talk time</span>
                          <strong>{m.talk_time_seconds}s</strong>
                        </div>
                        <div className="flex-between text-sm">
                          <span className="text-muted">Sentiment</span>
                          <strong>{m.sentiment_score ?? '—'}</strong>
                        </div>
                        <div className="flex-between text-sm">
                          <span className="text-muted">Rank</span>
                          <strong>{m.overall_rank ?? '—'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sessionId && metrics.length === 0 && !loading && (
                <p className="text-muted">No analytics data yet for this session.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
