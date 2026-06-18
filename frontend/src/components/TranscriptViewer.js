// Purpose: Render reusable UI components.

import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

// Main flow: Initialize dependencies and run module logic.

export default function TranscriptViewer({ videoId, currentTimeMs }) {
  const [transcript, setTranscript] = useState(null); // null = not loaded yet
  const [status, setStatus] = useState('loading'); // loading | ready | pending | error
  const pollRef = useRef(null);

  useEffect(() => {
    if (!videoId) {
      setStatus('pending');
      return;
    }

    setStatus('loading');
    setTranscript(null);

    // Function: fetchTranscript - Handles fetch transcript.
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

  // Function: renderSplitByQuestions - Handles render split by questions.
  function renderSplitByQuestions() {
    if (!transcript || !Array.isArray(transcript.segments) || transcript.segments.length === 0) {
      return <p className="text-muted text-sm">No speech detected.</p>;
    }

    const boundaries = Array.isArray(transcript.question_boundaries) ? transcript.question_boundaries : [];

    if (!boundaries.length) {
      return (
        <p style={{ lineHeight: 1.9, fontSize: '.9rem' }}>
          {transcript.segments.map((seg, i) => {
            const active = currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms;
            return (
              <span
                key={i}
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
      );
    }

    const normalized = boundaries
      .map((b, idx) => ({
        idx,
        questionText: b.question_text || `Question ${idx + 1}`,
        startMs: Number(b.started_at_ms ?? idx * 60000) || 0,
        endMs: Number.isFinite(Number(b.ended_at_ms)) ? Number(b.ended_at_ms) : null,
      }))
      .sort((a, b) => a.startMs - b.startMs)
      .map((b, idx, arr) => ({
        ...b,
        endMs: b.endMs != null ? b.endMs : (arr[idx + 1]?.startMs ?? Number.MAX_SAFE_INTEGER),
      }));

    const grouped = normalized.map((q) => {
      const matched = transcript.segments.filter((seg) => {
        const midpoint = (Number(seg.start_ms || 0) + Number(seg.end_ms || 0)) / 2;
        return midpoint >= q.startMs && midpoint < q.endMs;
      });

      return { ...q, segments: matched };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
        {grouped.map((q, i) => (
          <div key={`${q.idx}-${q.startMs}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.75rem' }}>
            <p style={{ margin: 0, marginBottom: '.5rem', fontWeight: 700 }}>Q{i + 1}. {q.questionText}</p>
            {q.segments.length ? (
              <p style={{ margin: 0, lineHeight: 1.8, fontSize: '.9rem' }}>
                {q.segments.map((seg, idx) => {
                  const active = currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms;
                  return (
                    <span
                      key={`${q.idx}-seg-${idx}`}
                      style={{
                        backgroundColor: active ? '#fef08a' : 'transparent',
                        borderRadius: '3px',
                        padding: '1px 2px',
                        fontWeight: active ? 600 : 400,
                        transition: 'background-color .15s',
                      }}
                    >
                      {seg.text}{' '}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p className="text-muted text-sm" style={{ margin: 0 }}>No spoken content captured for this answer.</p>
            )}
          </div>
        ))}
      </div>
    );
  }

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
        <>{renderSplitByQuestions()}</>
      )}

      {status === 'error' && (
        <p className="text-muted text-sm">Could not load transcript.</p>
      )}
    </div>
  );
}
