import { useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './store';

// Hook để gửi action đi (dispatch)
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook để lấy dữ liệu từ store ra dùng
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
) => useSelector<RootState, TSelected>(selector);

// Hook để truy cập trực tiếp vào store instance nếu cần
export const useAppStore = () => useStore<AppStore>();
