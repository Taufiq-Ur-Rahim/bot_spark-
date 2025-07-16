import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InterviewPage from './pages/InterviewPage';
import SummaryPage from './pages/SummaryPage';
import AdminDashboard from './pages/AdminDashboard';
import AppNavbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { isAuthenticated } from './utils/auth';
import { getUserInfo } from './api/auth';

function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  useEffect(() => {
    const onStorage = () => setIsAuth(isAuthenticated());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (isAuth) {
      getUserInfo().then(setUser).catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [isAuth]);

  // Update auth state on login/logout
  const handleAuthChange = () => setIsAuth(isAuthenticated());

  return (
    <Router>
      <AppNavbar isAuth={isAuth} user={user} onAuthChange={handleAuthChange} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={darkMode ? 'bg-dark min-vh-100 dark-mode' : 'bg-light min-vh-100'}>
        <div className="container py-4">
          <Routes>
            {!isAuth ? (
              <>
                <Route path="/" element={<LoginPage onAuthChange={handleAuthChange} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                {user && user.role === 'admin' ? (
                  <>
                    <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                    <Route path="/summary" element={<PrivateRoute><SummaryPage user={user} /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/admin" />} />
                  </>
                ) : (
                  <>
                    <Route path="/interview" element={<PrivateRoute><InterviewPage user={user} /></PrivateRoute>} />
                    <Route path="/summary" element={<PrivateRoute><SummaryPage user={user} /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/interview" />} />
                  </>
                )}
              </>
            )}
          </Routes>
        </div>
    </div>
    </Router>
  );
}

export default App;
