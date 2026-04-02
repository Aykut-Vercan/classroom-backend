import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import subjectsRouter from './routes/subjects';
import usersRouter from './routes/users';
import classesRouter from './routes/classes';
import helmet from 'helmet';
import hpp from 'hpp';
import { toNodeHandler } from "better-auth/node";
import { errorHandler } from './middleware/error';
import { auth } from './lib/auth';

const app = express();
app.set('trust proxy', 1);
const PORT: number = parseInt(process.env.PORT || '8000');


app.use(helmet());//Helmet: Sunucun hakkında çok fazla bilgi veren X-Powered-By: Express başlığını gizler.

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is required');
}

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))


app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json({ limit: '50kb' }));

app.use(hpp());//HPP: URL üzerinden yapılacak manipülasyonları engeller.

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)



app.get('/', (req, res): void => {
  res.json({
    message: 'Merhaba! Sunucu çalışıyor.'
  });
});


app.use(errorHandler);

app.listen(PORT, (): void => {
  console.log(` Sunucu çalışıyor: http://localhost:${PORT}`);
});