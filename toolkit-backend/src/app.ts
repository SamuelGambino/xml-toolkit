/**
 * Express application setup
 */

import express, { Express } from 'express';
import cors from 'cors';
import convertRoutes from './modules/convert/convert.routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', convertRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
