import { z } from "zod";

// Update schemas for routes
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  // Explicitly exclude protected fields
}).strict();

export const updateSkillSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  type: z.string().optional(),
  availability: z.string().optional(),
}).strict();

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().or(z.date()).optional(),
  endTime: z.string().or(z.date()).optional(),
  skillId: z.string().optional(),
}).strict();
