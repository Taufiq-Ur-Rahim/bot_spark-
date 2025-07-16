import api from './axios';

export const login = async (username, password) => {
  const response = await api.post('/token/', { username, password });
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post('/users/register/', { username, email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getUserInfo = async () => {
  const response = await api.get('/users/me/');
  return response.data;
}; 