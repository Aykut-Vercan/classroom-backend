import express from 'express';
import 'dotenv/config';  

const app = express();

const PORT: number = parseInt(process.env.PORT || '8000');

app.use(express.json());

app.get('/', (req, res): void => {
  res.json({ 
    message: 'Merhaba! Sunucu çalışıyor.' 
  });
});

app.listen(PORT, (): void => {
  console.log(` Sunucu çalışıyor: http://localhost:${PORT}`);
});