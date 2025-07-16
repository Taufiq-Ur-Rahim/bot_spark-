import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { getSummary, getUserSessions } from '../api/interview';
import './css/SummaryPage.css';

function SummaryPage({ user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (user && user.role === 'admin') {
    return (
      <div className="text-center mt-5">
        <Alert variant="info" className="shadow-sm" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-center mb-2">
            <span className="fs-1 me-3">🤖</span>
          </div>
          <h5>Admins do not have interview summaries.</h5>
          <p className="mb-0 text-muted">Please use the dashboard to view candidate results.</p>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    // Fetch the latest session summary for the current user
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        // Get all sessions for the current user
        const sessionsData = await getUserSessions();
        if (!sessionsData || sessionsData.length === 0) {
          throw new Error('No interview sessions found.');
        }
        
        // Get the latest session
        const latestSession = sessionsData[sessionsData.length - 1];
        console.log('Latest session:', latestSession);
        
        // Get detailed summary for the latest session
        const summaryData = await getSummary(latestSession.id);
        console.log('Summary data:', summaryData);
        
        if (summaryData && summaryData.sessionquestion_set) {
          setSummary({
            score: summaryData.score || 0,
            startTime: summaryData.start_time,
            endTime: summaryData.end_time,
            questions: summaryData.sessionquestion_set.map(q => ({
              question: q.question.text,
              answer: q.response || '',
              correct: q.is_correct || false,
              time: q.response_time || 0,
            })),
          });
        } else {
          throw new Error('Invalid summary data received.');
        }
      } catch (err) {
        console.error('Summary fetch error:', err);
        setError(err.message || 'Failed to load summary. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    return '💪';
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <div className="mt-3 text-muted">Loading your interview summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center mt-5">
        <Alert variant="danger" className="w-100 shadow-sm" style={{ maxWidth: 600, borderRadius: 12 }}>
          <Alert.Heading className="d-flex align-items-center">
            <span className="me-2">⚠️</span>
            Summary Error
          </Alert.Heading>
          <p className="mb-0">{error}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => window.location.reload()} className="px-4">
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center mt-5">
        <Alert variant="info" className="shadow-sm" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-center mb-2">
            <span className="fs-1 me-3">📊</span>
          </div>
          <h5>No Interview Summary Available</h5>
          <p className="mb-0 text-muted">Please complete an interview first to see your results.</p>
        </Alert>
      </div>
    );
  }

  return (
    <Row className="justify-content-center mt-4">
      <Col md={10} lg={8}>
        <Card className="shadow-lg summary-card animate__animated animate__fadeIn" style={{ 
          borderRadius: 16, 
          border: 'none',
          background: 'var(--bs-body-bg)',
          backdropFilter: 'blur(10px)'
        }}>
          <Card.Body className="p-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <Card.Title className="fs-2 fw-bold mb-1" style={{ color: 'var(--bs-heading-color)' }}>
                  Interview Summary
                </Card.Title>
                {summary.startTime && summary.endTime && (
                  <div className="text-muted small">
                    Completed on {new Date(summary.endTime).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-end">
                <Badge 
                  bg={getScoreColor(summary.score)} 
                  className="fs-4 px-3 py-2 shadow-sm"
                  style={{ borderRadius: 12 }}
                >
                  {getScoreEmoji(summary.score)} {summary.score.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Stats Cards */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-center border-0 shadow-sm" style={{ 
                  borderRadius: 12, 
                  background: 'var(--bs-light)',
                  border: '1px solid var(--bs-border-color)'
                }}>
                  <Card.Body className="py-3">
                    <div className="fs-4 fw-bold text-primary">{summary.questions.length}</div>
                    <div className="text-muted small">Total Questions</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-0 shadow-sm" style={{ 
                  borderRadius: 12, 
                  background: 'var(--bs-light)',
                  border: '1px solid var(--bs-border-color)'
                }}>
                  <Card.Body className="py-3">
                    <div className="fs-4 fw-bold text-success">
                      {summary.questions.filter(q => q.correct).length}
                    </div>
                    <div className="text-muted small">Correct Answers</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-0 shadow-sm" style={{ 
                  borderRadius: 12, 
                  background: 'var(--bs-light)',
                  border: '1px solid var(--bs-border-color)'
                }}>
                  <Card.Body className="py-3">
                    <div className="fs-4 fw-bold text-info">
                      {Math.round(summary.questions.reduce((acc, q) => acc + q.time, 0) / summary.questions.length)}s
                    </div>
                    <div className="text-muted small">Avg Time</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Questions Table */}
            <div className="table-responsive">
              <Table hover className="summary-table border-0" style={{ borderRadius: 12, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--bs-light)' }}>
                    <th className="border-0 py-3" style={{ fontWeight: 600 }}>#</th>
                    <th className="border-0 py-3" style={{ fontWeight: 600 }}>Question</th>
                    <th className="border-0 py-3" style={{ fontWeight: 600 }}>Your Answer</th>
                    <th className="border-0 py-3" style={{ fontWeight: 600 }}>Result</th>
                    <th className="border-0 py-3" style={{ fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.questions.map((row, idx) => (
                    <tr key={idx} className="border-0" style={{
                      background: row.correct ? 'var(--bs-success-bg-subtle)' : 'var(--bs-danger-bg-subtle)',
                      borderBottom: '1px solid var(--bs-border-color)'
                    }}>
                      <td className="py-3 fw-bold">{idx + 1}</td>
                      <td className="py-3" style={{ maxWidth: 300 }}>{row.question}</td>
                      <td className="py-3" style={{ maxWidth: 200 }}>
                        <div className="text-truncate" title={row.answer || 'No answer'}>
                          {row.answer || 'No answer'}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge 
                          bg={row.correct ? 'success' : 'danger'} 
                          className="px-2 py-1"
                          style={{ borderRadius: 8 }}
                        >
                          {row.correct ? '✅ Correct' : '❌ Incorrect'}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted">{row.time}s</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            
            {/* Action Buttons */}
            <div className="d-flex justify-content-center align-items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
              <div className="text-muted small">
                <span className="me-3">📊 Detailed Analysis</span>
                <span>📈 Performance Insights</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default SummaryPage; 