import React, { useState, useEffect, useRef } from 'react';
import { Card, Tabs, Tab, Table, Button, Modal, Form, Spinner, Toast, ToastContainer, Row, Col, Alert, Badge } from 'react-bootstrap';
import './css/AdminDashboard.css';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion, bulkImportQuestions, getAdminAnalytics, getAdminCandidates, getAdminCandidateDetail, unblockCandidate, removeCandidateRecords } from '../api/admin';

function AdminDashboard() {
  const [key, setKey] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentQ, setCurrentQ] = useState({ id: null, text: '', topic: '', difficulty: 'Easy', time_required: 60 });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeCandidateId, setRemoveCandidateId] = useState(null);
  const fileInputRef = useRef();

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [questionsData, candidatesData] = await Promise.all([
        getAllQuestions(),
        getAdminCandidates()
      ]);
      setQuestions(questionsData);
      setCandidates(candidatesData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics error:', err);
      setAnalyticsError(err.response?.data?.error || 'Failed to load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchCandidateDetail = async (candidateId) => {
    try {
      const data = await getAdminCandidateDetail(candidateId);
      setCandidateDetail(data);
      setShowCandidateModal(true);
    } catch (err) {
      console.error('Candidate detail error:', err);
      setToastMsg('Failed to load candidate details.');
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (key === 'analytics') {
      fetchAnalytics();
    }
  }, [key]);

  const handleShowModal = (type, q = { id: null, text: '', topic: '', difficulty: 'Easy', time_required: 60 }) => {
    setModalType(type);
    setCurrentQ(q);
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...currentQ,
        difficulty: (currentQ.difficulty || '').toLowerCase(),
      };
      if (modalType === 'add') {
        await createQuestion(payload);
        setToastMsg('Question created successfully!');
      } else {
        await updateQuestion(currentQ.id, payload);
        setToastMsg('Question updated successfully!');
      }
      setShowToast(true);
      setShowModal(false);
      fetchAll();
    } catch (err) {
      setToastMsg(err.response?.data?.error || 'Failed to save question.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteQuestion(deleteId);
      setToastMsg('Question deleted successfully!');
      setShowToast(true);
      setShowDelete(false);
      fetchAll();
    } catch (err) {
      setToastMsg(err.response?.data?.error || 'Failed to delete question.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvRows = [
        ['ID', 'Text', 'Topic', 'Difficulty'],
        ...questions.map(q => [q.id, `"${q.text}"`, q.topic, q.difficulty]),
      ];
      const csvContent = csvRows.map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.csv';
      a.click();
      URL.revokeObjectURL(url);
      setToastMsg('Questions exported!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('Failed to export questions.');
      setShowToast(true);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setToastMsg('Please select a CSV file.');
      setShowToast(true);
      return;
    }
    
    setLoading(true);
    try {
      const result = await bulkImportQuestions(file);
      setToastMsg(`Successfully imported ${result.created} questions!`);
      if (result.errors && result.errors.length > 0) {
        setToastMsg(`Imported ${result.created} questions with ${result.errors.length} errors. Check console for details.`);
        console.log('Import errors:', result.errors);
      }
      setShowToast(true);
      fetchAll();
    } catch (err) {
      console.error('Import error:', err);
      setToastMsg(err.response?.data?.error || 'Failed to import questions.');
      setShowToast(true);
    }
    setLoading(false);
    e.target.value = ''; // Reset file input
  };

  const handleDownloadCandidateSummary = (candidate) => {
    if (!candidateDetail) return;
    
    const csvRows = [
      ['Candidate', 'Email', 'Total Sessions', 'Average Score'],
      [candidate.username, candidate.email, candidate.total_sessions, (candidate.average_score || 0).toFixed(2)],
      [],
      ['Session ID', 'Score', 'Start Time', 'End Time', 'Total Questions', 'Correct Answers', 'Average Time'],
      ...candidateDetail.sessions.map(session => [
        session.id,
        (session.score || 0).toFixed(2),
        new Date(session.start_time).toLocaleString(),
        session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A',
        session.total_questions,
        session.correct_answers,
        Math.round(session.average_time || 0) + 's'
      ]),
      [],
      ['Question', 'Topic', 'Difficulty', 'Response', 'Correct', 'Time (s)']
    ];

    // Add all questions from all sessions
    candidateDetail.sessions.forEach(session => {
      session.questions.forEach(q => {
        csvRows.push([
          `"${q.question_text}"`,
          q.question_topic,
          q.question_difficulty,
          `"${q.response || ''}"`,
          q.is_correct ? 'Yes' : 'No',
          q.response_time || 0
        ]);
      });
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidate.username}_interview_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMsg('Candidate summary downloaded!');
    setShowToast(true);
  };

  const getScoreColor = (score) => {
    const numScore = score || 0;
    if (numScore >= 80) return 'success';
    if (numScore >= 60) return 'warning';
    return 'danger';
  };

  const getScoreEmoji = (score) => {
    const numScore = score || 0;
    if (numScore >= 80) return '🎉';
    if (numScore >= 60) return '👍';
    return '💪';
  };

  const handleUnblockCandidate = async (candidateId) => {
    try {
      await unblockCandidate(candidateId);
      setToastMsg('Candidate unblocked successfully!');
      setShowToast(true);
      fetchAll(); // Refresh the candidates list
    } catch (err) {
      setToastMsg('Failed to unblock candidate.');
      setShowToast(true);
    }
  };

  const handleRemoveCandidate = async () => {
    if (!removeCandidateId) return;
    setLoading(true);
    try {
      await removeCandidateRecords(removeCandidateId);
      setToastMsg('Candidate interview records removed!');
      setShowToast(true);
      setShowRemoveModal(false);
      setRemoveCandidateId(null);
      fetchAll();
    } catch (err) {
      setToastMsg('Failed to remove candidate records.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center mt-4">
      <Col md={10} lg={9}>
        <Card className="shadow-lg admin-card animate__animated animate__fadeIn">
          <Card.Body>
            <div className="text-center mb-4">
              <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 70, marginBottom: '15px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
              <Card.Title className="fs-3 mb-2">BotSpark <span className="text-primary fw-bold">Admin Dashboard</span></Card.Title>
              <p className="text-muted">Manage Questions & Monitor Sessions</p>
            </div>
            <div className="d-flex justify-content-end mb-2 gap-2">
              <Button variant="outline-secondary" onClick={handleExport}>Export Questions (CSV)</Button>
              <Button variant="outline-success" onClick={() => fileInputRef.current.click()}>Import Questions (CSV)</Button>
              <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
              <Button variant="primary" onClick={() => handleShowModal('add')}>Add Question</Button>
            </div>
            <Tabs activeKey={key} onSelect={k => setKey(k)} className="mb-3">
              <Tab eventKey="questions" title="Questions">
                <Table hover responsive className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Text</th>
                      <th>Topic</th>
                      <th>Difficulty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id}>
                        <td>{q.id}</td>
                        <td className="question-text">{q.text}</td>
                        <td>{q.topic}</td>
                        <td>{q.difficulty}</td>
                        <td>
                          <Button size="sm" variant="warning" className="me-2" onClick={() => handleShowModal('edit', q)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => { setDeleteId(q.id); setShowDelete(true); }}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
              <Tab eventKey="candidates" title="Candidates">
                <Table hover responsive className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Total Sessions</th>
                      <th>Average Score</th>
                      <th>Latest Session</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(candidate => (
                      <tr key={candidate.id}>
                        <td>{candidate.username}</td>
                        <td>{candidate.email}</td>
                        <td>{new Date(candidate.date_joined).toLocaleDateString()}</td>
                        <td>
                          <Badge bg="info">{candidate.total_sessions}</Badge>
                        </td>
                        <td>
                          {candidate.average_score && candidate.average_score > 0 ? (
                            <Badge bg={getScoreColor(candidate.average_score)}>
                              {getScoreEmoji(candidate.average_score)} {candidate.average_score.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted">No sessions</span>
                          )}
                        </td>
                        <td>
                          {candidate.latest_session ? (
                            <div>
                              <div className="small">
                                {new Date(candidate.latest_session.start_time).toLocaleDateString()}
                              </div>
                              <Badge bg={getScoreColor(candidate.latest_session.score || 0)}>
                                {(candidate.latest_session.score || 0).toFixed(1)}%
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted">No sessions</span>
                          )}
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="me-2" 
                            onClick={() => fetchCandidateDetail(candidate.id)}
                            disabled={candidate.total_sessions === 0}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger" 
                            className="me-2"
                            onClick={() => { setRemoveCandidateId(candidate.id); setShowRemoveModal(true); }}
                          >
                            Remove
                          </Button>
                          <Button 
                            size="sm" 
                            variant="success" 
                            onClick={() => handleUnblockCandidate(candidate.id)}
                            title="Allow candidate to retake interview"
                          >
                            🔓 Unblock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {/* Remove Confirmation Modal */}
                <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Remove Candidate Interview Records</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p>Are you sure you want to <b>remove all interview records</b> for this candidate? This action cannot be undone.</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={handleRemoveCandidate}>
                      Remove
                    </Button>
                  </Modal.Footer>
                </Modal>
              </Tab>
              <Tab eventKey="analytics" title="Analytics">
                {analyticsLoading ? (
                  <div className="text-center my-4"><Spinner animation="border" /></div>
                ) : analyticsError ? (
                  <Alert variant="danger" className="my-4">{analyticsError}</Alert>
                ) : analytics ? (
                  <div className="my-4">
                    <h5>Total Sessions: {analytics.total_sessions}</h5>
                    <h5>Average Score: {(analytics.avg_score || 0).toFixed(2)}%</h5>
                    
                    {/* Candidates Analytics */}
                    <h6 className="mt-4">Candidate Performance:</h6>
                    <Table hover responsive className="admin-table mb-4">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Total Sessions</th>
                          <th>Average Score</th>
                          <th>Latest Session</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map(candidate => (
                          <tr key={candidate.id}>
                            <td>{candidate.username}</td>
                            <td>
                              <Badge bg="info">{candidate.total_sessions}</Badge>
                            </td>
                            <td>
                              {candidate.average_score && candidate.average_score > 0 ? (
                                <Badge bg={getScoreColor(candidate.average_score)}>
                                  {getScoreEmoji(candidate.average_score)} {candidate.average_score.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-muted">No sessions</span>
                              )}
                            </td>
                            <td>
                              {candidate.latest_session ? (
                                <div>
                                  <div className="small">
                                    {new Date(candidate.latest_session.start_time).toLocaleDateString()}
                                  </div>
                                  <Badge bg={getScoreColor(candidate.latest_session.score || 0)}>
                                    {(candidate.latest_session.score || 0).toFixed(1)}%
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-muted">No sessions</span>
                              )}
                            </td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="primary" 
                                onClick={() => fetchCandidateDetail(candidate.id)}
                                disabled={candidate.total_sessions === 0}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    <h6 className="mt-4">Topic Stats:</h6>
                    <Table bordered size="sm" className="mb-4">
                      <thead><tr><th>Topic</th><th>Total</th><th>Missed</th></tr></thead>
                      <tbody>
                        {Object.entries(analytics.topic_stats).map(([topic, stat]) => (
                          <tr key={topic}><td>{topic}</td><td>{stat.total}</td><td>{stat.missed}</td></tr>
                        ))}
                      </tbody>
                    </Table>
                    <h6>Most Missed Questions:</h6>
                    <Table bordered size="sm">
                      <thead><tr><th>Question ID</th><th>Missed Count</th></tr></thead>
                      <tbody>
                        {analytics.most_missed_questions.map(([qid, count]) => (
                          <tr key={qid}><td>{qid}</td><td>{count}</td></tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : null}
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
        {/* Candidate Detail Modal */}
        <Modal show={showCandidateModal} onHide={() => setShowCandidateModal(false)} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {candidateDetail && (
                <>
                  <img src="https://img.icons8.com/ios-filled/50/0056b3/robot-2.png" alt="BotSpark" style={{width: 30, marginRight: '10px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
                  Interview Summary - {candidateDetail.username}
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {candidateDetail && (
              <div>
                {/* Candidate Info */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-muted">Candidate Information</h6>
                        <p className="mb-1"><strong>Username:</strong> {candidateDetail.username}</p>
                        <p className="mb-1"><strong>Email:</strong> {candidateDetail.email}</p>
                        <p className="mb-1"><strong>Joined:</strong> {new Date(candidateDetail.date_joined).toLocaleDateString()}</p>
                        <p className="mb-0"><strong>Total Sessions:</strong> {candidateDetail.total_sessions}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-muted">Performance Overview</h6>
                        <div className="text-center">
                          <Badge 
                            bg={getScoreColor(candidateDetail.average_score || 0)} 
                            className="fs-4 px-3 py-2"
                            style={{ borderRadius: 12 }}
                          >
                            {getScoreEmoji(candidateDetail.average_score || 0)} {(candidateDetail.average_score || 0).toFixed(1)}%
                          </Badge>
                          <div className="text-muted small mt-2">Average Score</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Sessions */}
                <h6 className="mb-3">Interview Sessions</h6>
                {candidateDetail.sessions.map((session, idx) => (
                  <Card key={session.id} className="mb-3 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="mb-1">Session #{session.id}</h6>
                          <small className="text-muted">
                            {new Date(session.start_time).toLocaleString()} - 
                            {session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress'}
                          </small>
                        </div>
                        <div className="text-end">
                          <Badge bg={getScoreColor(session.score || 0)} className="fs-6">
                            {(session.score || 0).toFixed(1)}%
                          </Badge>
                          <div className="small text-muted mt-1">
                            {session.correct_answers}/{session.total_questions} correct
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="table-responsive">
                        <Table size="sm" className="mb-0">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Question</th>
                              <th>Topic</th>
                              <th>Difficulty</th>
                              <th>Response</th>
                              <th>Result</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.questions.map((q, qIdx) => (
                              <tr key={qIdx}>
                                <td>{qIdx + 1}</td>
                                <td style={{ maxWidth: 200 }} className="text-truncate" title={q.question_text}>
                                  {q.question_text}
                                </td>
                                <td>{q.question_topic}</td>
                                <td>
                                  <Badge bg={q.question_difficulty === 'hard' ? 'danger' : q.question_difficulty === 'medium' ? 'warning' : 'success'} size="sm">
                                    {q.question_difficulty}
                                  </Badge>
                                </td>
                                <td style={{ maxWidth: 150 }} className="text-truncate" title={q.response || 'No answer'}>
                                  {q.response || 'No answer'}
                                </td>
                                <td>
                                  <Badge bg={q.is_correct ? 'success' : 'danger'} size="sm">
                                    {q.is_correct ? '✅' : '❌'}
                                  </Badge>
                                </td>
                                <td>{q.response_time || 0}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCandidateModal(false)}>
              Close
            </Button>
            {candidateDetail && (
              <Button 
                variant="primary" 
                onClick={() => handleDownloadCandidateSummary(candidateDetail)}
              >
                📥 Download Summary (CSV)
              </Button>
            )}
          </Modal.Footer>
        </Modal>
        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{modalType === 'add' ? 'Add Question' : 'Edit Question'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Text</Form.Label>
                <Form.Control type="text" value={currentQ.text} onChange={e => setCurrentQ({ ...currentQ, text: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Topic</Form.Label>
                <Form.Control type="text" value={currentQ.topic} onChange={e => setCurrentQ({ ...currentQ, topic: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Difficulty</Form.Label>
                <Form.Select value={currentQ.difficulty} onChange={e => setCurrentQ({ ...currentQ, difficulty: e.target.value })}>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Time Required (seconds)</Form.Label>
                <Form.Control type="number" min={10} max={600} value={currentQ.time_required} onChange={e => setCurrentQ({ ...currentQ, time_required: parseInt(e.target.value) || 60 })} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Save'}
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Delete Confirmation Modal */}
        <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this question?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={loading}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Toasts */}
        <ToastContainer position="bottom-end" className="p-3">
          <Toast show={showToast} onClose={() => setShowToast(false)} delay={2000} autohide bg="info">
            <Toast.Body>{toastMsg}</Toast.Body>
          </Toast>
        </ToastContainer>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <div className="text-center my-3"><Spinner animation="border" /></div>}
      </Col>
    </Row>
  );
}

export default AdminDashboard; 