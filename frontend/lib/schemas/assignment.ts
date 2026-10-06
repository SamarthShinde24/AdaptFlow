import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  course: z.string().min(1, 'Course is required'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  deadline: z.string().datetime('Must be a valid ISO datetime string'),
  accepted_formats: z.array(z.string()).min(1, 'At least one format is required'),
  student_ids: z.array(z.string().uuid()).min(1, 'At least one student must be assigned'),
});

export type CreateAssignmentData = z.infer<typeof createAssignmentSchema>;