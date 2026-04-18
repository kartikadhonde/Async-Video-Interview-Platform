import api from './api';

/**
 * Send a single video chunk to the Upload Service.
 * @param {Blob} chunk - the video chunk from MediaRecorder
 * @param {string} sessionId
 * @param {string} candidateId
 * @param {boolean} isFinal - true for the last chunk
 */
export async function uploadChunk(chunk, sessionId, candidateId, isFinal = false) {
  const formData = new FormData();
  formData.append('chunk', chunk, 'chunk.webm');
  formData.append('session_id', sessionId);
  formData.append('candidate_id', candidateId);
  formData.append('is_final', String(isFinal));

  const { data } = await api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}
