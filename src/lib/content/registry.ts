import type { ComponentType } from "react";

export const CONTENT_TYPES = [
  "structured_record_set",
  "article_collection",
  "geo_layer",
  "checklist",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const DEFAULT_CONTENT_TYPE: ContentType = "article_collection";

export function resolveContentType(raw: string): ContentType {
  if ((CONTENT_TYPES as readonly string[]).includes(raw)) {
    return raw as ContentType;
  }
  return DEFAULT_CONTENT_TYPE;
}

// Placeholder renderer components — replaced by real implementations in Sprint 1 UI work
function ArticleCollectionRenderer() { return null; }
function StructuredRecordRenderer() { return null; }
function GeoLayerRenderer() { return null; }
function ChecklistRenderer() { return null; }

export const RENDERERS: Record<ContentType, ComponentType> = {
  article_collection: ArticleCollectionRenderer,
  structured_record_set: StructuredRecordRenderer,
  geo_layer: GeoLayerRenderer,
  checklist: ChecklistRenderer,
};

export function getRenderer(raw: string): ComponentType {
  const type = resolveContentType(raw);
  return RENDERERS[type];
}
