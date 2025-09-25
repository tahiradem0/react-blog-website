import API from './api';

export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (name, email, password) => {
  const response = await API.post('/auth/signup', { name, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export const googleAuth = () => {
  // Use environment variable for Google OAuth URL
  const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  window.location.href = `${API_BASE_URL}/auth/google`;
};

export const handleOAuthSuccess = async (token) => {
  localStorage.setItem('token', token);
  const response = await API.get('/auth/oauth/success');
  return response.data;
};