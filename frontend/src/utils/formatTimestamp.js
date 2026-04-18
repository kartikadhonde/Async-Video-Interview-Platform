/**
 * Convert milliseconds to mm:ss display format.
 * @param {number} ms
 * @returns {string} e.g. "01:34"
 */
export function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
