import { z } from 'zod';

export const quizGenerateSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  question_count: z.number().min(1).max(20).default(10),
  difficulty: z.enum(['easy', 'medium', 'advanced']),
});

export type QuizGenerateData = z.infer<typeof quizGenerateSchema>;