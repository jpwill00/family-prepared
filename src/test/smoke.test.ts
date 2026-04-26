import { describe, it, expect } from "vitest";
import { resolveContentType } from "@/lib/content/registry";
import { PackManifestSchema } from "@/lib/packs/manifest";

describe("content registry", () => {
  it("resolves known content types", () => {
    expect(resolveContentType("article_collection")).toBe("article_collection");
    expect(resolveContentType("structured_record_set")).toBe(
      "structured_record_set",
    );
  });

  it("falls back to article_collection for unknown types", () => {
    expect(resolveContentType("unknown_future_type")).toBe("article_collection");
  });
});

describe("pack manifest schema", () => {
  it("validates a valid pack manifest", () => {
    const result = PackManifestSchema.safeParse({
      id: "test-pack",
      version: "1.0.0",
      title: "Test Pack",
      license: "CC-BY-4.0",
      content_areas: [
        { path: "content/test", content_type: "article_collection" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid pack id (not kebab-case)", () => {
    const result = PackManifestSchema.safeParse({
      id: "Test Pack Invalid",
      version: "1.0.0",
      title: "Test Pack",
      license: "CC-BY-4.0",
      content_areas: [],
    });
    expect(result.success).toBe(false);
  });
});
