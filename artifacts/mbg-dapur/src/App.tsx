import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

setupAuth();

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/:rest*" component={AuthenticatedApp} />
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
