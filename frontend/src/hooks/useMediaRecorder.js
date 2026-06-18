// Purpose: Share reusable hook and state logic.

import { useRef, useState } from 'react';
import { uploadChunk } from '../services/upload.service';

// Main flow: Initialize dependencies and run module logic.

/**
 * Hook wrapping the browser MediaRecorder API with chunked upload.
 */
export function useMediaRecorder(sessionId, candidateId, candidateName = '') {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  // Function: getFallbackUserMedia - Returns fallback user media.
  async function getFallbackUserMedia() {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      // Some systems expose no active microphone; allow video-only as fallback.
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  // Function: startRecording - Starts recording.
  async function startRecording(existingStream) {
    const stream = existingStream || await getFallbackUserMedia();
    // Pick the best mimeType that includes audio (opus) so Whisper has audio to transcribe
    const mimeType = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ].find(t => MediaRecorder.isTypeSupported(t)) || '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;
    streamRef.current = stream;
    chunksRef.current = [];

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
    setRecording(true);
  }

  // Function: stopRecording - Handles stop recording.
  async function stopRecording(uploadMeta = {}) {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }

      recorder.onstop = async () => {
        const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (finalBlob.size > 0) {
          await uploadChunk(
            finalBlob,
            sessionId,
            candidateId,
            true,
            candidateName,
            uploadMeta.questionBoundaries || []
          );
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        setRecording(false);
        resolve();
      };

      recorder.stop();
    });
  }

  return { recording, startRecording, stopRecording };
}
