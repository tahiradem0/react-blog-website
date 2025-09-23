import API from './api';

export const sendMessage = async (messageData) => {
  const response = await API.post('/contact', messageData);
  return response.data;
};