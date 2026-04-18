import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function TranscriptViewer({ sessionId, currentTimeMs }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/transcription/${sessionId}`)
      .then(({ data }) => setSegments(data.segments || []))
      .catch(() => setSegments([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div>
      <h3>Transcript</h3>
      <hr className="divider" />
      {loading && <div className="spinner" />}
      {!loading && segments.length === 0 && (
        <p className="text-muted text-sm">Transcript not available yet — check back after transcription completes.</p>
      )}
      <p style={{ lineHeight: 1.8, fontSize: '.9rem' }}>
        {segments.map((seg, i) => (
          <span
            key={i}
            style={{
              backgroundColor:
                currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms
                  ? '#fef08a'
                  : 'transparent',
              borderRadius: '3px',
              padding: '0 2px',
              transition: 'background-color .2s',
            }}
          >
            {seg.text}{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
