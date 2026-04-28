import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePlanStore } from "@/lib/store/plan";
import { HouseholdMemberSchema } from "@/lib/schemas/plan";
import type { HouseholdMember } from "@/lib/schemas/plan";
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
import { Users, Plus, Pencil, Trash2 } from "lucide-react";

const FormSchema = HouseholdMemberSchema.omit({ id: true, photo_path: true });
type FormValues = z.infer<typeof FormSchema>;

function calcAge(birthDate?: string): string {
  if (!birthDate) return "";
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ? 1
      : 0);
  return `${age} yrs`;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function HouseholdRoute() {
  const members = usePlanStore((s) => s.repo?.plan.household.members ?? []);
  const updateHousehold = usePlanStore((s) => s.updateHousehold);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", birth_date: "", dietary: "", medical: "" },
  });

  function openAdd() {
    form.reset({ name: "", birth_date: "", dietary: "", medical: "" });
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(member: HouseholdMember) {
    form.reset({
      name: member.name,
      birth_date: member.birth_date ?? "",
      dietary: member.dietary ?? "",
      medical: member.medical ?? "",
    });
    setEditingId(member.id);
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const cleaned: Partial<HouseholdMember> = {
      name: values.name,
      ...(values.birth_date ? { birth_date: values.birth_date } : {}),
      ...(values.dietary ? { dietary: values.dietary } : {}),
      ...(values.medical ? { medical: values.medical } : {}),
    };
    let updated: HouseholdMember[];
    if (editingId) {
      updated = members.map((m) =>
        m.id === editingId ? { ...m, ...cleaned } : m,
      );
    } else {
      updated = [...members, { id: nanoid(), ...cleaned } as HouseholdMember];
    }
    await updateHousehold({ members: updated });
    setOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    await updateHousehold({ members: members.filter((m) => m.id !== deleteId) });
    setDeleteId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-700" />
          <h1 className="text-2xl font-bold text-green-700">Household</h1>
        </div>
        <Button
          size="sm"
          className="bg-green-700 hover:bg-green-800 text-white"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">
            No members yet. Add the people in your household.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {m.name}
                  {m.birth_date && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {calcAge(m.birth_date)}
                    </span>
                  )}
                </p>
                <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                  {m.dietary && <span>Dietary: {m.dietary}</span>}
                  {m.medical && <span>Medical: {m.medical}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEdit(m)}
                  aria-label={`Edit ${m.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(m.id)}
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteId && (() => {
              const m = members.find((m) => m.id === deleteId);
              return m
                ? `This will permanently remove ${m.name} from your household.`
                : "This will permanently remove this member.";
            })()}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit member" : "Add member"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} autoFocus />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="birth_date">Date of birth</Label>
              <Input
                id="birth_date"
                type="date"
                {...form.register("birth_date")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dietary">Dietary needs</Label>
              <Input
                id="dietary"
                placeholder="e.g. vegetarian, nut allergy"
                {...form.register("dietary")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medical">Medical notes</Label>
              <Input
                id="medical"
                placeholder="e.g. EpiPen required, asthma"
                {...form.register("medical")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white">
                {editingId ? "Save changes" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
