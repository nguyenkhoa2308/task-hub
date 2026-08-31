const REQUIRED_ENV_KEYS = [
  'MONGODB_URI',
  'FRONTEND_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ARCJET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

export function validateEnvironment(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  }

  const nodeEnv = String(config.NODE_ENV || 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV chỉ được là development, test hoặc production');
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (String(config[key]).length < 32) {
      throw new Error(`${key} phải có ít nhất 32 ký tự`);
    }
  }
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET phải khác nhau');
  }
  if (String(config.ARCJET_KEY).includes('yourkey')) {
    throw new Error('ARCJET_KEY không được dùng giá trị mẫu');
  }

  const origins = String(config.FRONTEND_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`FRONTEND_URL không hợp lệ: ${origin}`);
    }
    if (nodeEnv === 'production' && parsed.protocol !== 'https:') {
      throw new Error('FRONTEND_URL phải sử dụng HTTPS trong production');
    }
  }

  const port = Number(config.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    FRONTEND_URL: origins.join(','),
  };
}
