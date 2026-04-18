import React, { useRef } from 'react';

export default function VideoPlayer({ src, onTimeUpdate }) {
  const videoRef = useRef(null);

  function handleTimeUpdate() {
    if (videoRef.current) {
      onTimeUpdate?.(Math.floor(videoRef.current.currentTime * 1000));
    }
  }

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      onTimeUpdate={handleTimeUpdate}
      style={{ width: '100%' }}
    />
  );
}
