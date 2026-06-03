import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setupAuth } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DapurPage from "@/pages/dapur";
import MenuPage from "@/pages/menu";
import ProduksiPage from "@/pages/produksi";
import AbsensiPage from "@/pages/absensi";
import GudangPage from "@/pages/gudang";
import SupplierPage from "@/pages/supplier";
import DistribusiPage from "@/pages/distribusi";
import PenerimaManfaatPage from "@/pages/penerima-manfaat";
import KeuanganPage from "@/pages/keuangan";
import PenggunaPage from "@/pages/pengguna";
import PengaturanPage from "@/pages/pengaturan";

import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { hasAccess } from "@/lib/permissions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

setupAuth();

function isAuthenticated() {
  return Boolean(localStorage.getItem("mbg_token"));
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function AuthenticatedApp() {
  const { data: user, isLoading } = useGetMe();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Redirect if user attempts to access an unauthorized route
  const isDashboardOrRoot = location === "/" || location === "/dashboard" || location === "/login";
  if (!isDashboardOrRoot && !hasAccess(user.role, location)) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        {hasAccess(user.role, "/dapur") && <Route path="/dapur" component={DapurPage} />}
        {hasAccess(user.role, "/menu") && <Route path="/menu" component={MenuPage} />}
        {hasAccess(user.role, "/produksi") && <Route path="/produksi" component={ProduksiPage} />}
        {hasAccess(user.role, "/absensi") && <Route path="/absensi" component={AbsensiPage} />}
        {hasAccess(user.role, "/gudang/stok") && <Route path="/gudang/stok" component={GudangPage} />}
        {hasAccess(user.role, "/gudang") && <Route path="/gudang" component={GudangPage} />}
        {hasAccess(user.role, "/supplier") && <Route path="/supplier" component={SupplierPage} />}
        {hasAccess(user.role, "/distribusi") && <Route path="/distribusi" component={DistribusiPage} />}
        {hasAccess(user.role, "/penerima-manfaat") && <Route path="/penerima-manfaat" component={PenerimaManfaatPage} />}
        {hasAccess(user.role, "/keuangan/summary") && <Route path="/keuangan/summary" component={KeuanganPage} />}
        {hasAccess(user.role, "/keuangan/anggaran") && <Route path="/keuangan/anggaran" component={KeuanganPage} />}
        {hasAccess(user.role, "/keuangan") && <Route path="/keuangan" component={KeuanganPage} />}
        {hasAccess(user.role, "/pengguna" ) && <Route path="/pengguna" component={PenggunaPage} />}
        {hasAccess(user.role, "/pengaturan") && <Route path="/pengaturan" component={PengaturanPage} />}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <Redirect to={isAuthenticated() ? "/dashboard" : "/login"} />}</Route>
      <Route path="/login">{() => <PublicOnlyRoute component={Login} />}</Route>
      <Route path="/:rest*">{() => <ProtectedRoute component={AuthenticatedApp} />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
