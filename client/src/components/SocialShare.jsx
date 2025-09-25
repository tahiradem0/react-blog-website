import React, { useState } from 'react';
import './SocialShare.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShare, faTimes } from '@fortawesome/free-solid-svg-icons';

const SocialShare = ({ url, title, description, image }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const shareData = {
    title: title,
    text: description,
    url: url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareOptions(!showShareOptions);
    }
  };

  const shareToPlatform = (platform) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      setShowShareOptions(false);
    } catch (error) {
      console.log('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="social-share">
      <button onClick={handleNativeShare} className="share-toggle-btn">
        <span className="share-icon"><FontAwesomeIcon icon={faShare} className='share_icon'/></span>
        Share
      </button>

      {showShareOptions && (
        <div className="share-options">
          <button onClick={() => shareToPlatform('twitter')} className="share-option">
            <span className="platform-icon">🐦</span>
            Twitter
          </button>
          <button onClick={() => shareToPlatform('facebook')} className="share-option">
            <span className="platform-icon">📘</span>
            Facebook
          </button>
          <button onClick={() => shareToPlatform('linkedin')} className="share-option">
            <span className="platform-icon">💼</span>
            LinkedIn
          </button>
          <button onClick={() => shareToPlatform('telegram')} className="share-option">
            <span className="platform-icon">📢</span>
            Telegram
          </button>
          <button onClick={() => shareToPlatform('whatsapp')} className="share-option">
            <span className="platform-icon">💚</span>
            WhatsApp
          </button>
          <button onClick={copyToClipboard} className="share-option">
            <span className="platform-icon">📋</span>
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialShare;