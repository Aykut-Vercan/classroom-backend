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
/* 
Normalde Express, isteğin geldiği IP'yi req.ip ile alır.
Ama projen Docker veya Nginx gibi bir proxy arkasındaysa,
tüm istekler proxy'nin IP'siyle gelir — herkesin IP'si aynı görünür.
Bu durumda rate limiting bozulur, bir kişi sınırı doldurunca herkesi engellersin.
trust proxy: 1 diyince Express, proxy'nin eklediği X-Forwarded-For header'ına bakıyor
ve gerçek kullanıcı IP'sini alıyor.
*/
app.set('trust proxy', 1);
const PORT: number = parseInt(process.env.PORT || '8000');

//Helmet: server hakkında çok fazla bilgi veren X-Powered-By: Express başlığını gizler.
app.use(helmet());

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is required');
}
// sadece frontend URL'den gelen isteklere izin ver
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

//auth rotaları better-auth'a devredildiği için bu rotayı kullanmak gerekir.
//express.json()'dan önce geliyor. Çünkü better-auth kendi body parsing'ini yapıyor, çakışmaması lazım.
app.all('/api/auth/*splat', toNodeHandler(auth));
// HTTP isteğinin body'si ham string olarak gelir.
// express.json() onu JavaScript objesine çevirir, req.body kullanılabilir hale gelir.
// Biri sana 10MB'lık JSON gönderirse sunucu belleği tükenir. 
// 50KB'dan büyük body gelirse Express direkt 413 (Payload Too Large) döner,
app.use(express.json({ limit: '50kb' }));

app.use(hpp());//HPP: URL üzerinden yapılacak manipülasyonları engeller.

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)



app.get('/', (req, res): void => {
  res.json({ message: 'Server is running' });
});

//çalışması için en alttaki kod bloğu olması gerekiyor yoksa hata alırız.
app.use(errorHandler);

app.listen(PORT, (): void => {
  console.log(` Server is running on http://localhost:${PORT}`);
});