import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs } from '../services/blogService';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import BlogCard from '../components/BlogCard';
import Contact from './Contact';
import './Home.css';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterBlogs();
  }, [blogs, searchTerm, selectedCategory]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getBlogs();
      
      // Handle different response formats
      let blogsData = [];
      
      if (Array.isArray(response)) {
        // If response is directly an array
        blogsData = response;
      } else if (response && Array.isArray(response.blogs)) {
        // If response has a blogs property
        blogsData = response.blogs;
      } else if (response && Array.isArray(response.data)) {
        // If response has a data property
        blogsData = response.data;
      } else {
        console.warn('Unexpected response format:', response);
        blogsData = [];
      }
      
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('Failed to load blogs. Please try again later.');
      setBlogs([]); // Ensure blogs is always an array
    } finally {
      setLoading(false);
    }
  };

  const filterBlogs = () => {
    if (!Array.isArray(blogs)) {
      setFilteredBlogs([]);
      return;
    }

    let filtered = blogs;

    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(blog =>
        blog.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredBlogs(filtered);
  };

  // Safe category extraction
  const categories = Array.isArray(blogs) 
    ? [...new Set(blogs.map(blog => blog.category).filter(Boolean))]
    : [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading blogs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Blogs</h3>
        <p>{error}</p>
        <button onClick={fetchBlogs} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Latest Blog Posts</h1>
        <p>Discover Amazing Journals and Insights with <span>Tahir</span> </p>
      </div>

      <div className="filters-container">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <div className="blogs-stats">
        <p>Showing {filteredBlogs.length} of {blogs.length} posts</p>
        {(searchTerm || selectedCategory) && (
          <button
            className="clear-filters"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {!Array.isArray(filteredBlogs) || filteredBlogs.length === 0 ? (
        <div className="no-blogs">
          <h3>No blogs found</h3>
          <p>Try adjusting your search or filters</p>
          {blogs.length === 0 && (
            <Link to="/post-blog" className="create-first-blog">
              Create your first blog post!
            </Link>
          )}
        </div>
      ) : (
        <div className="blogs-grid">
          {filteredBlogs.map(blog => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
      <Contact/>
    </div>
  );
};

export default Home;