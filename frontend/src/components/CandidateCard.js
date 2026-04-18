import React from 'react';

export default function CandidateCard({ session, onReview }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem 0' }}>
      <h3>{session.title}</h3>
      <p>Status: {session.status}</p>
      {session.deadline && <p>Deadline: {new Date(session.deadline).toLocaleDateString()}</p>}
      <button onClick={onReview}>Review</button>
    </div>
  );
}
