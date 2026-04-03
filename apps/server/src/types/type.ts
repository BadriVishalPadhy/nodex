import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().max(20).min(4),
  email: z.string().email("Invalid Email"),
  password: z.string().min(8),
});

export const signinSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const nodeCreateSchema = z.object({
  availableTriggerId: z.string(),
  triggerMeta: z.any().optional(),
  actions: z.array(
    z.object({
      availableActionId: z.string(),
      actionMeta: z.any().optional(),
    }),
  ),
});

export const workflowUpdateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    availableTriggerId: z.string().optional(),
    triggerMeta: z.any().optional(),
    actions: z
      .array(
        z.object({
          availableActionId: z.string(),
          actionMeta: z.any().optional(),
          sortingOrder: z.number().int().min(0).optional(),
        }),
      )
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
