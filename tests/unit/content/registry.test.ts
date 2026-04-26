import { describe, it, expect } from "vitest";
import {
  CONTENT_TYPES,
  DEFAULT_CONTENT_TYPE,
  resolveContentType,
  getRenderer,
  RENDERERS,
} from "@/lib/content/registry";

// ── resolveContentType ───────────────────────────────────────────────────────

describe("resolveContentType", () => {
  it("returns each known content type unchanged", () => {
    for (const type of CONTENT_TYPES) {
      expect(resolveContentType(type)).toBe(type);
    }
  });

  it("falls back to article_collection for unknown type", () => {
    expect(resolveContentType("unknown_future_type")).toBe("article_collection");
  });

  it("falls back to article_collection for empty string", () => {
    expect(resolveContentType("")).toBe("article_collection");
  });

  it("is case-sensitive (uppercase not accepted)", () => {
    expect(resolveContentType("ARTICLE_COLLECTION")).toBe("article_collection");
  });

  it("defaults to article_collection (constant is correct)", () => {
    expect(DEFAULT_CONTENT_TYPE).toBe("article_collection");
  });
});

// ── RENDERERS map ────────────────────────────────────────────────────────────

describe("RENDERERS", () => {
  it("has an entry for every content type", () => {
    for (const type of CONTENT_TYPES) {
      expect(RENDERERS).toHaveProperty(type);
    }
  });

  it("all registered renderers are functions (React components)", () => {
    for (const type of CONTENT_TYPES) {
      expect(typeof RENDERERS[type]).toBe("function");
    }
  });
});

// ── getRenderer ──────────────────────────────────────────────────────────────

describe("getRenderer", () => {
  it("returns a component for each known content type", () => {
    for (const type of CONTENT_TYPES) {
      const renderer = getRenderer(type);
      expect(typeof renderer).toBe("function");
    }
  });

  it("returns the article_collection renderer for unknown types", () => {
    const fallback = getRenderer("unknown_type");
    const article = getRenderer("article_collection");
    expect(fallback).toBe(article);
  });

  it("returns article_collection renderer for empty string", () => {
    const fallback = getRenderer("");
    const article = getRenderer("article_collection");
    expect(fallback).toBe(article);
  });
});
