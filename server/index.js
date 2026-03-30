import express from 'express';
import cors from 'cors';
import gitRoutes from './routes/gitRoutes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Main route under /api/git
  app.use('/api/git', gitRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}

export function startServer(port = process.env.PORT || 3001) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Git Controller API running on http://localhost:${port}`);
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  startServer();
}
