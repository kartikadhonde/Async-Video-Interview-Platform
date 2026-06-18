// Purpose: Render reusable UI components.

import React, { useRef } from 'react';

// Main flow: Initialize dependencies and run module logic.

export default function VideoPlayer({ src, onTimeUpdate }) {
  const videoRef = useRef(null);

  // Function: handleTimeUpdate - Handles time update.
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
