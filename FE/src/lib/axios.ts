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

const postData = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post(url, data);
  return response.data;
};
const fetchData = async <T>(url: string): Promise<T> => {
  const response = await api.get(url);
  return response.data;
};
const updateData = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};
const deleteData = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data;
};

export { postData, fetchData, updateData, deleteData };
