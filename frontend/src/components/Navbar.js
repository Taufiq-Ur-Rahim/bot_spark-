import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getUserInfo } from '../api/auth';
import { isAuthenticated } from '../utils/auth';

function AppNavbar({ isAuth, user, onAuthChange, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      getUserInfo().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (!isAuthenticated() || loading) return null;

  const handleLogout = () => {
    logout();
    if (onAuthChange) onAuthChange();
    navigate('/');
  };

  return (
    <Navbar bg={darkMode ? 'dark' : 'primary'} variant={darkMode ? 'dark' : 'dark'} expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img src="https://img.icons8.com/ios-filled/100/0056b3/robot-2.png" alt="BotSpark" style={{width: 30, marginRight: '8px', filter: 'drop-shadow(0 1px 2px rgba(0, 86, 179, 0.3))'}} />
          BotSpark
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {user && user.role !== 'admin' && <Nav.Link as={Link} to="/interview">Interview</Nav.Link>}
            <Nav.Link as={Link} to="/summary">Summary</Nav.Link>
            {user && user.role === 'admin' && <Nav.Link as={Link} to="/admin">Admin</Nav.Link>}
          </Nav>
          <Nav className="align-items-center">
            <Button variant={darkMode ? 'outline-light' : 'outline-dark'} className="me-2" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
              {darkMode ? '🌞' : '🌙'}
            </Button>
            <NavDropdown title={user ? (<span>{user.username} {user.role === 'admin' && <span className="badge bg-warning text-dark ms-1">Admin</span>}</span>) : 'User'} id="user-nav-dropdown" align="end">
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar; 