import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import type { PaginatedResponse, Role } from '@hrms/types';

import type {
  CreateApplicantInput,
  CreateJobPostingInput,
  ListApplicantsQuery,
  ListJobPostingsQuery,
  UpdateApplicantStageInput,
} from './recruitment.schema';

type JobPostingRow = {
  id: string;
  title: string;
  departmentId: string;
  description: string;
  requirements: string | null;
  isOpen: boolean;
  postedById: string;
  createdAt: Date;
};

type ApplicantRow = {
  id: string;
  jobPostingId: string;
  fullName: string;
  email: string;
  phone: string | null;
  cvUrl: string | null;
  stage: string;
  notes: string | null;
  assignedToId: string | null;
  createdAt: Date;
};

export class RecruitmentService {
  public async listJobPostings(query: ListJobPostingsQuery): Promise<PaginatedResponse<JobPostingRow>> {
    const page = query.page;
    const limit = query.limit;

    const [data, total] = await Promise.all([
      prisma.jobPosting.findMany({
        select: {
          id: true,
          title: true,
          departmentId: true,
          description: true,
          requirements: true,
          isOpen: true,
          postedById: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.jobPosting.count(),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  public async createJobPosting(requester: { userId: string; role: Role }, input: CreateJobPostingInput): Promise<{ id: string }> {
    if (!['HR', 'ADMIN'].includes(requester.role)) throw new AppError('FORBIDDEN', 403);

    const created = await prisma.jobPosting.create({
      data: {
        title: input.title,
        departmentId: input.departmentId,
        description: input.description,
        requirements: input.requirements,
        postedById: requester.userId,
      },
      select: { id: true },
    });

    return created;
  }

  public async listApplicants(jobPostingId: string, query: ListApplicantsQuery): Promise<PaginatedResponse<ApplicantRow>> {
    const page = query.page;
    const limit = query.limit;

    const where: Record<string, unknown> = { jobPostingId };
    if (query.stage) where.stage = query.stage;

    const [data, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        select: {
          id: true,
          jobPostingId: true,
          fullName: true,
          email: true,
          phone: true,
          cvUrl: true,
          stage: true,
          notes: true,
          assignedToId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.applicant.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  public async createApplicant(input: CreateApplicantInput): Promise<{ id: string }> {
    const created = await prisma.applicant.create({
      data: {
        jobPostingId: input.jobPostingId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        cvUrl: input.cvUrl,
      },
      select: { id: true },
    });

    return created;
  }

  public async updateApplicantStage(
    applicantId: string,
    requester: { userId: string; role: Role },
    input: UpdateApplicantStageInput
  ): Promise<{ id: string }>{
    if (!['HR', 'ADMIN'].includes(requester.role)) throw new AppError('FORBIDDEN', 403);

    const existing = await prisma.applicant.findUnique({ where: { id: applicantId }, select: { id: true } });
    if (!existing) throw new AppError('NOT_FOUND', 404);

    const updated = await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        stage: input.stage,
        notes: input.notes,
        assignedToId: input.assignedToId,
      },
      select: { id: true },
    });

    return updated;
  }
}
