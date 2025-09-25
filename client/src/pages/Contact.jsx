import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Contact.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faInbox, faPaperPlane, faPhone, faSearch } from '@fortawesome/free-solid-svg-icons';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { user } = useAuth();

  // Pre-fill form if user is logged in
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [user]);

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
    setSuccess('');

    try {
      // Simulate API call - you'll need to create contactService.js
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically call:
      // await contactService.sendMessage(formData);
      
      setSuccess('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: user ? user.name : '',
        email: user ? user.email : '',
        message: ''
      });
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-content">
        <div className="contact-info">
          <h2>Get In Touch</h2>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-icon"><FontAwesomeIcon icon={faPaperPlane} className='contact_icon'/></span>
              <div>
                <h4>Email</h4>
                <a href=''>ademt0614@gmail.com</a>
              </div>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon"><FontAwesomeIcon icon={faPhone} className='contact_icon'/></span>
              <div>
                <h4>Phone</h4>
                <a href='tel:0978787960'>+251978787960</a>
              </div>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon"><FontAwesomeIcon icon={faCommentDots} className='contact_icon'/></span>
              <div>
                <h4>Support</h4>
                <p>Technical issues & feedback</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          <form onSubmit={handleSubmit} className="contact-form">
            <h3>Send us a Message</h3>
            
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Your Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Tell us how we can help you..."
                rows="6"
              />
              <div className="char-count">
                {formData.message.length}/1000 characters
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
      <div className='copy_right_text'>copyright @Tahir Adem - 2025</div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;