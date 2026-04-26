import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/shared/AppShell";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { usePlanStore } from "@/lib/store/plan";

const OnboardingRoute = lazy(() => import("@/routes/onboarding"));
const HouseholdRoute = lazy(() => import("@/routes/plan/household"));
const CommunicationRoute = lazy(() => import("@/routes/plan/communication"));
const LogisticsRoute = lazy(() => import("@/routes/plan/logistics"));
const InventoryRoute = lazy(() => import("@/routes/plan/inventory"));
const LibraryIndexRoute = lazy(() => import("@/routes/library/index"));
const LibraryAreaRoute = lazy(() => import("@/routes/library/$area"));
const LibraryArticleRoute = lazy(() => import("@/routes/library/$area.$slug"));
const PacksIndexRoute = lazy(() => import("@/routes/packs/index"));
const CustomIndexRoute = lazy(() => import("@/routes/custom/index"));
const CustomAreaRoute = lazy(() => import("@/routes/custom/$area"));
const CustomArticleRoute = lazy(() => import("@/routes/custom/$area.$slug"));
const SettingsRoute = lazy(() => import("@/routes/settings"));

function AppInitializer() {
  const initialize = usePlanStore((s) => s.initialize);
  const initialized = usePlanStore((s) => s.initialized);
  const firstRun = usePlanStore((s) => s.firstRun);
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && firstRun) {
      navigate("/onboarding", { replace: true });
    }
  }, [initialized, firstRun, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <InstallPrompt />
      <AppInitializer />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/plan/household" replace />} />
            <Route path="/plan/household" element={<HouseholdRoute />} />
            <Route path="/plan/communication" element={<CommunicationRoute />} />
            <Route path="/plan/logistics" element={<LogisticsRoute />} />
            <Route path="/plan/inventory" element={<InventoryRoute />} />
            <Route path="/library" element={<LibraryIndexRoute />} />
            <Route path="/library/:area" element={<LibraryAreaRoute />} />
            <Route path="/library/:area/:slug" element={<LibraryArticleRoute />} />
            <Route path="/packs" element={<PacksIndexRoute />} />
            <Route path="/custom" element={<CustomIndexRoute />} />
            <Route path="/custom/:area" element={<CustomAreaRoute />} />
            <Route path="/custom/:area/:slug" element={<CustomArticleRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
