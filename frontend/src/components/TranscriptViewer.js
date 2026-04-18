import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

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

    function fetchTranscript() {
      api.get(`/transcription/by-video/${videoId}`)
        .then(({ data }) => {
          setTranscript(data);
          setStatus('ready');
          clearInterval(pollRef.current);
        })
        .catch(() => {
          // Not ready yet — keep polling
          setStatus('pending');
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
