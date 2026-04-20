import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const FIXED_QUESTIONS = [
  'Introduce yourself',
  'What project are you proud of?',
  'What are your strengths and weaknesses?',
  'What do you hope to accomplish by joining our company?',
];

const ANSWER_WINDOW_MS = 60 * 1000;

function getBoundaryForQuestion(transcript, questionIndex) {
  const boundaries = Array.isArray(transcript?.question_boundaries) ? transcript.question_boundaries : [];
  const exact = boundaries.find((item) => Number(item.question_index) === questionIndex);
  if (exact && Number.isFinite(Number(exact.start_ms)) && Number.isFinite(Number(exact.end_ms))) {
    return {
      start_ms: Number(exact.start_ms),
      end_ms: Number(exact.end_ms),
      source: 'actual',
    };
  }

  const fallbackStart = (questionIndex - 1) * ANSWER_WINDOW_MS;
  return {
    start_ms: fallbackStart,
    end_ms: fallbackStart + ANSWER_WINDOW_MS,
    source: 'fallback',
  };
}

function buildQuestionBuckets(transcript) {
  const boundaries = FIXED_QUESTIONS.map((_, idx) => getBoundaryForQuestion(transcript, idx + 1));
  const buckets = boundaries.map(() => []);

  for (const seg of transcript.segments || []) {
    const midpoint = (Number(seg.start_ms) + Number(seg.end_ms)) / 2;
    const matchIndex = boundaries.findIndex(
      (boundary) => midpoint >= boundary.start_ms && midpoint < boundary.end_ms
    );

    if (matchIndex >= 0) {
      buckets[matchIndex].push(seg);
      continue;
    }

    // Fallback: if midpoint is outside all ranges, place by start_ms in the nearest prior bucket.
    const byStartIndex = boundaries.findIndex((boundary) => Number(seg.start_ms) < boundary.end_ms);
    if (byStartIndex >= 0) {
      buckets[byStartIndex].push(seg);
    } else {
      buckets[buckets.length - 1].push(seg);
    }
  }

  return { boundaries, buckets };
}

export default function TranscriptViewer({ videoId, currentTimeMs }) {
  const [transcript, setTranscript] = useState(null); // null = not loaded yet
  const [status, setStatus] = useState('loading'); // loading | ready | pending | error
  const pollRef = useRef(null);
  const bucketData = transcript ? buildQuestionBuckets(transcript) : null;

  useEffect(() => {
    if (!videoId) {
      setStatus('pending');
      return;
    }

    setStatus('loading');
    setTranscript(null);

    function fetchTranscript() {
      api.get(`/transcription/by-video/${videoId}`)
        .then(({ data }) => {
          setTranscript(data);
          setStatus('ready');
          clearInterval(pollRef.current);
        })
        .catch((err) => {
          if (err?.response?.status === 404) {
            // Not ready yet — keep polling
            setStatus('pending');
            return;
          }

          // A non-404 error usually means service/auth/network failure.
          setStatus('error');
          clearInterval(pollRef.current);
        });
    }

    fetchTranscript();
    // Poll every 5s until transcript is ready
    pollRef.current = setInterval(fetchTranscript, 5000);

    return () => clearInterval(pollRef.current);
  }, [videoId]);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '.75rem' }}>
        <h3 style={{ margin: 0 }}>Transcript</h3>
        {status === 'pending' && (
          <span className="badge badge-yellow">Processing…</span>
        )}
        {status === 'ready' && (
          <span className="badge badge-green">Ready</span>
        )}
      </div>
      <hr className="divider" />

      {status === 'loading' && <div className="spinner" />}

      {status === 'pending' && (
        <p className="text-muted text-sm">
          Transcription is in progress — this page will update automatically when it's ready.
        </p>
      )}

      {status === 'ready' && transcript && (
        <>
          {transcript.segments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FIXED_QUESTIONS.map((question, idx) => {
                const boundary = bucketData?.boundaries?.[idx];
                const answerSegments = bucketData?.buckets?.[idx] || [];
                return (
                  <div key={question} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '.75rem', background: 'var(--surface-soft)' }}>
                    <p className="text-sm" style={{ marginBottom: '.45rem', color: 'var(--text)', fontWeight: 700 }}>
                      Q{idx + 1}. {question}
                    </p>
                    {boundary.source === 'fallback' && (
                      <p className="text-muted text-sm" style={{ marginBottom: '.45rem' }}>Using estimated timing window.</p>
                    )}
                    {answerSegments.length === 0 ? (
                      <p className="text-muted text-sm" style={{ marginBottom: 0 }}>No clear answer detected in this section.</p>
                    ) : (
                      <p style={{ lineHeight: 1.85, fontSize: '.9rem', marginBottom: 0 }}>
                        {answerSegments.map((seg, i) => {
                          const active = currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms;
                          return (
                            <span
                              key={`${idx}-${i}`}
                              style={{
                                backgroundColor: active ? '#fef08a' : 'transparent',
                                borderRadius: '3px',
                                padding: '1px 2px',
                                transition: 'background-color .15s',
                                fontWeight: active ? 600 : 400,
                              }}
                            >
                              {seg.text}{' '}
                            </span>
                          );
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">{transcript.full_text || 'No speech detected.'}</p>
          )}
        </>
      )}

      {status === 'error' && (
        <p className="text-muted text-sm">Could not load transcript.</p>
      )}
    </div>
  );
}
