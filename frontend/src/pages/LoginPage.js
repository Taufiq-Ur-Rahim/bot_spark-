import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setToken } from '../utils/auth';
import './css/LoginPage.css';

function LoginPage({ onAuthChange }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.access); // JWT access token
      setLoading(false);
      if (onAuthChange) onAuthChange();
      setToastMsg('Login successful!');
      setShowToast(true);
      setTimeout(() => navigate('/interview'), 800);
    } catch (err) {
      setLoading(false);
      setError('Invalid username or password.');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center login-bg" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '22rem' }} className="shadow-lg p-3 mb-5 bg-white rounded animate__animated animate__fadeInDown">
        <Card.Body>
          <div className="text-center mb-4">
            <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 80, marginBottom: '10px', filter: 'drop-shadow(0 2px 4px rgba(0, 86, 179, 0.3))'}} />
            <Card.Title className="mb-2 fs-3">Welcome to <span className="text-primary fw-bold">BotSpark</span></Card.Title>
            <p className="text-muted">AI-Powered Interview Assistant</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit} autoComplete="off">
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Login'}
            </Button>
          </Form>
          <div className="text-center">
            <h6>OR</h6>
          </div>
          <div className="text-center">
            <span>Don't have an account? </span>
            <Link to="/register">Register</Link>
          </div>
        </Card.Body>
      </Card>
      <ToastContainer position="bottom-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={1500} autohide bg="success">
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}

export default LoginPage; 