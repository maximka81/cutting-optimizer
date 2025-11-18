import { SessionOptions } from 'iron-session';

import { OptimizationInput } from '@/shared/api/optimizer.dto.js';

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string, // Минимум 32 символа, храни в .env
  cookieName: 'myapp_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // В продакшене только HTTPS
    maxAge: 60 * 60 * 24, // 24 часа (в секундах)
  },
};

export interface OptimizationSessionStorage {
  optimizationInput: OptimizationInput;
}
