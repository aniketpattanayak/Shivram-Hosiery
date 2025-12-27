import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      // 🟢 Fix: Send both formats to satisfy all backend middlewares
      config.headers["x-auth-token"] = token; 
      config.headers.Authorization = `Bearer ${token}`; 
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;