import React from 'react';
import './SearchBar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';


const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="search-bar">
      <div className="search-icon"><FontAwesomeIcon icon={faSearch} className='serach_icon'/></div>
      <input
        type="text"
        placeholder="Search blogs..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <button 
          className="clear-search"
          onClick={() => onSearchChange('')}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;