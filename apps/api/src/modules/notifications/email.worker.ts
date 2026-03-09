import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

import { logger } from '@/lib/logger';

import {
  LeaveApprovalEmail,
  MentionDigestEmail,
  PayslipReadyEmail,
  WelcomeEmail,
  leaveApprovalText,
  mentionDigestText,
  payslipReadyText,
  welcomeText,
} from '@hrms/email-templates';

type EmailJobData = {
  userId: string;
  type: string;
  payload: {
    title: string;
    body?: string;
    url?: string;
  };
};

function smtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) throw new Error('SMTP env vars not set');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function emailFrom(): string {
  return process.env.EMAIL_FROM ?? 'HRMS <noreply@company.com>';
}

export function startEmailWorker(connection: { host: string; port: number; password?: string }): Worker {
  return new Worker(
    'notifications',
    async (job) => {
      if (job.name !== 'email') return;

      const data = job.data as EmailJobData;

      const transport = smtpTransport();

      const to = process.env.NOTIFICATION_TEST_TO ?? process.env.SMTP_USER!;

      let subject = data.payload.title;
      let html = '';
      let text = data.payload.body ?? data.payload.title;

      if (data.type === 'LEAVE_APPROVED' || data.type === 'LEAVE_REJECTED') {
        const props = {
          employeeName: 'Employee',
          leaveType: 'Leave',
          fromDate: '-',
          toDate: '-',
          days: 0,
          status: data.type === 'LEAVE_APPROVED' ? 'APPROVED' : 'REJECTED',
          approvedBy: 'Manager',
          remaining: 0,
          loginUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        } as const;
        subject = data.payload.title;
        html = render(LeaveApprovalEmail(props));
        text = leaveApprovalText(props);
      } else if (data.type === 'PAYSLIP_READY') {
        const props = {
          employeeName: 'Employee',
          monthLabel: 'This month',
          downloadUrl: data.payload.url ?? (process.env.FRONTEND_URL ?? 'http://localhost:3000'),
          loginUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        } as const;
        html = render(PayslipReadyEmail(props));
        text = payslipReadyText(props);
      } else if (data.type === 'NEW_EMPLOYEE_ONBOARDED') {
        const props = {
          employeeName: 'Employee',
          companyName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HRMS',
          loginUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        } as const;
        html = render(WelcomeEmail(props));
        text = welcomeText(props);
      } else if (data.type === 'MENTION') {
        const props = {
          employeeName: 'Employee',
          items: [] as any[],
          loginUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        };
        html = render(MentionDigestEmail(props));
        text = mentionDigestText(props);
      }

      await transport.sendMail({
        from: emailFrom(),
        to,
        subject,
        html,
        text,
      });
    },
    {
      connection,
      concurrency: 2,
    }
  ).on('failed', (job, err) => {
    logger.error({ msg: 'email worker job failed', jobId: job?.id, err });
  });
}
