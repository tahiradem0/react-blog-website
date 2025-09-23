import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isBlogPage = location.pathname.includes('/blog/');
  const blogId = location.pathname.split('/blog/')[1];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          📝 BlogSpace
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Contact
          </Link>

          {user ? (
            <>
              <Link to="/post" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Write Blog
              </Link>
              <span className="nav-user">Hello, {user.name}</span>
              <button onClick={handleLogout} className="nav-btn nav-btn-logout">
                Logout
              </button>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-btn nav-btn-login">
                Login
              </Link>
              <Link to="/signup" className="nav-btn nav-btn-signup">
                Sign Up
              </Link>
              {user && isBlogPage && blogId && (
                <Link 
                to={`/edit/${blogId}`} 
                className="nav-link"
                onClick={() => setIsMenuOpen(false)}
                >
                Edit Blog
                </Link>
            )}
            </div>
          )}
        </div>

        <div className="nav-toggle" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;