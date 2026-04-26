import { Outlet, NavLink } from "react-router-dom";
import {
  Users,
  Radio,
  Map,
  Package,
  BookOpen,
  Archive,
  PenSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Household", to: "/plan/household", icon: Users, zone: "plan" },
  { label: "Communication", to: "/plan/communication", icon: Radio, zone: "plan" },
  { label: "Logistics", to: "/plan/logistics", icon: Map, zone: "plan" },
  { label: "Inventory", to: "/plan/inventory", icon: Package, zone: "plan" },
  { label: "Library", to: "/library", icon: BookOpen, zone: "library" },
  { label: "Packs", to: "/packs", icon: Archive, zone: "packs" },
  { label: "Custom", to: "/custom", icon: PenSquare, zone: "custom" },
  { label: "Settings", to: "/settings", icon: Settings, zone: null },
] as const;

const zoneColors: Record<string, string> = {
  plan: "text-green-700",
  library: "text-blue-700",
  packs: "text-purple-700",
  custom: "text-amber-700",
};

export function AppShell() {
  return (
    <div className="flex h-screen">
      <nav
        className="w-56 shrink-0 border-r bg-muted/30 flex flex-col py-4"
        aria-label="Main navigation"
      >
        <div className="px-4 mb-6">
          <span className="text-lg font-bold text-green-700">Family Prepared</span>
        </div>
        <ul className="flex-1 space-y-1 px-2">
          {nav.map(({ label, to, icon: Icon, zone }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-medium"
                      : "hover:bg-accent/50",
                    zone ? zoneColors[zone] : "text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
