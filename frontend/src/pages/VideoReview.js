import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import CommentPanel from '../components/CommentPanel';
import TranscriptViewer from '../components/TranscriptViewer';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

export default function VideoReview() {
  const { sessionId } = useParams();
  const [candidateVideos, setCandidateVideos] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [comments, setComments] = useState([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [videoSrc, setVideoSrc] = useState('');
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState('');

  const { emitComment } = useSocket(sessionId, (newComment) => {
    if (!selectedCandidateId || newComment?.candidate_id === selectedCandidateId) {
      setComments(prev => [...prev, newComment]);
    }
  });

  useEffect(() => {
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
    if (!selectedCandidateId) {
      setComments([]);
      return;
    }

    api.get(`/feedback/comments/${sessionId}?candidate_id=${encodeURIComponent(selectedCandidateId)}`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]));
  }, [sessionId, selectedCandidateId]);

  useEffect(() => {
    if (!selectedCandidateId) {
      setVideoLoading(false);
      setVideoError('No candidate submissions found for this session yet.');
      setVideoSrc('');
      return;
    }

    setVideoLoading(true);
    setVideoError('');
    api.get(`/upload/sessions/${sessionId}/candidates/${encodeURIComponent(selectedCandidateId)}/latest-video`)
      .then(({ data }) => setVideoSrc(data.playback_url || ''))
      .catch(() => setVideoError('No reviewable video found for this candidate yet.'))
      .finally(() => setVideoLoading(false));
  }, [sessionId, selectedCandidateId]);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <h1 className="mb-md">Video Review</h1>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Candidate submission</label>
              <select
                className="form-input"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                disabled={candidateVideos.length === 0}
              >
                {candidateVideos.length === 0 && (
                  <option value="">No candidate submissions yet</option>
                )}
                {candidateVideos.map((c) => (
                  <option key={c.candidate_id} value={c.candidate_id}>
                    {c.candidate_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                {videoLoading && <div className="spinner" />}
                {!videoLoading && videoError && <p className="text-muted text-sm">{videoError}</p>}
                {!videoLoading && !videoError && (
                  <VideoPlayer src={videoSrc} onTimeUpdate={setCurrentTimeMs} />
                )}
              </div>
              <div className="card">
                <TranscriptViewer sessionId={sessionId} currentTimeMs={currentTimeMs} />
              </div>
            </div>
            <div className="card" style={{ position: 'sticky', top: '72px' }}>
              <CommentPanel
                comments={comments}
                sessionId={sessionId}
                candidateId={selectedCandidateId}
                currentTimeMs={currentTimeMs}
                onNewComment={(c) => {
                  setComments(prev => [...prev, c]);
                  emitComment(c);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
