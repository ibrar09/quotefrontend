// API Base URL Configuration
// This file centralizes the API base URL for all axios requests
// The URL is determined by the environment variable VITE_API_BASE_URL

let rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// If it's a production URL (railway) and MISSING http/https, add it!
if (rawUrl.includes('railway.app') && !rawUrl.startsWith('http')) {
    rawUrl = 'https://' + rawUrl;
}

const API_BASE_URL = rawUrl.replace(/\/$/, "");

export default API_BASE_URL;
