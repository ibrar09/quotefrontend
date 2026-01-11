// API Base URL Configuration
// This file centralizes the API base URL for all axios requests
// The URL is determined by the environment variable VITE_API_BASE_URL

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Ensure the URL has a protocol and no trailing slash
if (API_BASE_URL && !API_BASE_URL.startsWith('http') && !API_BASE_URL.includes('localhost')) {
    API_BASE_URL = `https://${API_BASE_URL}`;
}

// Remove trailing slash if present
if (API_BASE_URL && API_BASE_URL.endsWith('/')) {
    API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Remove trailing /api if present (since components add it themselves)
if (API_BASE_URL && API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = API_BASE_URL.slice(0, -4);
}

export default API_BASE_URL;
