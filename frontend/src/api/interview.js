import api from './axios';

export const fetchQuestions = async () => {
  const response = await api.post('/interview/start/');
  return response.data;
};

export const submitAnswers = async (data) => {
  const response = await api.post('/interview/submit/', data);
  return response.data;
};

export const getSummary = async (sessionId) => {
  const response = await api.get(`/interview/summary/${sessionId}/`);
  return response.data;
};

export const getUserSessions = async () => {
  const response = await api.get('/interview/sessions/');
  return response.data;
};

export const getAdminCandidates = async () => {
  const response = await api.get('/interview/admin/candidates/');
  return response.data;
};

export const getAdminCandidateDetail = async (candidateId) => {
  const response = await api.get(`/interview/admin/candidates/${candidateId}/`);
  return response.data;
}; 