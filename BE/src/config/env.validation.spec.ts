import { validateEnvironment } from './env.validation';

const validConfig = {
  NODE_ENV: 'production',
  PORT: '3001',
  MONGODB_URI: 'mongodb://localhost:27017/task-hub',
  FRONTEND_URL: 'https://app.example.com',
  JWT_ACCESS_SECRET: 'access-secret-that-is-at-least-32-characters',
  JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters',
  ARCJET_KEY: 'ajkey_real_value',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
};

describe('validateEnvironment', () => {
  it('chuẩn hóa cấu hình hợp lệ', () => {
    const result = validateEnvironment({ ...validConfig });
    expect(result.PORT).toBe(3001);
    expect(result.FRONTEND_URL).toBe('https://app.example.com');
  });

  it('dừng khởi động khi thiếu secret bắt buộc', () => {
    expect(() => validateEnvironment({
      ...validConfig,
      JWT_ACCESS_SECRET: '',
    })).toThrow('JWT_ACCESS_SECRET');
  });

  it('không cho frontend dùng HTTP trong production', () => {
    expect(() => validateEnvironment({
      ...validConfig,
      FRONTEND_URL: 'http://example.com',
    })).toThrow('HTTPS');
  });

  it('không cho access và refresh token dùng chung secret', () => {
    expect(() => validateEnvironment({
      ...validConfig,
      JWT_REFRESH_SECRET: validConfig.JWT_ACCESS_SECRET,
    })).toThrow('phải khác nhau');
  });
});
