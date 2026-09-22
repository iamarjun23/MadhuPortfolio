import { z } from "zod";
import { MediaUrlSchema } from "./media";

export const ClientsSchema = z.object({
  heading: z.string().max(80).default("Companies I've worked with"),
  clients: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        logo: z.object({ url: MediaUrlSchema }),
      }),
    )
    .max(40),
});

export type Clients = z.infer<typeof ClientsSchema>;
