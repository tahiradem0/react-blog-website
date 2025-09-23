import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBlog } from '../services/blogService';
import './PostBlog.css';

const PostBlog = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      if (image) {
        submitData.append('image', image);
      }

      const response = await createBlog(submitData);
      navigate(`/blog/${response.blog._id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating blog');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Technology',
    'Lifestyle',
    'Travel',
    'Food',
    'Health',
    'Business',
    'Entertainment',
    'Sports',
    'Education',
    'Other'
  ];

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="post-blog-container">
      <div className="post-blog-card">
        <h2>Create New Blog Post</h2>
        <p>Share your thoughts and experiences with the world</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="blog-form">
          {/* Image Upload */}
          <div className="form-section">
            <label className="section-label">Featured Image (Optional)</label>
            <div className="image-upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="image-input"
              />
              <label htmlFor="image-upload" className="image-upload-label">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>Click to upload image</span>
                  </div>
                )}
              </label>
              {image && (
                <button 
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview('');
                  }}
                  className="remove-image-btn"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Blog Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter a catchy title..."
              maxLength="100"
            />
            <span className="char-count">{formData.title.length}/100</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Short Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Brief description that will appear on the blog card..."
              maxLength="200"
              rows="3"
            />
            <span className="char-count">{formData.description.length}/200</span>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">Blog Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Write your blog content here... (Line breaks will be preserved)"
              rows="15"
              className="content-textarea"
            />
            <div className="content-tips">
              <small>💡 Tip: Use line breaks to separate paragraphs</small>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Publishing...' : 'Publish Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostBlog;