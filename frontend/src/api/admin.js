import api from './axios';

export const getQuestions = async () => {
  const response = await api.get('/questions/');
  return response.data;
};

export const getAllQuestions = async () => {
  const response = await api.get('/questions/');
  return response.data;
};

export const createQuestion = async (question) => {
  const response = await api.post('/questions/', question);
  return response.data;
};

export const addQuestion = async (question) => {
  const response = await api.post('/questions/', question);
  return response.data;
};

export const updateQuestion = async (id, question) => {
  const response = await api.put(`/questions/${id}/`, question);
  return response.data;
};

export const editQuestion = async (id, question) => {
  const response = await api.put(`/questions/${id}/`, question);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await api.delete(`/questions/${id}/`);
  return response.data;
};

export const bulkImportQuestions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/questions/bulk_import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get('/interview/sessions/');
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get('/interview/admin/analytics/');
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

export const unblockCandidate = async (candidateId) => {
  const response = await api.post(`/interview/admin/candidates/${candidateId}/unblock/`);
  return response.data;
};

export const removeCandidateRecords = async (candidateId) => {
  const response = await api.delete(`/interview/admin/candidates/${candidateId}/remove/`);
  return response.data;
}; 