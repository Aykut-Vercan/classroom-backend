import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 1. Loglama: Hatanın tüm detayını (stack trace dahil) sadece terminalde gör
    console.error(`[ERROR] ${err.name}: ${err.message}`);

    // 2. Operasyonel Kontrol: Bu hata bizim fırlattığımız ApiError mı?
    const isApiError = err instanceof ApiError;

    // 3. Status ve Mesaj Belirleme
    // Eğer biz fırlatmadıysak (isApiError false ise), bu bir bug'dır ve 500 döneriz.
    const statusCode = isApiError ? err.statusCode : 500;

    // Eğer biz fırlatmadıysak mesajı maskele (Güvenlik için)
    const message = isApiError ? err.message : "Sunucu tarafında teknik bir aksaklık oluştu.";

    // 4. Frontend (Refine buildHttpError) ile %100 uyumlu cevap
    res.status(statusCode).json({
        status: "error",
        message: message,
        // Sadece geliştirme modundaysan hatanın yerini de gönder 
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};