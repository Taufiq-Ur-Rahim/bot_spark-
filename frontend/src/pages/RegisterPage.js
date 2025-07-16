import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import './css/LoginPage.css';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      setSuccess('Registration successful! Redirecting to login...');
      setToastMsg('Registration successful!');
      setShowToast(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError('Registration failed. Try a different username or email.');
    }
    setLoading(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center login-bg" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '22rem' }} className="shadow-lg p-3 mb-5 bg-white rounded animate__animated animate__fadeInDown">
        <Card.Body>
          <div className="text-center mb-3">
            <img src="https://img.icons8.com/ios-filled/100/4e73df/robot-2.png" alt="BotSpark" style={{width: 60}} />
            <Card.Title className="mb-2 mt-2 fs-3">Register for <span className="text-primary">BotSpark</span></Card.Title>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit} autoComplete="off">
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-2" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Register'}
            </Button>
          </Form>
          <div className="text-center">
            <h6>OR</h6>
          </div>
          <div className="text-center">
            <span>Already have an account? </span>
            <Link to="/">Login</Link>
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

export default RegisterPage; 