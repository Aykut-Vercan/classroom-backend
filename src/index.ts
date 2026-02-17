import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import subjectsRouter from './routes/subjects';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8000');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))


app.use(express.json());

app.use('/api/subjects', subjectsRouter)


app.get('/', (req, res): void => {
  res.json({
    message: 'Merhaba! Sunucu çalışıyor.'
  });
});

app.listen(PORT, (): void => {
  console.log(` Sunucu çalışıyor: http://localhost:${PORT}`);
});