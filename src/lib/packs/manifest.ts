import { z } from "zod";

export const PackManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be semver"),
  title: z.string().min(1),
  author: z
    .object({
      name: z.string(),
      url: z.string().url().optional(),
    })
    .optional(),
  license: z.string().min(1),
  sources: z.array(z.string()).optional(),
  description: z.string().optional(),
  content_areas: z.array(
    z.object({
      path: z.string(),
      content_type: z.string(),
    }),
  ),
  requires: z
    .object({
      app_min_version: z.string().optional(),
    })
    .optional(),
  checksum: z.string().optional(),
});

export type PackManifest = z.infer<typeof PackManifestSchema>;
