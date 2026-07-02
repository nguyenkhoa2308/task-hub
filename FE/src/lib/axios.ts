import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2308',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Tự động gửi cookie theo mọi request
});

// Response interceptor — handle lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';

    return Promise.reject(new Error(message));
  },
);

export default api;
