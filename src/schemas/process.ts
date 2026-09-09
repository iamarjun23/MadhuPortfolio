import { z } from "zod";

/* The Studio page (/process) - the "How I work" page the nav points at. Everything
   on it used to be hard-coded in the component, so it is the one public page the
   owner could not touch; this schema is what makes it editable like the rest. */

const StepSchema = z.object({
  id: z.string(),
  number: z.string().max(4),
  title: z.string().max(40),
  description: z.string().max(320),
});

const TurnaroundRowSchema = z.object({
  id: z.string(),
  format: z.string().max(60),
  timing: z.string().max(60),
});

const NoteSchema = z.object({
  id: z.string(),
  text: z.string().max(200),
});

export const ProcessSchema = z.object({
  eyebrow: z.string().max(40).default("Studio"),
  heading: z.string().max(80).default("The work behind the cut."),
  intro: z.string().max(280).default(""),
  method: z
    .object({
      eyebrow: z.string().max(40).default("How I work"),
      heading: z.string().max(80).default("Five passes. One better film."),
      steps: z.array(StepSchema).max(12).default([]),
    })
    .default({ eyebrow: "How I work", heading: "Five passes. One better film.", steps: [] }),
  turnaround: z
    .object({
      eyebrow: z.string().max(40).default("Turnaround"),
      heading: z.string().max(80).default("Know the rhythm before we start."),
      rows: z.array(TurnaroundRowSchema).max(12).default([]),
      notes: z.array(NoteSchema).max(6).default([]),
    })
    .default({
      eyebrow: "Turnaround",
      heading: "Know the rhythm before we start.",
      rows: [],
      notes: [],
    }),
  showPhotobooth: z.boolean().default(true),
  seo: z
    .object({
      title: z.string().max(60).default("Studio"),
      description: z.string().max(200).default(""),
    })
    .default({ title: "Studio", description: "" }),
});

export type Process = z.infer<typeof ProcessSchema>;
