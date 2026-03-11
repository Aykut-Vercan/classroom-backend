export class ApiError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        // Stack trace'i (hatanın nerede olduğunu) korumak için:
        Error.captureStackTrace(this, this.constructor);
    }
}