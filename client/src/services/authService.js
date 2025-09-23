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
  // Redirect to backend Google OAuth endpoint
  window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
};

export const handleOAuthSuccess = async (token) => {
  // Store token
  localStorage.setItem('token', token);
  
  // Get user data
  const response = await API.get('/auth/oauth/success');
  return response.data;
};