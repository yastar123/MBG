import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Plus, Pencil, CheckCircle, Clock, XCircle, MapPin, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Pengiriman = {
  id: number; dapur_id: number; driver_id: number | null; tanggal: string;
  jumlah_porsi: number; tujuan: string; status: string; catatan: string | null;
  dapur_nama: string | null; driver_nama: string | null;
};
type Dapur = { id: number; nama: string };
type User = { id: number; nama: string; role: string };

const statusConfig: Record<string, { label: string; icon: React.ElementType; iconBg: string; iconColor: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  dijadwalkan: { label: "Dijadwalkan", icon: Clock,        iconBg: "bg-muted",          iconColor: "text-muted-foreground", variant: "outline" },
  berangkat:   { label: "Berangkat",   icon: Truck,        iconBg: "bg-amber-100",      iconColor: "text-amber-600",        variant: "secondary" },
  tiba:        { label: "Tiba",        icon: MapPin,       iconBg: "bg-blue-100",       iconColor: "text-blue-600",         variant: "secondary" },
  selesai:     { label: "Selesai",     icon: CheckCircle,  iconBg: "bg-primary/10",     iconColor: "text-primary",          variant: "default" },
  gagal:       { label: "Gagal",       icon: XCircle,      iconBg: "bg-destructive/10", iconColor: "text-destructive",      variant: "destructive" },
};

const emptyForm = { dapur_id: "", driver_id: "", tanggal: new Date().toISOString().slice(0, 10), jumlah_porsi: "", tujuan: "", catatan: "", status: "dijadwalkan" };

export default function DistribusiPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Pengiriman[]>({ queryKey: ["/api/pengiriman"], queryFn: async () => (await fetch("/api/pengiriman")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const { data: userList } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });
  const { data: summary } = useQuery({ queryKey: ["/api/pengiriman/status-summary"], queryFn: async () => (await fetch("/api/pengiriman/status-summary")).json() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pengiriman | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const drivers = userList?.filter(u => u.role === "driver") ?? [];

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/pengiriman/${editing.id}` : "/api/pengiriman";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pengiriman"] });
      qc.invalidateQueries({ queryKey: ["/api/pengiriman/status-summary"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({ title: editing ? "Pengiriman diperbarui" : "Pengiriman ditambahkan" });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: Pengiriman) {
    setEditing(p);
    setForm({ dapur_id: String(p.dapur_id), driver_id: p.driver_id?.toString() ?? "", tanggal: p.tanggal, jumlah_porsi: String(p.jumlah_porsi), tujuan: p.tujuan, catatan: p.catatan ?? "", status: p.status });
    setOpen(true);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayList = data?.filter(p => p.tanggal === today) ?? [];

  const filtered = (data ?? []).filter(p => {
    const matchSearch = !search || p.tujuan.toLowerCase().includes(search.toLowerCase()) || (p.dapur_nama ?? "").toLowerCase().includes(search.toLowerCase()) || (p.driver_nama ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPorsi = (data ?? []).reduce((s, p) => s + p.jumlah_porsi, 0);
  const todayPorsi = todayList.reduce((s, p) => s + p.jumlah_porsi, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Distribusi</h1>
          <p className="page-subheading">Kelola pengiriman makanan ke sekolah</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus size={16} /> Tambah Pengiriman</Button>
      </div>

      {/* Status summary cards */}
      {summary && (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-5 animate-slide-up">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = (summary as Record<string, number>)[key] ?? 0;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(isActive ? null : key)}
                className={`text-center rounded-xl border p-3 transition-all duration-200 hover:shadow-md active:scale-[0.97] ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:bg-muted/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${isActive ? "bg-primary-foreground/20" : cfg.iconBg}`}>
                  <Icon size={15} className={isActive ? "text-primary-foreground" : cfg.iconColor} />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${isActive ? "text-primary-foreground" : ""}`}>{count}</p>
                <p className={`text-xs mt-0.5 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Today's deliveries */}
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck size={16} className="text-primary" />
                Pengiriman Hari Ini
                <Badge variant="secondary" className="text-xs ml-1">{todayList.length}</Badge>
              </CardTitle>
              {todayPorsi > 0 && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/40">
                  {todayPorsi.toLocaleString("id-ID")} porsi total
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todayList.length === 0 ? (
              <div className="empty-state py-10">
                <div className="empty-state-icon">
                  <Truck size={22} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Belum ada pengiriman hari ini</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Jadwalkan pengiriman ke sekolah</p>
                </div>
                <Button size="sm" onClick={openAdd} className="gap-1.5 mt-1"><Plus size={14} />Tambah Pengiriman</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayList.map(p => {
                  const cfg = statusConfig[p.status];
                  const Icon = cfg?.icon ?? Clock;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg?.iconBg ?? "bg-muted"}`}>
                          <Icon size={16} className={cfg?.iconColor ?? "text-muted-foreground"} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{p.tujuan}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.dapur_nama} · {p.jumlah_porsi.toLocaleString("id-ID")} porsi
                            {p.driver_nama && ` · ${p.driver_nama}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={cfg?.variant ?? "outline"} className="text-xs">{cfg?.label ?? p.status}</Badge>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                          <Pencil size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All deliveries with filter */}
      <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              Semua Pengiriman
              {filtered.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">{filtered.length}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter(null)}
                  className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
                >
                  {statusConfig[statusFilter]?.label}
                  <X size={11} />
                </button>
              )}
              {totalPorsi > 0 && (
                <span className="text-xs text-muted-foreground">
                  {totalPorsi.toLocaleString("id-ID")} porsi total
                </span>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Cari tujuan, dapur, driver..."
                  className="pl-9 h-9 text-sm w-44 sm:w-52"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(data ?? []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Truck size={22} className="text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground/70">Belum ada data pengiriman</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Tambahkan pengiriman pertama</p>
              </div>
              <Button size="sm" onClick={openAdd} className="gap-1.5 mt-1"><Plus size={14} />Tambah Pengiriman</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state py-10">
              <p className="text-sm font-medium text-foreground/70">Tidak ada hasil untuk filter ini</p>
              <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter(null); }} className="gap-1.5 mt-1">Reset filter</Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tujuan</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Dapur</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Porsi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden lg:table-cell">Driver</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map(p => (
                    <tr key={p.id} className={`border-b hover:bg-muted/30 transition-colors ${p.tanggal === today ? 'bg-primary/[0.02]' : ''}`}>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{p.tanggal}</td>
                      <td className="py-3 px-4 font-medium">{p.tujuan}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{p.dapur_nama}</td>
                      <td className="py-3 px-4 text-right hidden md:table-cell tabular-nums">{p.jumlah_porsi.toLocaleString("id-ID")}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-sm">{p.driver_nama ?? "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={statusConfig[p.status]?.variant ?? "outline"} className="text-xs">
                          {statusConfig[p.status]?.label ?? p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                          <Pencil size={13} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3 border-t bg-muted/10">
                  Menampilkan 50 dari {filtered.length} pengiriman
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Pengiriman" : "Tambah Pengiriman"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>
                  {(dapurList ?? []).length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Belum ada dapur</div>
                  ) : (
                    (dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Tujuan / Sekolah</Label>
              <Input value={form.tujuan} onChange={e => setForm(f => ({...f, tujuan: e.target.value}))} placeholder="SD Negeri 01..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} />
              </div>
              <div className="space-y-1.5"><Label>Jumlah Porsi</Label>
                <Input type="number" value={form.jumlah_porsi} onChange={e => setForm(f => ({...f, jumlah_porsi: e.target.value}))} placeholder="100" min={1} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Driver <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Select value={form.driver_id} onValueChange={v => setForm(f => ({...f, driver_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Belum ditentukan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Belum ditentukan</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([v, c]) => (
                      <SelectItem key={v} value={v}>
                        <span className="flex items-center gap-2"><c.icon size={13} className={c.iconColor} />{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5"><Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={form.catatan}
                onChange={e => setForm(f => ({...f, catatan: e.target.value}))}
                placeholder="Catatan tambahan tentang pengiriman..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.dapur_id || !form.tujuan || !form.jumlah_porsi}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
