import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleOAuthSuccess } from '../services/authService';
import './OAuthSuccess.css';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    const processOAuth = async () => {
      try {
        if (token && userParam) {
          const user = JSON.parse(decodeURIComponent(userParam));
          login(user, token);
          navigate('/');
        } else if (token) {
          const { user } = await handleOAuthSuccess(token);
          login(user, token);
          navigate('/');
        } else {
          navigate('/login?error=oauth-failed');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth-processing-failed');
      }
    };

    processOAuth();
  }, [searchParams, navigate, login]);

  return (
    <div className="oauth-loading">
      <div className="spinner"></div>
      <h2>Completing Google Sign In...</h2>
      <p>Please wait while we set up your account.</p>
    </div>
  );
};

export default OAuthSuccess;