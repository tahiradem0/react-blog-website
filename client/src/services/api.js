// api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ✅ Only set JSON header when sending JSON
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // If request body is FormData, don't set Content-Type (browser will handle)
  if (!(req.data instanceof FormData)) {
    req.headers['Content-Type'] = 'application/json';
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server. Please check if backend is running.');
    }
    return Promise.reject(error);
  }
);

export default API;
