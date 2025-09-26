import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBlog, likeBlog, addComment } from '../services/blogService';
import CommentSection from '../components/CommentSection';
import SocialShare from '../components/SocialShare';
import Contact from './Contact';
import './BlogDetail.css';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  // Get base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL';


  const fetchBlog = async () => {
    try {
      setLoading(true);
      const blogData = await getBlog(id);
      setBlog(blogData);
    } catch (error) {
      setError('Blog not found');
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLiking(true);
      const updatedBlog = await likeBlog(id);
      setBlog(prevBlog => ({
        ...prevBlog,
        likes: updatedBlog.likes
      }));
    } catch (error) {
      console.error('Error liking blog:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await addComment(id, commentText);
      
      setBlog(prevBlog => ({
        ...prevBlog,
        comments: [...prevBlog.comments, response.comment]
      }));
      
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading blog post...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="error-container">
        <h2>Blog Not Found</h2>
        <p>The blog post you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  const hasLiked = user && Array.isArray(blog.likes) && blog.likes.includes(user._id);
  const blogUrl = `${window.location.origin}/blog/${blog._id}`;

  return (
    <div className="blog-detail-container">
      <article className="blog-detail">
        {/* Blog Header */}
        <header className="blog-header">
          <nav className="breadcrumb">
            <button onClick={() => navigate('/')} className="back-btn">
              ← Back to Blogs
            </button>
          {user && blog.author && blog.author._id === user._id && (
            <button 
              onClick={() => navigate(`/edit/${blog._id}`)} 
              className="edit-btn-one"
              title="Edit this blog"
              >
                ✏️ Edit
              </button>
            )}
          </nav>
          {blog.image && (
          <div className="blog-image-container">
            <img 
              src={`${blog.image.url}`}
              alt={blog.title}
              className="blog-image"
              onError={(e) => {
                e.target.src = '/default-blog.png';
              }}
            />
          </div>
        )}
          
          <div className="blog-meta-header">
            <span className="blog-category"># {blog.category}</span>
            <span className="blog-date">{formatDate(blog.createdAt)}</span>
          </div>
          
          <h1 className="blog-title">{blog.title}</h1>
          <p className="blog-description">{blog.description}</p>
        </header>

        {/* Blog Content */}
        <div className="blog-content">
          <div 
            className="blog-text"
            dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }}
          />
        </div>

        {/* Blog Actions */}
        <div className="blog-actions">
          <div className="like-section">
            <button 
              onClick={handleLike}
              disabled={liking}
              className={`like-btn ${hasLiked ? 'liked' : ''}`}
            >
              <span className="like-icon">{hasLiked ? '❤️' : '🤍'}</span>
              <span className="like-count">
              {Array.isArray(blog.likes) ? blog.likes.length : blog.likes || 0}
            </span>
              <span className="like-text">{hasLiked ? '' : 'Like'}</span>
            </button>
          </div>

          <SocialShare 
            url={blogUrl}
            title={blog.title}
            description={blog.description}
            image={blog.image ? `${API_BASE_URL}/uploads/${blog.image}` : ''}
          />
        </div>

        {/* Comments Section */}
        <section className="comments-section">
          <h3>Comments ({blog.comments?.length || 0})</h3>
          
          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="comment-form">
              <div className="comment-input-group">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows="3"
                  className="comment-textarea"
                />
                <button 
                  type="submit" 
                  disabled={submittingComment || !commentText.trim()}
                  className="comment-submit-btn"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="login-prompt">
              <p>
                <button 
                  onClick={() => navigate('/login')}
                  className="login-link"
                >
                  Sign in
                </button>
                {' '}to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <CommentSection comments={blog.comments} />
        </section>
      </article>
      <Contact/>
    </div>
  );
};

export default BlogDetail;