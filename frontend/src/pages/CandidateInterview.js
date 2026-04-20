import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';
import { uploadChunk } from '../services/upload.service';

const QUESTION_LIMIT_SECONDS = 60;

export default function CandidateInterview() {
  const { token } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [recording, setRecording] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [questionEndsAt, setQuestionEndsAt] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(QUESTION_LIMIT_SECONDS);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const interviewStartedAtRef = useRef(0);
  const currentQuestionStartedAtMsRef = useRef(0);
  const questionBoundariesRef = useRef([]);

  const candidateName = assignment?.candidate_profile?.full_name || assignment?.candidate_id;

  const activeQuestion = useMemo(() => questions[currentQuestion], [questions, currentQuestion]);

  useEffect(() => {
    if (!token) {
      setLoadError('Missing invite token.');
      return;
    }

    async function loadInterview() {
      try {
        const { data: assignmentData } = await api.get(`/scheduling/assignments/${token}`);
        setAssignment(assignmentData);

        const { data: questionData } = await api.get('/questions/fixed');
        setQuestions(questionData?.questions || []);
      } catch {
        setLoadError('Could not load interview assignment/questions. Please verify services are running.');
      }
    }

    loadInterview();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [token]);

  useEffect(() => {
    if (!recording || !questionEndsAt) return;

    const timer = window.setInterval(() => {
      const remainingMs = Math.max(questionEndsAt - Date.now(), 0);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setTimeLeftSeconds(remainingSeconds);

      if (remainingMs <= 0) {
        handleNextQuestion();
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [recording, questionEndsAt, currentQuestion, questions.length]);

  function setupRecorder(stream) {
    const mimeType = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ].find((t) => window.MediaRecorder?.isTypeSupported(t)) || '';

    const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
  }

  function upsertQuestionBoundary(questionIndex, startMs, endMs) {
    if (questionIndex < 1 || questionIndex > questions.length) return;
    const safeStart = Math.max(0, Math.floor(startMs));
    const safeEnd = Math.max(safeStart, Math.floor(endMs));

    const boundary = {
      question_index: questionIndex,
      question_text: questions[questionIndex - 1]?.text || '',
      start_ms: safeStart,
      end_ms: safeEnd,
    };

    const existingIndex = questionBoundariesRef.current.findIndex((item) => item.question_index === questionIndex);
    if (existingIndex >= 0) {
      questionBoundariesRef.current[existingIndex] = boundary;
    } else {
      questionBoundariesRef.current.push(boundary);
    }
  }

  function finalizeCurrentQuestionBoundary() {
    if (!recording || !interviewStartedAtRef.current) return;
    const questionIndex = currentQuestion + 1;
    const elapsedMs = Date.now() - interviewStartedAtRef.current;
    upsertQuestionBoundary(questionIndex, currentQuestionStartedAtMsRef.current, elapsedMs);
  }

  async function handleStartRecording() {
    try {
      setRecordError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      setupRecorder(stream);
      mediaRecorderRef.current.start();
      setRecording(true);
      setCurrentQuestion(0);
      setQuestionEndsAt(Date.now() + QUESTION_LIMIT_SECONDS * 1000);
      setTimeLeftSeconds(QUESTION_LIMIT_SECONDS);
      interviewStartedAtRef.current = Date.now();
      currentQuestionStartedAtMsRef.current = 0;
      questionBoundariesRef.current = [];
    } catch (primaryError) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setupRecorder(stream);
        mediaRecorderRef.current.start();
        setRecording(true);
        setCurrentQuestion(0);
        setQuestionEndsAt(Date.now() + QUESTION_LIMIT_SECONDS * 1000);
        setTimeLeftSeconds(QUESTION_LIMIT_SECONDS);
        interviewStartedAtRef.current = Date.now();
        currentQuestionStartedAtMsRef.current = 0;
        questionBoundariesRef.current = [];
      } catch (fallbackError) {
        setRecordError(fallbackError?.message || primaryError?.message || 'Unable to access camera/microphone.');
      }
    }
  }

  async function finishInterview() {
    if (!assignment || !recording || stopping) return;
    setStopping(true);
    finalizeCurrentQuestionBoundary();

    await new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }

      recorder.onstop = async () => {
        try {
          const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
          if (finalBlob.size > 0) {
            const orderedBoundaries = [...questionBoundariesRef.current].sort((a, b) => a.question_index - b.question_index);
            await uploadChunk(
              finalBlob,
              assignment.session_id,
              assignment.candidate_id,
              true,
              candidateName,
              orderedBoundaries
            );
          }
        } finally {
          resolve();
        }
      };

      recorder.stop();
    });

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRecording(false);
    setStopping(false);
    setDone(true);
    interviewStartedAtRef.current = 0;
    currentQuestionStartedAtMsRef.current = 0;
    questionBoundariesRef.current = [];
  }

  function handleNextQuestion() {
    if (!recording || stopping) return;
    finalizeCurrentQuestionBoundary();

    if (currentQuestion + 1 < questions.length) {
      const elapsedMs = interviewStartedAtRef.current ? Date.now() - interviewStartedAtRef.current : 0;
      currentQuestionStartedAtMsRef.current = Math.max(0, Math.floor(elapsedMs));
      setCurrentQuestion((q) => q + 1);
      setQuestionEndsAt(Date.now() + QUESTION_LIMIT_SECONDS * 1000);
      setTimeLeftSeconds(QUESTION_LIMIT_SECONDS);
    } else {
      finishInterview();
    }
  }

  if (!assignment || questions.length === 0) {
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

  return (
    <div className="page-center" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="container-sm" style={{ width: '100%' }}>
        <PublicTopBar />
        <div className="hero-banner" style={{ marginBottom: '1rem' }}>
          <p className="hero-kicker">Interview in progress</p>
          <h1 style={{ fontSize: '1.45rem', marginBottom: '.35rem' }}>Hi {candidateName}, good luck.</h1>
          <p style={{ marginBottom: 0 }}>One continuous recording will capture all 4 questions. Move next any time or wait for auto-next at 60s.</p>
        </div>

        <div className="card card-elevated">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <span className="text-muted text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {recording ? (
              <span className="badge badge-blue">{timeLeftSeconds}s left</span>
            ) : (
              <span className="badge badge-blue">{QUESTION_LIMIT_SECONDS}s each</span>
            )}
          </div>

          {activeQuestion && (
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              {activeQuestion.text}
            </div>
          )}

          {recordError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{recordError}</div>}

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
            {recording && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#dc2626', color: '#fff',
                borderRadius: '99px', padding: '3px 10px',
                fontSize: '.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                REC
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            {!recording ? (
              <button className="btn btn-primary" onClick={handleStartRecording} type="button">
                Start Interview Recording
              </button>
            ) : (
              <>
                <button className="btn btn-outline" onClick={handleNextQuestion} type="button" disabled={stopping}>
                  {currentQuestion + 1 < questions.length ? 'Done / Next' : 'Done / Finish'}
                </button>
                <button className="btn btn-danger" onClick={finishInterview} type="button" disabled={stopping}>
                  {stopping ? 'Saving final video...' : 'Finish Interview'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
