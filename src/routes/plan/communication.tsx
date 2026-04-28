import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePlanStore } from "@/lib/store/plan";
import { ContactSchema } from "@/lib/schemas/plan";
import type { PaceTier, Contact } from "@/lib/schemas/plan";
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
import { Radio, Plus, Pencil, Trash2 } from "lucide-react";

const TIER_NAMES: Record<PaceTier["tier"], string> = {
  primary: "Primary",
  alternate: "Alternate",
  contingency: "Contingency",
  emergency: "Emergency",
};

const TIER_DESCRIPTIONS: Record<PaceTier["tier"], string> = {
  primary: "First method of contact — usually cell phone",
  alternate: "Second option when primary fails",
  contingency: "Backup plan when both primary and alternate fail",
  emergency: "Last resort — for life-threatening situations",
};

const ContactFormSchema = ContactSchema.omit({ id: true });
type ContactFormValues = z.infer<typeof ContactFormSchema>;

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function ensureTiers(tiers: PaceTier[]): PaceTier[] {
  const tierOrder: PaceTier["tier"][] = ["primary", "alternate", "contingency", "emergency"];
  return tierOrder.map((tierName) => {
    const existing = tiers.find((t) => t.tier === tierName);
    return existing ?? { tier: tierName, contacts: [], protocol_notes: "" };
  });
}

export default function CommunicationRoute() {
  const rawTiers = usePlanStore((s) => s.repo?.plan.communication.tiers ?? []);
  const updateCommunication = usePlanStore((s) => s.updateCommunication);

  const tiers = ensureTiers(rawTiers);

  const [open, setOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<PaceTier["tier"] | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { name: "", role: "", channel: "cell", value: "", notes: "" },
  });

  function openAddContact(tier: PaceTier["tier"]) {
    form.reset({ name: "", role: "", channel: "cell", value: "", notes: "" });
    setActiveTier(tier);
    setEditingContactId(null);
    setOpen(true);
  }

  function openEditContact(tier: PaceTier["tier"], contact: Contact) {
    form.reset({
      name: contact.name,
      role: contact.role,
      channel: contact.channel,
      value: contact.value,
      notes: contact.notes ?? "",
    });
    setActiveTier(tier);
    setEditingContactId(contact.id);
    setOpen(true);
  }

  async function onSubmit(values: ContactFormValues) {
    if (!activeTier) return;
    const updated = tiers.map((t) => {
      if (t.tier !== activeTier) return t;
      const contact = { ...values, notes: values.notes || undefined };
      const contacts = editingContactId
        ? t.contacts.map((c) =>
            c.id === editingContactId ? { id: c.id, ...contact } : c,
          )
        : [...t.contacts, { id: nanoid(), ...contact }];
      return { ...t, contacts };
    });
    await updateCommunication({ tiers: updated });
    setOpen(false);
  }

  async function handleDeleteContact(tier: PaceTier["tier"], id: string) {
    const updated = tiers.map((t) =>
      t.tier === tier
        ? { ...t, contacts: t.contacts.filter((c) => c.id !== id) }
        : t,
    );
    await updateCommunication({ tiers: updated });
  }

  async function handleNotesChange(tier: PaceTier["tier"], notes: string) {
    const updated = tiers.map((t) =>
      t.tier === tier ? { ...t, protocol_notes: notes } : t,
    );
    await updateCommunication({ tiers: updated });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Radio className="h-5 w-5 text-green-700" />
        <h1 className="text-2xl font-bold text-green-700">Communication Plan</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        The PACE method establishes four tiers of communication — from most to
        least reliable — ensuring your family can reach each other in any situation.
      </p>

      <div className="space-y-4">
        {tiers.map((tier, idx) => (
          <div key={tier.tier} className="rounded-lg border p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <h2 className="font-semibold text-sm">
                    {TIER_NAMES[tier.tier]}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                  {TIER_DESCRIPTIONS[tier.tier]}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAddContact(tier.tier)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add contact
              </Button>
            </div>

            <div className="ml-7 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Protocol notes
                </Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. Call first, then text if no answer in 2 min"
                  defaultValue={tier.protocol_notes}
                  onBlur={(e) =>
                    handleNotesChange(tier.tier, e.target.value)
                  }
                />
              </div>

              {tier.contacts.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {tier.contacts.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded bg-muted/40 px-3 py-2 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{c.name}</span>
                        <span className="mx-1 text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-xs">{c.role}</span>
                        <span className="mx-1 text-muted-foreground">·</span>
                        <span className="text-xs">{c.channel}: {c.value}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditContact(tier.tier, c)}
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteContact(tier.tier, c.id)}
                          aria-label={`Remove ${c.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContactId ? "Edit contact" : "Add contact"}
              {activeTier && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {TIER_NAMES[activeTier]}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="c-name">Name *</Label>
                <Input id="c-name" {...form.register("name")} autoFocus />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-role">Role *</Label>
                <Input
                  id="c-role"
                  placeholder="e.g. spouse, parent"
                  {...form.register("role")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="c-channel">Channel *</Label>
                <Input
                  id="c-channel"
                  placeholder="e.g. cell, email, radio"
                  {...form.register("channel")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-value">Value *</Label>
                <Input
                  id="c-value"
                  placeholder="e.g. 555-0001"
                  {...form.register("value")}
                />
                {form.formState.errors.value && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.value.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-notes">Notes</Label>
              <Input
                id="c-notes"
                placeholder="optional notes"
                {...form.register("notes")}
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
                {editingContactId ? "Save changes" : "Add contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
