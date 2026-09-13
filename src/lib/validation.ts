import { z } from "zod";
import { projectTypes, budgetRanges, timelines } from "@/content/freelance";

/** Shared by the client form and the API route, so both agree on the rules. */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  projectType: z.enum(projectTypes, {
    message: "Pick the closest project type",
  }),
  description: z
    .string()
    .trim()
    .min(30, "A couple of sentences about the problem helps — 30 characters minimum")
    .max(4000),
  budgetRange: z.enum(budgetRanges).optional().or(z.literal("")),
  timeline: z.enum(timelines).optional().or(z.literal("")),
  requirements: z.string().trim().max(2000).optional().or(z.literal("")),
  /**
   * Honeypot. Real users never see this field, so anything in it is a bot.
   * Deliberately permissive: rejecting it here would return a validation
   * error naming the field, which tells a bot exactly what to leave blank.
   * The API route accepts the request and silently discards it instead.
   */
  website: z.string().max(200).optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
