import { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import { MapPin, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RouteMapProps {
  geojson?: string;
  onSave?: (geojson: string) => void;
  readOnly?: boolean;
}

function parseGeoJson(raw: string): GeoJsonObject | null {
  try {
    return JSON.parse(raw) as GeoJsonObject;
  } catch {
    return null;
  }
}

export function RouteMap({ geojson, onSave, readOnly = false }: RouteMapProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(geojson ?? "");
  const [parseError, setParseError] = useState<string | null>(null);

  const parsed = geojson ? parseGeoJson(geojson) : null;

  function handleSave() {
    if (!draft.trim()) {
      onSave?.("");
      setEditOpen(false);
      return;
    }
    const result = parseGeoJson(draft);
    if (!result) {
      setParseError("Invalid GeoJSON — check syntax and try again.");
      return;
    }
    setParseError(null);
    onSave?.(draft);
    setEditOpen(false);
  }

  return (
    <div className="space-y-2">
      {parsed ? (
        <div className="rounded-md overflow-hidden border h-48">
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON data={parsed} />
          </MapContainer>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>No route drawn</span>
        </div>
      )}

      {!readOnly && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDraft(geojson ?? "");
            setParseError(null);
            setEditOpen(true);
          }}
        >
          <Edit2 className="h-3.5 w-3.5 mr-1" />
          {geojson ? "Edit GeoJSON" : "Add GeoJSON route"}
        </Button>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit evacuation route GeoJSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Paste valid GeoJSON (LineString or FeatureCollection). You can
              draw routes at{" "}
              <a
                href="https://geojson.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                geojson.io
              </a>{" "}
              and paste the result here.
            </p>
            <div className="space-y-1">
              <Label htmlFor="geojson-input">GeoJSON</Label>
              <Textarea
                id="geojson-input"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setParseError(null);
                }}
                className="font-mono text-xs h-48 resize-none"
                placeholder={'{"type":"LineString","coordinates":[[lng,lat],[lng,lat]]}'}
                spellCheck={false}
              />
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
