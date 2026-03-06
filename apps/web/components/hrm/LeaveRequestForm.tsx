'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
  days: z.number().min(0.5, "Minimum 0.5 days").max(365),
  reason: z.string().min(3, "Reason is too short").max(500, "Reason is too long"),
});

type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

type LeaveTypeOption = {
  id: string;
  name: string;
};

const leaveTypeOptions: LeaveTypeOption[] = [
  { id: 'annual', name: 'Annual' },
  { id: 'sick', name: 'Sick' },
  { id: 'casual', name: 'Casual' },
  { id: 'unpaid', name: 'Unpaid' },
];

function calculateDays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffMs = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

export function LeaveRequestForm(): React.ReactElement {
  const queryClient = useQueryClient();
  const form = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { leaveTypeId: '', fromDate: '', toDate: '', days: 0, reason: '' },
  });

  const { errors } = form.formState;
  const fromDate = form.watch('fromDate');
  const toDate = form.watch('toDate');
  const days = calculateDays(fromDate, toDate);

  const mutation = useMutation({
    mutationFn: async (values: LeaveRequestInput): Promise<void> => {
      await api.post('/leaves', { ...values, days });
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error) => {
      toast.error('Failed to submit leave request. Please try again.');
    }
  });

  const onSubmit = async (values: LeaveRequestInput): Promise<void> => {
    if (days < 0.5) {
      toast.error('Invalid date range selected');
      return;
    }
    await mutation.mutateAsync(values);
  };

  return (
    <Card className="max-w-2xl border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/50">
      <div className="h-2 bg-gradient-to-r from-violet-500 to-emerald-500 w-full" />
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
            <CalendarDays size={20} />
          </div>
          <div>
            <CardTitle className="text-xl">Request Time Off</CardTitle>
            <CardDescription>Submit a new leave request for approval</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="text-zinc-700 dark:text-zinc-300">Leave Type</Label>
            <Select value={form.watch('leaveTypeId')} onValueChange={(v) => form.setValue('leaveTypeId', v, { shouldValidate: true })}>
              <SelectTrigger className="w-full h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Select type of leave" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypeOptions.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id} className="cursor-pointer">{lt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && <p className="text-sm text-red-500">{errors.leaveTypeId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fromDate" className="text-zinc-700 dark:text-zinc-300">Start Date</Label>
              <Input 
                id="fromDate" 
                type="date" 
                className="h-11 bg-white dark:bg-zinc-950" 
                {...form.register('fromDate')} 
              />
              {errors.fromDate && <p className="text-sm text-red-500">{errors.fromDate.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="toDate" className="text-zinc-700 dark:text-zinc-300">End Date</Label>
              <Input 
                id="toDate" 
                type="date" 
                className="h-11 bg-white dark:bg-zinc-950" 
                {...form.register('toDate')} 
              />
              {errors.toDate && <p className="text-sm text-red-500">{errors.toDate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Duration (Days)</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">Calculated automatically</span>
            </Label>
            <Input 
              value={days} 
              disabled 
              readOnly 
              className="h-11 bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason" className="text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              Reason
            </Label>
            <Input 
              id="reason" 
              placeholder="Please provide a brief reason for your leave..." 
              className="h-11" 
              {...form.register('reason')} 
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending} 
            className="w-full sm:w-auto self-end mt-2 h-11 px-8 bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {mutation.isPending ? 'Submitting...' : (
              <>
                <Send size={16} />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
