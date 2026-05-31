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
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dapur" component={DapurPage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/produksi" component={ProduksiPage} />
        <Route path="/absensi" component={AbsensiPage} />
        <Route path="/gudang/stok" component={GudangPage} />
        <Route path="/gudang" component={GudangPage} />
        <Route path="/supplier" component={SupplierPage} />
        <Route path="/distribusi" component={DistribusiPage} />
        <Route path="/penerima-manfaat" component={PenerimaManfaatPage} />
        <Route path="/keuangan/summary" component={KeuanganPage} />
        <Route path="/keuangan/anggaran" component={KeuanganPage} />
        <Route path="/keuangan" component={KeuanganPage} />
        <Route path="/pengguna" component={PenggunaPage} />
        <Route path="/pengaturan" component={PengaturanPage} />
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
