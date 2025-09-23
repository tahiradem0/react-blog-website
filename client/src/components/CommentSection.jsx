import React from 'react';
import './CommentSection.css';

const CommentSection = ({ comments = [] }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (comments.length === 0) {
    return (
      <div className="no-comments">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="comments-list">
      {comments.map((comment) => (
        <div key={comment._id || comment.date} className="comment-item">
          <div className="comment-header">
            <div className="comment-author">
              <span className="comment-avatar">👤</span>
              <span className="comment-author-name">{comment.name || 'Anonymous'}</span>
            </div>
            <span className="comment-date">
              {formatDate(comment.createdAt || comment.date)}
            </span>
          </div>
          <div className="comment-text">
            {comment.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSection;