import React from 'react';
import { Link } from 'react-router-dom';
import './BlogCard.css';

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

  return (
    <article className="blog-card">
      <Link to={`/blog/${blog._id}`} className="blog-card-link">
        {blog.image && (
          <div className="blog-card-image">
            <img 
              src={`http://localhost:5000/uploads/${blog.image}`} 
              alt={blog.title}
              onError={(e) => {
                e.target.src = '/default-blog.png';
              }}
            />
          </div>
        )}
        
        <div className="blog-card-content">
          <div className="blog-card-category">{blog.category}</div>
          <h3 className="blog-card-title">{truncateText(blog.title, 60)}</h3>
          <p className="blog-card-description">
            {truncateText(blog.description, 120)}
          </p>
          
          <div className="blog-card-meta">
            <div className="blog-card-author">
              <span className="author-avatar">👤</span>
              <span>{blog.author?.name || 'Unknown Author'}</span>
            </div>
            <div className="blog-card-stats">
              <span className="likes">❤️ {blog.likes?.length || 0}</span>
              <span className="comments">💬 {blog.comments?.length || 0}</span>
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