import React from 'react';
import { Link } from 'react-router-dom';
import './BlogCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faHeart } from '@fortawesome/free-solid-svg-icons';

const BlogCard = ({ blog }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Get base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

  return (
    <article className="blog-card">
      <Link to={`/blog/${blog._id}`} className="blog-card-link">
        {blog.image && (
          <div className="blog-card-image">
            <img 
              src={`${API_BASE_URL}/uploads/${blog.image}`} 
              alt={blog.title}
              onError={(e) => {
                e.target.src = '/default-blog.png';
              }}
            />
          </div>
        )}
        
        <div className="blog-card-content">
          <div className="blog-card-category"># {blog.category}</div>
          <h3 className="blog-card-title">{truncateText(blog.title, 60)}</h3>
          <p className="blog-card-description">
            {truncateText(blog.description, 120)}
          </p>
          
          <div className="blog-card-meta">
            <div className="blog-card-author">
              <span>By {blog.author?.name || 'Unknown Author'}</span>
            </div>
            <div className="blog-card-stats">
              <span className="likes"><FontAwesomeIcon icon={faHeart} className='like_btn_home'/> {blog.likes?.length || 0}</span>
              <span className="comments"><FontAwesomeIcon icon={faComment} className='comment_btn_home'/> {blog.comments?.length || 0}</span>
            </div>
          </div>
          
          <div className="blog-card-date">
            {formatDate(blog.createdAt)}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;