import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'url';
import gitRoutes from './routes/gitRoutes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Basic request logging (non-chatty: method + path + duration on >500ms).
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      if (ms > 500) {
        console.warn(`[slow] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`);
      }
    });
    next();
  });

  // Main route under /api/git
  app.use('/api/git', gitRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // 404 handler for unknown API routes.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
    }
    next();
  });

  // Global error handler
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    if (status >= 500) console.error(err.stack);
    res.status(status).json({
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

  // Graceful shutdown: stop accepting new connections and drain in-flight ones.
  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down server…`);
    server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
        process.exit(1);
      }
      process.exit(0);
    });
    // Hard exit after 5s if connections don't drain.
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

const isMain = (() => {
  try {
    if (!process.argv[1]) return false;
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  startServer();
}
