import React from 'react';
import './SocialShare.css';

const SocialShare = ({ url, title, description, image }) => {
  return (
    <div className="social-share">
      {/* Show blog image at the top if available */}
      {image && (
        <div className="social-share-image">
          <img src={image} alt={title} className="share-image" />
        </div>
      )}

      <div className="social-share-content">
        <h4 className="share-title">{title}</h4>
        <p className="share-description">{description}</p>

        <div className="share-buttons">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn fb"
          >
            Share on Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn tw"
          >
            Share on Twitter
          </a>
        </div>
      </div>
    </div>
  );
};

export default SocialShare;
