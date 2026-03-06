export type SalaryStructure = {
  basicSalary: string;
  allowances: Record<string, string>;
  deductions: Record<string, string>;
};

export type PayrollRun = {
  id: string;
  employeeId: string;
  monthYear: string;
  basicSalary: string;
  allowances: Record<string, unknown>;
  deductions: Record<string, unknown>;
  grossPay: string;
  netPay: string;
  payslipUrl?: string;
  isLocked: boolean;
  processedAt?: string;
  createdAt: string;
};
