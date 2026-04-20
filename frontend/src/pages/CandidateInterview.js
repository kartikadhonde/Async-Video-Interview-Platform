import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

const FALLBACK_FIXED_QUESTIONS = [
  { id: 'q1', text: 'Introduce yourself', time_limit_seconds: 60, order: 1 },
  { id: 'q2', text: 'What project are you proud of?', time_limit_seconds: 60, order: 2 },
  { id: 'q3', text: 'What are your strengths and weaknesses?', time_limit_seconds: 60, order: 3 },
  { id: 'q4', text: 'What do you hope to accomplish by joining our company?', time_limit_seconds: 60, order: 4 },
];

export default function CandidateInterview() {
  const { token } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const interviewStartRef = useRef(null);
  const questionBoundariesRef = useRef([]);

  const candidateName = assignment?.candidate_profile?.full_name || assignment?.candidate_id || '';
  const { startRecording, stopRecording } = useMediaRecorder(
    assignment?.session_id,
    assignment?.candidate_id,
    candidateName
  );

  function nowMsSinceInterviewStart() {
    if (!interviewStartRef.current) return 0;
    return Date.now() - interviewStartRef.current;
  }

  useEffect(() => {
    if (!token) {
      setLoadError('Missing invite token.');
      return;
    }

    async function loadInterview() {
      try {
        const { data } = await api.get(`/scheduling/assignments/${token}`);
        setAssignment(data);

        const fixed = await api.get('/questions/fixed');
        const loadedQuestions = fixed?.data?.questions;
        if (Array.isArray(loadedQuestions) && loadedQuestions.length > 0) {
          setQuestions(loadedQuestions);
        } else {
          setQuestions(FALLBACK_FIXED_QUESTIONS);
        }
      } catch (err) {
        // Keep interview usable even when fixed-question service is temporarily unavailable.
        setQuestions(FALLBACK_FIXED_QUESTIONS);

        const status = err?.response?.status;
        if (status === 401 || status === 404) {
          setLoadError('Could not load interview assignment/questions. Please verify your invite token.');
        }
      }
    }

    loadInterview();
  }, [token]);

  useEffect(() => {
    if (!isRecording || done || !questions.length) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording, done, questions.length, currentQuestion]);

  async function handleStartInterview() {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await startRecording(stream);
      interviewStartRef.current = Date.now();
      questionBoundariesRef.current = [
        {
          question_id: questions[0]?.id || 'q1',
          question_text: questions[0]?.text || '',
          started_at_ms: 0,
          ended_at_ms: null,
        },
      ];
      setIsRecording(true);
      setTimeLeft(60);
    } catch (err) {
      setError(err?.message || 'Could not access camera/microphone.');
    }
  }

  function handleNextQuestion() {
    if (!isRecording || done || !questions.length) return;

    const now = nowMsSinceInterviewStart();
    const qIndex = currentQuestion;
    const updated = [...questionBoundariesRef.current];

    if (updated[qIndex] && updated[qIndex].ended_at_ms == null) {
      updated[qIndex] = {
        ...updated[qIndex],
        ended_at_ms: now,
      };
    }

    if (qIndex + 1 < questions.length) {
      updated.push({
        question_id: questions[qIndex + 1]?.id || `q${qIndex + 2}`,
        question_text: questions[qIndex + 1]?.text || '',
        started_at_ms: now,
        ended_at_ms: null,
      });
      questionBoundariesRef.current = updated;
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(60);
      return;
    }

    handleFinishInterview(updated);
  }

  async function handleFinishInterview(preparedBoundaries = null) {
    if (!isRecording) return;

    const now = nowMsSinceInterviewStart();
    let finalized = preparedBoundaries ? [...preparedBoundaries] : [...questionBoundariesRef.current];
    const idx = currentQuestion;

    if (finalized[idx] && finalized[idx].ended_at_ms == null) {
      finalized[idx] = {
        ...finalized[idx],
        ended_at_ms: now,
      };
    }

    questionBoundariesRef.current = finalized;

    try {
      setIsSubmitting(true);
      await stopRecording({ questionBoundaries: finalized });

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      setIsRecording(false);
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Could not submit interview recording.');
    } finally {
      setIsSubmitting(false);
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
          <div className="mt-md">
            <Link className="btn btn-outline btn-sm" to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion] || null;

  return (
    <div className="page-center" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="container-sm" style={{ width: '100%' }}>
        <PublicTopBar />
        <div className="hero-banner" style={{ marginBottom: '1rem' }}>
          <p className="hero-kicker">Interview in progress</p>
          <h1 style={{ fontSize: '1.45rem', marginBottom: '.35rem' }}>Hi {candidateName}, good luck.</h1>
          <p style={{ marginBottom: 0 }}>You will answer 4 fixed questions in one continuous recording.</p>
        </div>

        <div className="card card-elevated">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <span className="text-muted text-sm">
              Question {currentQuestion + 1} {questions.length > 0 && `of ${questions.length}`}
            </span>
            {isRecording && (
              <span className="badge badge-blue">{timeLeft}s left</span>
            )}
          </div>

          {question && (
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              {question.text}
            </div>
          )}

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
            {isRecording && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#dc2626', color: '#fff',
                borderRadius: '99px', padding: '3px 10px',
                fontSize: '.75rem', fontWeight: 600,
              }}>
                REC
              </div>
            )}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            {!isRecording ? (
              <button className="btn btn-primary" onClick={handleStartInterview} disabled={!questions.length}>
                Start Recording
              </button>
            ) : (
              <>
                {currentQuestion + 1 < questions.length ? (
                  <button className="btn btn-outline" onClick={handleNextQuestion} disabled={isSubmitting}>
                    Done / Next Question
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={() => handleFinishInterview()} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting…' : 'Finish & Submit'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
