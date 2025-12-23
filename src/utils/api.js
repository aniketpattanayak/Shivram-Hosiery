import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // 🟢 Keeps reading from .env (http://localhost:2121/api)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🟢 CRITICAL MISSING PIECE: The Interceptor
// This automatically finds your Login Token and attaches it to every request.
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from LocalStorage
    const token = localStorage.getItem("token");

    // 2. If token exists, attach it to the header
    if (token) {
      config.headers["x-auth-token"] = token;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;