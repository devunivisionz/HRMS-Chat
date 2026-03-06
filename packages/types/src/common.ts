import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']);
export type Role = z.infer<typeof roleSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiFailureResponse = {
  success: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};
