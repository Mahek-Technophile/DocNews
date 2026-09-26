import { app, getCommitSha } from './api.ts';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static build assets in production mode
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DOCNEWS] Server running on http://localhost:${PORT}`);
    console.log(`[DOCNEWS] Git Commit SHA: ${getCommitSha()}`);
  });
}

startServer();
