import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Connect to the Feedback Service Socket.io server and join a session room.
 * @param {string} sessionId
 * @param {function} onNewComment - called when a co-reviewer posts a comment
 */
export function useSocket(sessionId, onNewComment) {
  const socketRef = useRef(null);
  const onNewCommentRef = useRef(onNewComment);

  useEffect(() => {
    onNewCommentRef.current = onNewComment;
  }, [onNewComment]);

  useEffect(() => {
    if (!sessionId) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL);
    socketRef.current.emit('join-session', sessionId);
    socketRef.current.on('new-comment', (payload) => {
      onNewCommentRef.current?.(payload);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [sessionId]);

  function emitComment(data) {
    socketRef.current?.emit('post-comment', { ...data, sessionId });
  }

  return { emitComment };
}
