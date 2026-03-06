import { QueryClient } from '@tanstack/react-query';

export const queryStaleTimes = {
  employeesList: 10 * 60 * 1000,
  employeeSingle: 10 * 60 * 1000,
  attendanceToday: 30 * 1000,
  attendanceMonthly: 5 * 60 * 1000,
  leaveBalance: 5 * 60 * 1000,
  leaveList: 3 * 60 * 1000,
  payrollList: 10 * 60 * 1000,
  chatMessages: 0,
  notifications: 30 * 1000,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
      },
    },
  });
}
