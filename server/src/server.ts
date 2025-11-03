import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from '@/config/env';
import { errorHandler } from '@/middlewares/errorHandler';
import authRoutes from '@/routes/authRoutes';
import adminRoutes from '@/routes/adminRoutes';
import teacherRoutes from '@/routes/teacherRoutes';

const app = express();

// Middleware
// Configure helmet with minimal headers for better performance
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP header (not needed for API)
  xXssProtection: false, // Disable X-XSS-Protection (deprecated, browsers ignore it)
}));
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
});
