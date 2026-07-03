import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};


export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action 1: Bắt đầu tải (khi đang gọi API verify chẳn hạn)
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Action 2: Đăng nhập thành công, lưu thông tin user
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    // Action 3: Đăng xuất, xóa sạch thông tin
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

// Xuất các Action để các component có thể dispatch
export const { setLoading, loginSuccess, logout } = authSlice.actions;

// Xuất reducer để đưa vào store cấu hình
export default authSlice.reducer;
