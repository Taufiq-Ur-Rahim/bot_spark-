import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Change to your Django backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api; 