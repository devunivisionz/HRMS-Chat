import { Request } from 'express';
import { Role } from '@hrms/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
      file?: Express.Multer.File;
    }
  }
}

export {};
