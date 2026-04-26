import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePlanStore } from "@/lib/store/plan";
import {
  ChecklistItemSchema,
  MedicationSchema,
} from "@/lib/schemas/plan";
import type { ChecklistItem, Medication } from "@/lib/schemas/plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Trash2, Pencil, Droplets } from "lucide-react";

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Go-bag Checklist ──────────────────────────────────────────────────────────

const BagItemFormSchema = ChecklistItemSchema.omit({ id: true, checked: true });
type BagItemForm = z.infer<typeof BagItemFormSchema>;

function GoBagChecklist() {
  const items = usePlanStore((s) => s.repo?.plan.inventory.go_bag ?? []);
  const updateInventory = usePlanStore((s) => s.updateInventory);
  const meds = usePlanStore((s) => s.repo?.plan.inventory.medications ?? []);
  const supplies = usePlanStore((s) => s.repo?.plan.inventory.home_supplies ?? { water_gallons: 0, food_days: 0 });
  const [open, setOpen] = useState(false);

  const form = useForm<BagItemForm>({
    resolver: zodResolver(BagItemFormSchema),
    defaultValues: { label: "", category: "" },
  });

  async function toggleItem(id: string, checked: boolean) {
    const updated = items.map((i) => (i.id === id ? { ...i, checked } : i));
    await updateInventory({ go_bag: updated, medications: meds, home_supplies: supplies });
  }

  async function handleAdd(values: BagItemForm) {
    const item: ChecklistItem = { id: nanoid(), label: values.label, checked: false, category: values.category || undefined };
    await updateInventory({ go_bag: [...items, item], medications: meds, home_supplies: supplies });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await updateInventory({ go_bag: items.filter((i) => i.id !== id), medications: meds, home_supplies: supplies });
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold">Go-bag checklist</h2>
          {items.length > 0 && (
            <p className="text-xs text-muted-foreground">{checkedCount}/{items.length} packed</p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => { form.reset(); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">No items yet. Add the essentials for your emergency go-bag.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded border px-3 py-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => toggleItem(item.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-green-600"
                aria-label={`Mark ${item.label} as packed`}
              />
              <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                {item.label}
                {item.category && <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(item.id)}
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add go-bag item</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Item *</Label>
              <Input placeholder="e.g. Water (1 gallon)" {...form.register("label")} autoFocus />
              {form.formState.errors.label && <p className="text-xs text-destructive">{form.formState.errors.label.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input placeholder="e.g. water, food, first aid" {...form.register("category")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">Add item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Medications ───────────────────────────────────────────────────────────────

const MedFormSchema = MedicationSchema.omit({ id: true });
type MedForm = z.infer<typeof MedFormSchema>;

function Medications() {
  const meds = usePlanStore((s) => s.repo?.plan.inventory.medications ?? []);
  const updateInventory = usePlanStore((s) => s.updateInventory);
  const goBag = usePlanStore((s) => s.repo?.plan.inventory.go_bag ?? []);
  const supplies = usePlanStore((s) => s.repo?.plan.inventory.home_supplies ?? { water_gallons: 0, food_days: 0 });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<MedForm>({
    resolver: zodResolver(MedFormSchema),
    defaultValues: { name: "", dose: "", frequency: "", expiration: "", who: "", notes: "" },
  });

  function openAdd() {
    form.reset({ name: "", dose: "", frequency: "", expiration: "", who: "", notes: "" });
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(m: Medication) {
    form.reset({ name: m.name, dose: m.dose ?? "", frequency: m.frequency ?? "", expiration: m.expiration ?? "", who: m.who ?? "", notes: m.notes ?? "" });
    setEditingId(m.id);
    setOpen(true);
  }

  async function onSubmit(values: MedForm) {
    const item: Medication = {
      id: editingId ?? nanoid(),
      name: values.name,
      ...(values.dose ? { dose: values.dose } : {}),
      ...(values.frequency ? { frequency: values.frequency } : {}),
      ...(values.expiration ? { expiration: values.expiration } : {}),
      ...(values.who ? { who: values.who } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    const updated = editingId ? meds.map((m) => (m.id === editingId ? item : m)) : [...meds, item];
    await updateInventory({ go_bag: goBag, medications: updated, home_supplies: supplies });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    await updateInventory({ go_bag: goBag, medications: meds.filter((m) => m.id !== id), home_supplies: supplies });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Medications</h2>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {meds.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">No medications listed.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Who</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meds.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-sm">{m.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.dose ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.frequency ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.expiration ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.who ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)} aria-label="Edit">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)} aria-label="Remove">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit medication" : "Add medication"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Name *</Label>
                <Input placeholder="e.g. Metformin" {...form.register("name")} autoFocus />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Dose</Label>
                <Input placeholder="e.g. 500mg" {...form.register("dose")} />
              </div>
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Input placeholder="e.g. twice daily" {...form.register("frequency")} />
              </div>
              <div className="space-y-1">
                <Label>Expiration</Label>
                <Input placeholder="e.g. 2027-03" {...form.register("expiration")} />
              </div>
              <div className="space-y-1">
                <Label>Who</Label>
                <Input placeholder="member name" {...form.register("who")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">{editingId ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ── Home Supplies + Water Calculator ─────────────────────────────────────────

function HomeSupplies() {
  const supplies = usePlanStore((s) => s.repo?.plan.inventory.home_supplies ?? { water_gallons: 0, food_days: 0 });
  const goBag = usePlanStore((s) => s.repo?.plan.inventory.go_bag ?? []);
  const meds = usePlanStore((s) => s.repo?.plan.inventory.medications ?? []);
  const memberCount = usePlanStore((s) => s.repo?.plan.household.members.length ?? 1);
  const updateInventory = usePlanStore((s) => s.updateInventory);

  const waterDays = memberCount > 0 ? Math.floor(supplies.water_gallons / memberCount) : 0;

  async function handleChange(field: "water_gallons" | "food_days", value: number) {
    await updateInventory({
      go_bag: goBag,
      medications: meds,
      home_supplies: { ...supplies, [field]: Math.max(0, value) },
    });
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Droplets className="h-4 w-4 text-blue-600" />
        <h2 className="text-base font-semibold">Home supplies</h2>
      </div>
      <div className="grid grid-cols-2 gap-6 max-w-sm">
        <div className="space-y-1">
          <Label htmlFor="water-gallons">Water (gallons)</Label>
          <Input
            id="water-gallons"
            type="number"
            min={0}
            step={1}
            value={supplies.water_gallons}
            onChange={(e) => handleChange("water_gallons", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            ≈ {waterDays} day{waterDays !== 1 ? "s" : ""} for {memberCount} {memberCount === 1 ? "person" : "people"}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="food-days">Food (days)</Label>
          <Input
            id="food-days"
            type="number"
            min={0}
            step={1}
            value={supplies.food_days}
            onChange={(e) => handleChange("food_days", parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            {supplies.food_days >= 14
              ? "✓ 2-week supply met"
              : supplies.food_days >= 7
              ? "✓ 1-week supply met"
              : "FEMA recommends 2 weeks"}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function InventoryRoute() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-green-700" />
        <h1 className="text-2xl font-bold text-green-700">Resource Inventory</h1>
      </div>
      <div className="space-y-10">
        <GoBagChecklist />
        <Medications />
        <HomeSupplies />
      </div>
    </div>
  );
}
