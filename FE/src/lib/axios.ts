import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2308',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Tự động gửi cookie theo mọi request
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor — tự động refresh token khi gặp lỗi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh lặp vô tận nếu chính request refresh hoặc login bị 401
    const isAuthRequest =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Âm thầm gọi API refresh token
        await api.post('/auth/refresh');
        processQueue(null);
        // Thử lại request ban đầu
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';

    return Promise.reject(new Error(message));
  },
);

const postData = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post(url, data);
  return response.data;
};
const getData = async <T>(url: string, config?: any): Promise<T> => {
  const response = await api.get(url, config);
  return response.data;
};
const updateData = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put(url, data);
  return response.data;
};
const patchData = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.patch(url, data);
  return response.data;
};
const deleteData = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);
  return response.data;
};

export { postData, getData, updateData, patchData, deleteData };
