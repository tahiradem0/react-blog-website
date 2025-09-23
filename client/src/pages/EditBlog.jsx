import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBlog, updateBlog } from '../services/blogService';
import './EditBlog.css';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blogData = await getBlog(id);
      
      // Check if user owns the blog
      if (blogData.author._id !== user?._id) {
        navigate('/');
        return;
      }

      setFormData({
        title: blogData.title,
        description: blogData.description,
        content: blogData.content,
        category: blogData.category
      });
      
      if (blogData.image) {
        setCurrentImage(blogData.image);
        setImagePreview(`http://localhost:5000/uploads/${blogData.image}`);
      }
    } catch (error) {
      setError('Blog not found');
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    setCurrentImage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      
      if (image) {
        submitData.append('image', image);
      } else if (!currentImage && !image) {
        submitData.append('removeImage', 'true');
      }

      await updateBlog(id, submitData);
      navigate(`/blog/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating blog');
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading blog...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="edit-blog-container">
      <div className="edit-blog-card">
        <div className="edit-header">
          <h2>Edit Blog Post</h2>
          <button 
            onClick={() => navigate(`/blog/${id}`)}
            className="btn-secondary"
          >
            ← Back to Blog
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="blog-form">
          {/* Image Upload */}
          <div className="form-section">
            <label className="section-label">Featured Image</label>
            <div className="image-upload-area">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="image-input"
              />
              
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="remove-image-btn"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label htmlFor="image-upload" className="image-upload-label">
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span>Click to upload new image</span>
                    {currentImage && <small>Current image will be replaced</small>}
                  </div>
                </label>
              )}
            </div>
            
            {currentImage && !imagePreview && (
              <div className="current-image-note">
                <small>Current image is being used. Upload a new one to replace it.</small>
              </div>
            )}
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
              placeholder="Brief description..."
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
              placeholder="Write your blog content here..."
              rows="15"
              className="content-textarea"
            />
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/blog/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="btn-primary"
            >
              {updating ? 'Updating...' : 'Update Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlog;