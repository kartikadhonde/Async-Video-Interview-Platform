import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';

export default function CandidateInterview() {
  const { token } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoadError('Missing invite token.');
      return;
    }

    api.get(`/scheduling/assignments/${token}`).then(async ({ data }) => {
      setAssignment(data);
      if (data.session_id) {
        const session = await api.get(`/scheduling/sessions/${data.session_id}`);
        if (session.data.question_set_id) {
          const qs = await api.get(`/scheduling/question-sets/${session.data.question_set_id}`);
          setQuestions(qs.data.questions || []);
        }
      }
    }).catch(() => {
      setLoadError('Could not load interview assignment. Please verify your invite token.');
    });
  }, [token]);

  function handleComplete() {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(q => q + 1);
    } else {
      setDone(true);
    }
  }

  if (!assignment) {
    return (
      <div className="page-center">
        {loadError ? (
          <div className="card container-sm" style={{ textAlign: 'center' }}>
            <h2>Unable to start interview</h2>
            <p>{loadError}</p>
          </div>
        ) : <div className="spinner" />}
      </div>
    );
  }

  if (done) {
    return (
      <div className="page-center">
        <div className="card container-sm" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h2>Interview Complete</h2>
          <p>Thank you for completing your interview. You will hear back from us soon.</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const candidateName = assignment?.candidate_profile?.full_name || assignment?.candidate_id;

  return (
    <div className="page-center" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="container-sm" style={{ width: '100%' }}>
        <PublicTopBar />
        <div className="hero-banner" style={{ marginBottom: '1rem' }}>
          <p className="hero-kicker">Interview in progress</p>
          <h1 style={{ fontSize: '1.45rem', marginBottom: '.35rem' }}>Hi {candidateName}, good luck.</h1>
          <p style={{ marginBottom: 0 }}>Keep your answers clear and concise. Recording starts only when you click the button.</p>
        </div>

        <div className="card card-elevated">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <span className="text-muted text-sm">
              Question {currentQuestion + 1} {questions.length > 0 && `of ${questions.length}`}
            </span>
            {question?.time_limit_seconds && (
              <span className="badge badge-blue">{question.time_limit_seconds}s limit</span>
            )}
          </div>

          {question && (
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              {question.text}
            </div>
          )}

          <VideoRecorder
            sessionId={assignment.session_id}
            candidateId={assignment.candidate_id}
            candidateName={candidateName}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
