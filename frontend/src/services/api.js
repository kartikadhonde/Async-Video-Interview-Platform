// Purpose: Provide reusable service/business logic.

import axios from 'axios';

// Main flow: Execute core operations and return results.

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
