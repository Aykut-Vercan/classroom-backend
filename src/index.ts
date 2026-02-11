import express from 'express';

const app = express();

const PORT: number = 8000;

app.use(express.json());

app.get('/', (req, res): void => {
  res.json({ 
    message: 'Merhaba! Sunucu çalışıyor.' 
  });
});

app.listen(PORT, (): void => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});