import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';

// Hàm tạo store mới cho mỗi request (Tránh rò rỉ dữ liệu giữa các user trên Server Side Rendering)
export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

// Định nghĩa kiểu dữ liệu cho Store, State, và Dispatch của dự án
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
