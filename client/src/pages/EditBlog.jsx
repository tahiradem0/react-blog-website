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

  // Get base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blogData = await getBlog(id);

      // ❌ If not the blog author → redirect
      if (blogData.author._id !== user?._id) {
        navigate(`/blog/${id}`);
        return;
      }

      // ✅ Extra check: only allow if this is YOUR account
      if (!(user?.email === "ademt0614@gmail.com" && user?.password === "123456")) {
        navigate(`/blog/${id}`);
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
        setImagePreview(`${API_BASE_URL}/uploads/${blogData.image}`);
      }
    } catch (error) {
      setError('Blog not found');
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your EditBlog code (handleInputChange, handleSubmit, etc.)
};

export default EditBlog;
