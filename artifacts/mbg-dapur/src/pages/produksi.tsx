import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Plus, Pencil, TrendingUp, TrendingDown, CalendarDays, Target, Search, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type Produksi = {
  id: number; dapur_id: number; menu_id: number; tanggal: string;
  target_porsi: number; realisasi_porsi: number | null; status: string;
  catatan_qc: string | null; dapur_nama: string | null; menu_nama: string | null;
};
type Dapur = { id: number; nama: string };
type Menu = { id: number; nama: string; tanggal: string };

const today = new Date().toISOString().slice(0, 10);
const emptyAddForm = { dapur_id: "", menu_id: "", tanggal: today, target_porsi: "" };

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dotColor: string }> = {
  dijadwalkan: { label: "Dijadwalkan", variant: "outline",     dotColor: "bg-muted-foreground/50" },
  proses:      { label: "Proses",      variant: "secondary",   dotColor: "bg-amber-500" },
  selesai:     { label: "Selesai",     variant: "secondary",   dotColor: "bg-blue-500" },
  qc_lulus:    { label: "QC Lulus",    variant: "default",     dotColor: "bg-primary" },
  qc_gagal:    { label: "QC Gagal",    variant: "destructive", dotColor: "bg-destructive" },
};

export default function ProduksiPage() {
  const qcClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Produksi[]>({ queryKey: ["/api/produksi"], queryFn: async () => (await fetch("/api/produksi")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const { data: menuList } = useQuery<Menu[]>({ queryKey: ["/api/menu"], queryFn: async () => (await fetch("/api/menu")).json() });
  const [editItem, setEditItem] = useState<Produksi | null>(null);
  const [editForm, setEditForm] = useState({ realisasi_porsi: "", status: "", catatan_qc: "" });
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState(today);
  const [showAllDates, setShowAllDates] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/produksi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error ?? "Gagal menjadwalkan produksi"); }
      return r.json();
    },
    onSuccess: () => {
      qcClient.invalidateQueries({ queryKey: ["/api/produksi"] });
      qcClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({ title: "Produksi dijadwalkan" });
      setOpenAdd(false);
      setAddForm(emptyAddForm);
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/produksi/${editItem!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qcClient.invalidateQueries({ queryKey: ["/api/produksi"] });
      qcClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      qcClient.invalidateQueries({ queryKey: ["/api/dashboard/trends"] });
      toast({ title: "Produksi diperbarui" });
      setEditItem(null);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const todayData = data?.filter(p => p.tanggal === today) ?? [];
  const totalRealisasi = todayData.reduce((s, p) => s + (p.realisasi_porsi ?? 0), 0);
  const totalTarget = todayData.reduce((s, p) => s + p.target_porsi, 0);
  const persen = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  function openEdit(p: Produksi) {
    setEditItem(p);
    setEditForm({ realisasi_porsi: p.realisasi_porsi?.toString() ?? "", status: p.status, catatan_qc: p.catatan_qc ?? "" });
  }

  const pencapaianColor = persen >= 95 ? "text-primary" : persen >= 80 ? "text-amber-600" : "text-destructive";
  const pencapaianBg = persen >= 95 ? "bg-primary/10 text-primary" : persen >= 80 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-destructive";

  // Filter logic
  const filtered = (data ?? []).filter(p => {
    const matchSearch = !search || (p.dapur_nama ?? "").toLowerCase().includes(search.toLowerCase()) || (p.menu_nama ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDate = showAllDates || p.tanggal === filterTanggal;
    return matchSearch && matchDate;
  });

  const filterLabel = showAllDates ? "Semua tanggal" : filterTanggal === today ? "Hari ini" : filterTanggal;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Produksi</h1>
          <p className="page-subheading">Monitor dan catat realisasi produksi harian</p>
        </div>
        <Button onClick={() => { setAddForm(emptyAddForm); setOpenAdd(true); }} className="gap-2 shrink-0">
          <Plus size={16} /> Jadwalkan Produksi
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="stat-card-icon w-11 h-11 bg-primary/10 text-primary"><Target size={19} /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Target Hari Ini</p>
                <p className="text-2xl font-bold text-primary tabular-nums animate-count-up">{totalTarget.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">{todayData.length} sesi produksi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="stat-card-icon w-11 h-11 bg-blue-100 text-blue-600"><Utensils size={19} /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Realisasi</p>
                <p className="text-2xl font-bold tabular-nums animate-count-up">{totalRealisasi.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">porsi selesai diproduksi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${persen >= 95 ? "" : persen >= 80 ? "border-amber-200" : "border-red-200/60"}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`stat-card-icon w-11 h-11 ${pencapaianBg}`}>
                {persen >= 80 ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pencapaian</p>
                <p className={`text-2xl font-bold tabular-nums animate-count-up ${pencapaianColor}`}>{persen}%</p>
                <p className="text-xs text-muted-foreground">{persen >= 95 ? "Target tercapai ✓" : persen >= 80 ? "Mendekati target" : "Di bawah target"}</p>
              </div>
            </div>
            {totalTarget > 0 && <Progress value={persen} className="h-1.5 mt-1" />}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays size={16} className="text-primary" />
                Data Produksi
                <Badge variant="secondary" className="text-xs ml-1">{filtered.length}</Badge>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Date filter */}
                <div className="flex items-center gap-1.5">
                  <Filter size={12} className="text-muted-foreground" />
                  {showAllDates ? (
                    <button
                      onClick={() => setShowAllDates(false)}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      {filterLabel}
                      <X size={11} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        value={filterTanggal}
                        onChange={e => setFilterTanggal(e.target.value)}
                        className="h-8 text-xs w-36 px-2"
                      />
                      <button
                        onClick={() => setShowAllDates(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-muted"
                      >
                        Semua
                      </button>
                    </div>
                  )}
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                  <Input
                    placeholder="Cari dapur / menu..."
                    className="pl-8 h-8 text-xs w-40 sm:w-48"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
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
                <div className="empty-state-icon"><Utensils size={22} className="text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Belum ada data produksi</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Jadwalkan produksi untuk mulai mencatat</p>
                </div>
                <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setAddForm(emptyAddForm); setOpenAdd(true); }}>
                  <Plus size={13} /> Jadwalkan Produksi
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state py-10">
                <p className="text-sm font-medium text-foreground/70">Tidak ada data untuk filter ini</p>
                <p className="text-xs text-muted-foreground/60">Coba ubah tanggal atau kata pencarian</p>
                <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={() => { setSearch(""); setShowAllDates(false); setFilterTanggal(today); }}>
                  Reset filter
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Dapur</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Menu</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Target</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Realisasi</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map(p => {
                      const pct = p.target_porsi > 0 && p.realisasi_porsi != null
                        ? Math.round((p.realisasi_porsi / p.target_porsi) * 100)
                        : null;
                      return (
                        <tr key={p.id} className={`border-b hover:bg-muted/30 transition-colors ${p.tanggal === today ? 'bg-primary/[0.02]' : ''}`}>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{p.tanggal}</td>
                          <td className="py-3 px-4 hidden sm:table-cell font-medium">{p.dapur_nama}</td>
                          <td className="py-3 px-4 max-w-[140px] truncate hidden md:table-cell text-sm text-muted-foreground">{p.menu_nama}</td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums">{p.target_porsi.toLocaleString("id-ID")}</td>
                          <td className="py-3 px-4 text-right font-bold text-primary tabular-nums">
                            {p.realisasi_porsi?.toLocaleString("id-ID") ?? "—"}
                            {pct !== null && (
                              <span className={`text-[10px] font-normal ml-1 ${pct >= 100 ? "text-primary/60" : pct >= 80 ? "text-amber-500/70" : "text-destructive/60"}`}>
                                {pct}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[p.status]?.dotColor ?? "bg-muted"}`} />
                              <Badge variant={statusConfig[p.status]?.variant ?? "outline"} className="text-xs">
                                {statusConfig[p.status]?.label ?? p.status}
                              </Badge>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)} title="Update produksi">
                              <Pencil size={13} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length > 50 && (
                  <div className="px-4 py-3 text-xs text-center text-muted-foreground border-t bg-muted/10">
                    Menampilkan 50 dari {filtered.length} data. Gunakan filter untuk mempersempit hasil.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Jadwalkan Produksi */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Jadwalkan Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Dapur</Label>
              <Select value={addForm.dapur_id} onValueChange={v => setAddForm(f => ({...f, dapur_id: v}))}>
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
            <div className="space-y-1.5">
              <Label>Menu</Label>
              <Select value={addForm.menu_id} onValueChange={v => setAddForm(f => ({...f, menu_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih menu" /></SelectTrigger>
                <SelectContent>
                  {(menuList ?? []).length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Belum ada menu</div>
                  ) : (
                    (menuList ?? []).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nama} <span className="text-muted-foreground">({m.tanggal})</span></SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={addForm.tanggal} onChange={e => setAddForm(f => ({...f, tanggal: e.target.value}))} />
              </div>
              <div className="space-y-1.5"><Label>Target Porsi</Label>
                <Input type="number" value={addForm.target_porsi} onChange={e => setAddForm(f => ({...f, target_porsi: e.target.value}))} placeholder="500" min={1} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !addForm.dapur_id || !addForm.menu_id || !addForm.target_porsi}>
              {create.isPending ? "Menyimpan..." : "Jadwalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Update Produksi */}
      <Dialog open={editItem !== null} onOpenChange={o => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {editItem && (
              <div className="p-3 rounded-xl bg-muted/40 text-sm space-y-0.5">
                <p className="font-semibold text-foreground">{editItem.dapur_nama}</p>
                <p className="text-muted-foreground text-xs">{editItem.menu_nama}</p>
                <p className="text-xs text-muted-foreground">{editItem.tanggal} · Target: <span className="font-semibold text-foreground">{editItem.target_porsi.toLocaleString("id-ID")} porsi</span></p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Realisasi Porsi</Label>
              <Input
                type="number"
                value={editForm.realisasi_porsi}
                onChange={e => setEditForm(f => ({...f, realisasi_porsi: e.target.value}))}
                placeholder="0"
                min={0}
              />
              {editItem && editForm.realisasi_porsi && (
                <p className="text-xs text-muted-foreground">
                  {Math.round((parseFloat(editForm.realisasi_porsi) / editItem.target_porsi) * 100)}% dari target
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([v, c]) => (
                    <SelectItem key={v} value={v}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.dotColor}`} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(editForm.status === "qc_gagal" || editForm.status === "qc_lulus") && (
              <div className="space-y-1.5">
                <Label>Catatan QC</Label>
                <Textarea
                  value={editForm.catatan_qc}
                  onChange={e => setEditForm(f => ({...f, catatan_qc: e.target.value}))}
                  placeholder={editForm.status === "qc_gagal" ? "Alasan QC gagal, tindakan yang diambil..." : "Catatan hasil quality control..."}
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}
            {editForm.status !== "qc_gagal" && editForm.status !== "qc_lulus" && (
              <div className="space-y-1.5">
                <Label>Catatan QC <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  value={editForm.catatan_qc}
                  onChange={e => setEditForm(f => ({...f, catatan_qc: e.target.value}))}
                  placeholder="Catatan hasil quality control..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
            <Button onClick={() => update.mutate()} disabled={update.isPending}>{update.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
