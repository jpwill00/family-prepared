import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePlanStore } from "@/lib/store/plan";
import { RouteMap } from "@/components/plan/RouteMap";
import {
  SafeRoomSchema,
  MeetingPointSchema,
  EvacuationRouteSchema,
} from "@/lib/schemas/plan";
import type { SafeRoom, MeetingPoint, EvacuationRoute } from "@/lib/schemas/plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Map, Plus, Pencil, Trash2 } from "lucide-react";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function tryParseJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

// ── Safe Rooms ────────────────────────────────────────────────────────────────

const SafeRoomFormSchema = SafeRoomSchema.omit({ id: true });
type SafeRoomForm = z.infer<typeof SafeRoomFormSchema>;

function SafeRooms() {
  const rooms = usePlanStore((s) => s.repo?.plan.logistics.safe_rooms ?? []);
  const updateLogistics = usePlanStore((s) => s.updateLogistics);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<SafeRoomForm>({
    resolver: zodResolver(SafeRoomFormSchema),
    defaultValues: { location: "", notes: "" },
  });

  function openAdd() {
    form.reset({ location: "", notes: "" });
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(r: SafeRoom) {
    form.reset({ location: r.location, notes: r.notes ?? "" });
    setEditingId(r.id);
    setOpen(true);
  }

  async function onSubmit(values: SafeRoomForm) {
    const item = { ...values, notes: values.notes || undefined };
    const updated = editingId
      ? rooms.map((r) => (r.id === editingId ? { id: r.id, ...item } : r))
      : [...rooms, { id: nanoid(), ...item }];
    await updateLogistics({ safe_rooms: updated });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await updateLogistics({ safe_rooms: rooms.filter((r) => r.id !== id) });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Safe rooms</h2>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">
          No safe rooms added. These are interior rooms to shelter-in-place.
        </p>
      ) : (
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.location}</p>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} aria-label={`Edit ${r.location}`}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)} aria-label="Remove">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit safe room" : "Add safe room"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sr-location">Location *</Label>
              <Input
                id="sr-location"
                placeholder="e.g. Basement northeast corner"
                {...form.register("location")}
                autoFocus
              />
              {form.formState.errors.location && (
                <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sr-notes">Notes</Label>
              <Textarea
                id="sr-notes"
                placeholder="e.g. Emergency kit stored here. Heavy door."
                className="resize-none h-20"
                {...form.register("notes")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">
                {editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Meeting Points ────────────────────────────────────────────────────────────

const MeetingPointFormSchema = MeetingPointSchema.omit({ id: true });
type MeetingPointForm = z.infer<typeof MeetingPointFormSchema>;

function MeetingPoints() {
  const points = usePlanStore((s) => s.repo?.plan.logistics.meeting_points ?? []);
  const updateLogistics = usePlanStore((s) => s.updateLogistics);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<MeetingPointForm>({
    resolver: zodResolver(MeetingPointFormSchema),
    defaultValues: { type: "primary", description: "", address: "", notes: "" },
  });

  function openAdd() {
    form.reset({ type: "primary", description: "", address: "", notes: "" });
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(p: MeetingPoint) {
    form.reset({ type: p.type, description: p.description, address: p.address ?? "", notes: p.notes ?? "" });
    setEditingId(p.id);
    setOpen(true);
  }

  async function onSubmit(values: MeetingPointForm) {
    const item = { ...values, address: values.address || undefined, notes: values.notes || undefined };
    const updated = editingId
      ? points.map((p) => (p.id === editingId ? { id: p.id, ...item } : p))
      : [...points, { id: nanoid(), ...item }];
    await updateLogistics({ meeting_points: updated });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await updateLogistics({ meeting_points: points.filter((p) => p.id !== id) });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Meeting points</h2>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">
          No meeting points yet. Add primary and alternate rally locations.
        </p>
      ) : (
        <ul className="space-y-2">
          {points.map((p) => (
            <li key={p.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.type === "primary"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {p.type === "primary" ? "Primary" : "Alternate"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.description}</p>
                  {p.address && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>
                  )}
                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} aria-label="Remove">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit meeting point" : "Add meeting point"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mp-type">Type *</Label>
              <select
                id="mp-type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...form.register("type")}
              >
                <option value="primary">Primary — first rally point</option>
                <option value="alternate">Alternate — backup location</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-description">Description *</Label>
              <Input
                id="mp-description"
                placeholder="e.g. Front yard oak tree"
                {...form.register("description")}
                autoFocus
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-address">Address</Label>
              <Input
                id="mp-address"
                placeholder="e.g. 123 Main St, Springfield"
                {...form.register("address")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mp-notes">Notes</Label>
              <Textarea
                id="mp-notes"
                placeholder="e.g. Meet by the mailbox. Bring go-bags."
                className="resize-none h-20"
                {...form.register("notes")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">
                {editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Evacuation Routes ─────────────────────────────────────────────────────────

const RouteFormSchema = EvacuationRouteSchema.omit({ id: true, geojson: true });
type RouteForm = z.infer<typeof RouteFormSchema>;

function EvacuationRoutes() {
  const routes = usePlanStore((s) => s.repo?.plan.logistics.evacuation_routes ?? []);
  const updateLogistics = usePlanStore((s) => s.updateLogistics);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [geojsonDraft, setGeojsonDraft] = useState("");
  const [geojsonError, setGeojsonError] = useState<string | null>(null);
  const form = useForm<RouteForm>({
    resolver: zodResolver(RouteFormSchema),
    defaultValues: { name: "", notes: "" },
  });

  function openAdd() {
    form.reset({ name: "", notes: "" });
    setGeojsonDraft("");
    setGeojsonError(null);
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(r: EvacuationRoute) {
    form.reset({ name: r.name, notes: r.notes ?? "" });
    setGeojsonDraft(r.geojson ?? "");
    setGeojsonError(null);
    setEditingId(r.id);
    setOpen(true);
  }

  async function onSubmit(values: RouteForm) {
    if (geojsonDraft.trim() && !tryParseJson(geojsonDraft)) {
      setGeojsonError("Invalid GeoJSON — check syntax and try again.");
      return;
    }
    const item: EvacuationRoute = {
      id: editingId ?? nanoid(),
      name: values.name,
      notes: values.notes || undefined,
      geojson: geojsonDraft.trim() || undefined,
    };
    const updated = editingId
      ? routes.map((r) => (r.id === editingId ? item : r))
      : [...routes, item];
    await updateLogistics({ evacuation_routes: updated });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await updateLogistics({ evacuation_routes: routes.filter((r) => r.id !== id) });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Evacuation routes</h2>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      {routes.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">
          No routes yet. Add named evacuation paths with optional map routes.
        </p>
      ) : (
        <ul className="space-y-3">
          {routes.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card text-sm overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.name}</p>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} aria-label="Edit">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)} aria-label="Remove">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="border-t px-4 pb-3 pt-2">
                <RouteMap geojson={r.geojson} readOnly />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit evacuation route" : "Add evacuation route"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="er-name">Route name *</Label>
              <Input
                id="er-name"
                placeholder="e.g. Route A — North on Oak St"
                {...form.register("name")}
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-notes">Notes</Label>
              <Input
                id="er-notes"
                placeholder="e.g. Avoid highway during rush hour"
                {...form.register("notes")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-geojson">Map route (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Draw a route at{" "}
                <a
                  href="https://geojson.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  geojson.io
                </a>
                {" "}and paste the GeoJSON below.
              </p>
              <Textarea
                id="er-geojson"
                value={geojsonDraft}
                onChange={(e) => {
                  setGeojsonDraft(e.target.value);
                  setGeojsonError(null);
                }}
                className="font-mono text-xs h-28 resize-none"
                placeholder={'{"type":"LineString","coordinates":[[lng,lat],[lng,lat]]}'}
                spellCheck={false}
              />
              {geojsonError && (
                <p className="text-xs text-destructive">{geojsonError}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">
                {editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Main route ────────────────────────────────────────────────────────────────

export default function LogisticsRoute() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Map className="h-5 w-5 text-green-700" />
        <h1 className="text-2xl font-bold text-green-700">Logistics</h1>
      </div>
      <div className="space-y-8">
        <SafeRooms />
        <MeetingPoints />
        <EvacuationRoutes />
      </div>
    </div>
  );
}
