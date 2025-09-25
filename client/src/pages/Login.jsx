import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, googleAuth } from '../services/authService';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for OAuth errors
  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'google-auth-failed':
          setError('Google authentication failed. Please try again.');
          break;
        case 'token-generation-failed':
          setError('Authentication failed. Please try again.');
          break;
        default:
          setError('An error occurred during authentication.');
      }
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { token, user } = await login(formData.email, formData.password);
      authLogin(user, token);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    googleAuth();
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          className="google-auth-btn"
          disabled={loading}
        >
          <span className="google-icon">🔍</span>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;