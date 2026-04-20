import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import CommentPanel from '../components/CommentPanel';
import ReviewerRatingPanel from '../components/ReviewerRatingPanel';
import TranscriptViewer from '../components/TranscriptViewer';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

export default function VideoReview() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const preferredCandidateId = searchParams.get('candidate') || '';
  const [candidateVideos, setCandidateVideos] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [comments, setComments] = useState([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [videoSrc, setVideoSrc] = useState('');
  const [videoId, setVideoId] = useState('');
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
        const preferredExists = candidates.some((c) => c.candidate_id === preferredCandidateId);
        setSelectedCandidateId(preferredExists ? preferredCandidateId : (candidates[0]?.candidate_id || ''));
      })
      .catch(() => {
        setCandidateVideos([]);
        setSelectedCandidateId('');
      });
  }, [sessionId, preferredCandidateId]);

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
      .then(({ data }) => {
        setVideoSrc(data.playback_url || '');
        setVideoId(data.job_id || '');
      })
      .catch(() => {
        setVideoError('No reviewable video found for this candidate yet.');
        setVideoId('');
      })
      .finally(() => setVideoLoading(false));
  }, [sessionId, selectedCandidateId]);

  const selectedCandidate = candidateVideos.find((c) => c.candidate_id === selectedCandidateId);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="hero-banner mb-md">
            <p className="hero-kicker">Review Room</p>
            <h1 style={{ marginBottom: '.3rem' }}>Video Review</h1>
            <p style={{ marginBottom: 0 }}>
              Reviewing: <strong>{selectedCandidate?.candidate_name || selectedCandidateId || 'No candidate available'}</strong>
            </p>
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
                <TranscriptViewer videoId={videoId} currentTimeMs={currentTimeMs} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '72px' }}>
              <div className="card">
                <ReviewerRatingPanel
                  sessionId={sessionId}
                  candidateId={selectedCandidateId}
                />
              </div>
              <div className="card">
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
      </div>
    </>
  );
}
