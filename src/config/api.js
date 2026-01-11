// API Base URL Configuration
// This file centralizes the API base URL for all axios requests
// The URL is determined by the environment variable VITE_API_BASE_URL

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default API_BASE_URL;
