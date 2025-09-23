import API from './api';

export const getBlogs = async (search = '', category = '') => {
  const response = await API.get(`/blogs?search=${search}&category=${category}`);
  return response.data;
};

export const getBlog = async (id) => {
  const response = await API.get(`/blogs/${id}`);
  return response.data;
};

export const createBlog = async (blogData) => {
  const response = await API.post('/blogs', blogData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const likeBlog = async (id) => {
  const response = await API.post(`/blogs/${id}/like`);
  return response.data;
};

export const addComment = async (id, text) => {
  const response = await API.post(`/blogs/${id}/comment`, { text });
  return response.data;
};

// Add to existing blogService.js
export const updateBlog = async (id, blogData) => {
  const response = await API.put(`/blogs/${id}`, blogData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};