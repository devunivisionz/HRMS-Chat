export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, statusCode: number, message?: string) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    const capture = (Error as unknown as { captureStackTrace?: (t: object, c: Function) => void })
      .captureStackTrace;
    if (capture) capture(this, this.constructor);
  }
}
