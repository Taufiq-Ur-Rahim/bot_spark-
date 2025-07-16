import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Spinner, Alert, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import { fetchQuestions, submitAnswers } from '../api/interview';
import { listen } from '../utils/voice';
import './css/InterviewPage.css';

const QUESTION_TIME_LIMIT = 60; // seconds per question
const TOTAL_INTERVIEW_TIME = 120; // 2 minutes total interview time

function InterviewPage({ user }) {
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // {type: 'question'|'answer', text: string}
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // [{answer, time}]
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [timer, setTimer] = useState(QUESTION_TIME_LIMIT);
  const [totalTimer, setTotalTimer] = useState(TOTAL_INTERVIEW_TIME);
  const [listening, setListening] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const chatEndRef = useRef(null);
  const timerRef = useRef();
  const totalTimerRef = useRef();

  // Check if user is blocked from taking interview
  const isBlocked = user && user.role === 'candidate' && (user.has_completed_interview || user.is_blocked_from_interview);

  // Start interview only once
  useEffect(() => {
    // Don't auto-start interview anymore
  }, []);

  const handleStartInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchQuestions();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setSessionId(data.session_id);
        setMessages([{ type: 'question', text: data.questions[0]?.text || '' }]);
        setProgress(1 / data.questions.length * 100);
        setAnswers(Array(data.questions.length).fill({ answer: '', time: QUESTION_TIME_LIMIT }));
        setTimer(QUESTION_TIME_LIMIT);
        setTotalTimer(TOTAL_INTERVIEW_TIME);
        setInterviewStarted(true);
      } else {
        setError('No questions available for interview.');
      }
    } catch (err) {
      console.error('Interview start error:', err);
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = useCallback(async (val, auto = false) => {
    if (!val.trim() && !auto) return;
    
    const newAnswers = [...answers];
    newAnswers[current] = { answer: val, time: QUESTION_TIME_LIMIT - timer };
    setAnswers(newAnswers);
    setMessages(prev => [...prev, { type: 'answer', text: val }]);
    setAnswer('');
    
    if (current < questions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'question', text: questions[current + 1].text }]);
        setCurrent(prev => prev + 1);
        setProgress(((current + 2) / questions.length) * 100);
      }, 500);
    } else {
      setReviewMode(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [answers, current, questions, timer]);

  // Total interview timer effect
  useEffect(() => {
    if (interviewStarted && !reviewMode && !timeUp && !loading) {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      
      totalTimerRef.current = setInterval(() => {
        setTotalTimer(t => {
          if (t <= 1) {
            setTimeUp(true);
            setReviewMode(true);
            if (timerRef.current) clearInterval(timerRef.current);
            if (totalTimerRef.current) clearInterval(totalTimerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      
      return () => {
        if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      };
    }
  }, [interviewStarted, reviewMode, timeUp, loading]);

  // Question timer effect
  useEffect(() => {
    if (interviewStarted && !reviewMode && !timeUp && !loading) {
      setTimer(QUESTION_TIME_LIMIT);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            handleAnswer(answer, true);
            return QUESTION_TIME_LIMIT;
          }
          return t - 1;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [current, interviewStarted, reviewMode, timeUp, loading, handleAnswer, answer]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = async () => {
    setListening(true);
    try {
      const transcript = await listen();
      setAnswer(transcript);
      setToastMsg('Voice input captured!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('Voice input failed.');
      setShowToast(true);
    }
    setListening(false);
  };

  const handleVoiceOutput = () => {
    if (!questions[current] || !questions[current].text) {
      setToastMsg('No question to read aloud.');
      setShowToast(true);
      return;
    }
    if (!window.speechSynthesis) {
      setToastMsg('Speech synthesis not supported in this browser.');
      setShowToast(true);
      return;
    }
    setSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(questions[current].text);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const handleReviewChange = (idx, val) => {
    const newAnswers = [...answers];
    newAnswers[idx] = { ...newAnswers[idx], answer: val };
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitAnswers({
        session_id: sessionId,
        answers: answers.map((a, i) => ({
          question_id: questions[i].id,
          response: a.answer,
          response_time: a.time,
        })),
      });
      setToastMsg('Interview submitted successfully!');
      setShowToast(true);
      setReviewMode(false);
    } catch (err) {
      setToastMsg('Failed to submit answers.');
      setShowToast(true);
    }
    setSubmitting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <div className="mt-3">Starting your interview...</div>
      </div>
    );
  }

  // Welcome screen - show before interview starts
  if (!interviewStarted) {
    if (isBlocked) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
          <div className="text-center mb-5">
            <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 80, marginBottom: '20px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
            <h2 className="text-primary mb-3">Interview Access Restricted</h2>
            <p className="text-muted mb-4" style={{ fontSize: '18px', maxWidth: '520px' }}>
              <strong>Your access to the interview is currently restricted.</strong><br/>
              {user.has_completed_interview
                ? "You have already completed your interview. To request another attempt, please contact the BotSpark administrator."
                : "You are currently blocked from taking interviews. Please contact the BotSpark administrator to resolve this issue."
              }
            </p>
            <div className="mb-4">
              <h5 className="text-dark mb-3">How to proceed:</h5>
              <ul className="text-start" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <li>📧 Contact the BotSpark administrator</li>
                <li>🔓 Request to unlock your account for a new interview</li>
                <li>⏳ Wait for admin approval</li>
              </ul>
            </div>
            <div className="alert alert-info" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <b>Tip:</b> If you believe this is a mistake, reach out to support for quick assistance.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="text-center mb-5">
          <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 80, marginBottom: '20px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
          <h2 className="text-primary mb-3">Welcome to BotSpark Interview</h2>
          <p className="text-muted mb-4" style={{ fontSize: '18px', maxWidth: '500px' }}>
            Get ready for your AI-powered interview experience! You'll have 2 minutes to answer questions with voice or text input.
          </p>
          <div className="mb-4">
            <h5 className="text-dark mb-3">📋 Interview Guidelines:</h5>
            <ul className="text-start" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <li>⏱️ <strong>2 minutes</strong> total interview time</li>
              <li>📝 <strong>11 questions</strong> to answer</li>
              <li>🎤 Use voice input or type your answers</li>
              <li>🔊 Listen to questions with audio playback</li>
              <li>📋 Review and submit your answers at the end</li>
            </ul>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleStartInterview}
            disabled={loading}
            style={{ fontSize: '18px', padding: '12px 30px' }}
          >
            {loading ? <Spinner size="sm" animation="border" /> : '🚀 Start Interview'}
          </Button>
        </div>
        {error && <Alert variant="danger" className="w-100" style={{ maxWidth: 600 }}>{error}</Alert>}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center mt-5">
        <Alert variant="danger" className="w-100" style={{ maxWidth: 600 }}>
          <Alert.Heading>Interview Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="interview-chat-container d-flex flex-column align-items-center justify-content-center">
      <div className="text-center mb-4">
        <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 50, marginBottom: '10px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
        <h4 className="text-primary mb-0">BotSpark Interview</h4>
      </div>
      <ProgressBar now={progress} className="mb-3 w-100" style={{ maxWidth: 600 }} />
      <div className="mb-2 text-center w-100" style={{ maxWidth: 600 }}>
        <span className="fw-bold">Question {current + 1} of {questions.length}</span>
        {!reviewMode && !timeUp && (
          <span className="ms-3 badge bg-warning">Total Time Left: {Math.floor(totalTimer / 60)}:{(totalTimer % 60).toString().padStart(2, '0')}</span>
        )}
        {timeUp && <span className="ms-3 badge bg-danger">Time's up!</span>}
      </div>
      {!reviewMode ? (
        <>
          <div className="chat-window card shadow-sm mb-3 w-100 animate__animated animate__fadeIn" style={{ maxWidth: 600, minHeight: 350, background: '#f8f9fa' }}>
            <div className="card-body d-flex flex-column" style={{ overflowY: 'auto', maxHeight: 350 }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.type === 'question' ? 'question-bubble' : 'answer-bubble'} mb-2 animate__animated animate__fadeInUp`} style={{
                  borderRadius: 16,
                  padding: '12px 18px',
                  background: msg.type === 'question' ? 'var(--bs-light, #f1f3f6)' : 'var(--bs-primary-bg-subtle, #e3f0ff)',
                  color: msg.type === 'question' ? '#222' : '#0d6efd',
                  alignSelf: msg.type === 'question' ? 'flex-start' : 'flex-end',
                  maxWidth: '90%',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  fontSize: 16,
                  fontWeight: 500,
                }}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="chat-input-bar d-flex align-items-center w-100 animate__animated animate__fadeInUp" style={{ maxWidth: 600, position: 'sticky', bottom: 0, background: 'var(--bs-body-bg, #fff)', zIndex: 2, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Button
              variant={speaking ? 'primary' : 'outline-primary'}
              className={`me-2 listen-btn${speaking ? ' speaking' : ''}`}
              onClick={handleVoiceOutput}
              title="Listen to question"
              disabled={speaking}
              style={{ transition: 'background 0.2s', fontWeight: 600 }}
            >
              {speaking ? <Spinner size="sm" animation="border" /> : '🔊'}
            </Button>
            <input
              className="form-control flex-grow-1"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnswer(answer)}
              placeholder="Type your answer or use the mic"
              disabled={submitting}
              style={{ borderRadius: 8, marginRight: 8, fontSize: 16, background: 'var(--bs-body-bg, #fff)' }}
            />
            <Button variant={listening ? "primary" : "outline-success"} className="ms-2 mic-btn" onClick={handleVoiceInput} title="Answer by voice" style={{ fontWeight: 600 }}>
              {listening ? <span className="mic-anim" /> : <span>🎤</span>}
            </Button>
            <Button variant="primary" className="ms-2" onClick={() => handleAnswer(answer)} disabled={submitting || !answer.trim()} style={{ fontWeight: 600 }}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Send'}
            </Button>
          </div>
        </>
      ) : (
        <div className="review-section w-100 animate__animated animate__fadeIn" style={{ maxWidth: 600 }}>
          {timeUp && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>⏰ Time's Up!</Alert.Heading>
              <p>Your interview time has expired. Please review and submit your answers.</p>
            </Alert>
          )}
          <h5 className="mb-3">Review Your Answers</h5>
          {questions.map((q, idx) => (
            <div key={q.id} className="mb-3">
              <div className="fw-bold mb-1">Q{idx + 1}: {q.text}</div>
              <input
                className="form-control"
                value={answers[idx].answer}
                onChange={e => handleReviewChange(idx, e.target.value)}
                disabled={submitting}
              />
              <div className="text-muted small mt-1">Time: {answers[idx].time}s</div>
            </div>
          ))}
          <Button variant="success" className="mt-2 w-100" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner size="sm" animation="border" /> : 'Submit Interview'}
          </Button>
        </div>
      )}
      <style>{`
        .mic-btn { position: relative; }
        .mic-anim {
          display: inline-block;
          width: 1.5em;
          height: 1.5em;
          border-radius: 50%;
          background: #4e73df;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(78,115,223,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(78,115,223,0); }
          100% { box-shadow: 0 0 0 0 rgba(78,115,223,0); }
        }
      `}</style>
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)}>
          <Toast.Header>
            <strong className="me-auto">BotSpark</strong>
          </Toast.Header>
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}

export default InterviewPage;