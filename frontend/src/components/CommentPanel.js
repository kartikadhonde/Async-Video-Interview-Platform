// Purpose: Render reusable UI components.

import React, { useState } from 'react';
import { formatTimestamp } from '../utils/formatTimestamp';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// Main flow: Initialize dependencies and run module logic.

export default function CommentPanel({ comments, sessionId, candidateId, currentTimeMs, onNewComment }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [timestampInput, setTimestampInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function: parseTimestampToMs - Handles parse timestamp to ms.
  function parseTimestampToMs(raw) {
    const value = String(raw || '').trim();
    if (!value) return currentTimeMs;
    const parts = value.split(':').map((part) => Number(part));
    if (parts.length !== 2 || parts.some((num) => Number.isNaN(num) || num < 0)) return null;
    const [minutes, seconds] = parts;
    return (minutes * 60 + seconds) * 1000;
  }

  // Function: handleSubmit - Handles submit.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !candidateId) return;

    const selectedTimestampMs = parseTimestampToMs(timestampInput);
    if (selectedTimestampMs === null) {
      setInputError('Timestamp must be in mm:ss format (example: 02:15).');
      return;
    }

    setInputError('');

    setLoading(true);
    try {
      const { data } = await api.post('/feedback/comments', {
        session_id: sessionId,
        candidate_id: candidateId,
        reviewer_id: user?.id,
        video_timestamp_ms: selectedTimestampMs,
        text,
      });
      onNewComment(data);
      setText('');
      setTimestampInput('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Comments <span className="text-muted text-sm">({comments.length})</span></h3>
      <hr className="divider" />

      <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {comments.length === 0 && <p className="text-muted text-sm">No comments yet.</p>}
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <label className="form-label">
          Add comment at <span className="badge badge-blue">{formatTimestamp(parseTimestampToMs(timestampInput) ?? currentTimeMs)}</span>
        </label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="form-input"
            value={timestampInput}
            onChange={(e) => {
              setTimestampInput(e.target.value);
              setInputError('');
            }}
            placeholder="mm:ss (leave empty for current video time)"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setTimestampInput(formatTimestamp(currentTimeMs))}
          >
            Use current
          </button>
        </div>
        {inputError && <p className="text-sm" style={{ color: 'var(--danger)', margin: 0 }}>{inputError}</p>}
        <textarea
          className="form-input"
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your comment…"
          style={{ resize: 'vertical' }}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </div>
  );
}
