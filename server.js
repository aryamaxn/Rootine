import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { connectDB } from './config/db.js';
import habitRoutes from './routes/habits.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '32kb' }));
app.use('/api/habits', habitRoutes);
app.get('/', async (req, res, next) => {
  try {
    const heroImage = path.join(root, 'public/assets/img/hero.jpg');
    const html = await readFile(path.join(root, 'public/index.html'), 'utf8');
    res.type('html').send(html.replace('data-hero-image="auto"', `data-hero-image="${existsSync(heroImage) ? 'available' : 'landscape'}"`));
  } catch (error) { next(error); }
});
for (const [route, page] of [['/garden', 'garden.html'], ['/why', 'why.html'], ['/about', 'about.html']]) {
  app.get(route, (req, res, next) => res.sendFile(path.join(root, 'public', page), error => { if (error) next(error); }));
}
app.use('/api', notFound);
app.use(express.static(path.join(root, 'public')));
app.use((req, res, next) => res.status(404).sendFile(path.join(root, 'public/404.html'), error => { if (error) next(error); }));
app.use(errorHandler);
const port = process.env.PORT || 3000;
try {
  await connectDB();
  app.listen(port, () => console.log(`Rootine is ready at http://localhost:${port}`));
} catch (error) {
  console.error(`Rootine could not start: ${error.message}`);
  process.exitCode = 1;
}
