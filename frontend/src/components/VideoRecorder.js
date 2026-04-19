import React, { useRef, useState } from 'react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

export default function VideoRecorder({ sessionId, candidateId, candidateName, onComplete }) {
  const videoRef = useRef(null);
  const { recording, startRecording, stopRecording } = useMediaRecorder(sessionId, candidateId, candidateName);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      await startRecording(stream);
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        await startRecording(stream);
      } catch (fallbackErr) {
        const message = fallbackErr?.message || err?.message || 'Unable to access camera/microphone.';
        setError(message);
      }
    }
  }

  async function handleStop() {
    setStopping(true);
    await stopRecording();
    if (videoRef.current) videoRef.current.srcObject = null;
    setStopping(false);
    onComplete?.();
  }

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{
        background: '#000',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        aspectRatio: '16/9',
        marginBottom: '1rem',
        position: 'relative',
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {recording && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: '#dc2626', color: '#fff',
            borderRadius: '99px', padding: '3px 10px',
            fontSize: '.75rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
            REC
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '.75rem' }}>
        {!recording ? (
          <button className="btn btn-primary" onClick={handleStart}>
            Start Recording
          </button>
        ) : (
          <button className="btn btn-danger" onClick={handleStop} disabled={stopping}>
            {stopping ? 'Saving…' : 'Stop & Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
