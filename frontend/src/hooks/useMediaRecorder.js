import { useRef, useState } from 'react';
import { uploadChunk } from '../services/upload.service';

/**
 * Hook wrapping the browser MediaRecorder API with chunked upload.
 */
export function useMediaRecorder(sessionId, candidateId) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  async function getFallbackUserMedia() {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      // Some systems expose no active microphone; allow video-only as fallback.
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

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

  async function stopRecording() {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }

      recorder.onstop = async () => {
        const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (finalBlob.size > 0) {
          await uploadChunk(finalBlob, sessionId, candidateId, true);
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
