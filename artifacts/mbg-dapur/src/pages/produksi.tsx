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
import { Utensils, Plus, Pencil, TrendingUp, TrendingDown, CalendarDays, Target, Search } from "lucide-react";
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

const emptyAddForm = { dapur_id: "", menu_id: "", tanggal: new Date().toISOString().slice(0, 10), target_porsi: "" };

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; cls: string }> = {
  dijadwalkan: { label: "Dijadwalkan", variant: "outline", cls: "text-muted-foreground" },
  proses:      { label: "Proses", variant: "secondary", cls: "text-amber-600" },
  selesai:     { label: "Selesai", variant: "secondary", cls: "text-blue-600" },
  qc_lulus:    { label: "QC Lulus", variant: "default", cls: "text-primary" },
  qc_gagal:    { label: "QC Gagal", variant: "destructive", cls: "text-destructive" },
};

export default function ProduksiPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Produksi[]>({ queryKey: ["/api/produksi"], queryFn: async () => (await fetch("/api/produksi")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const { data: menuList } = useQuery<Menu[]>({ queryKey: ["/api/menu"], queryFn: async () => (await fetch("/api/menu")).json() });
  const [editItem, setEditItem] = useState<Produksi | null>(null);
  const [editForm, setEditForm] = useState({ realisasi_porsi: "", status: "", catatan_qc: "" });
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [search, setSearch] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/produksi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      if (!r.ok) throw new Error("Gagal menjadwalkan produksi");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/produksi"] }); toast({ title: "Produksi dijadwalkan" }); setOpenAdd(false); setAddForm(emptyAddForm); },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/produksi/${editItem!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/produksi"] }); toast({ title: "Produksi diperbarui" }); setEditItem(null); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const today = new Date().toISOString().slice(0, 10);
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

  const filtered = (data ?? []).filter(p =>
    !search ||
    (p.dapur_nama ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.menu_nama ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
              <div className="stat-card-icon w-11 h-11 bg-primary/10 text-primary">
                <Target size={19} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Target Hari Ini</p>
                <p className="text-2xl font-bold text-primary">{totalTarget.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">{todayData.length} sesi produksi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="stat-card-icon w-11 h-11 bg-blue-100 text-blue-600">
                <Utensils size={19} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Realisasi</p>
                <p className="text-2xl font-bold">{totalRealisasi.toLocaleString("id-ID")}</p>
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
                <p className={`text-2xl font-bold ${pencapaianColor}`}>{persen}%</p>
                <p className="text-xs text-muted-foreground">{persen >= 95 ? "Target tercapai ✓" : persen >= 80 ? "Mendekati target" : "Di bawah target"}</p>
              </div>
            </div>
            {totalTarget > 0 && <Progress value={persen} className="h-1.5 mt-1" />}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays size={16} className="text-primary" />
                Data Produksi
                <Badge variant="secondary" className="text-xs ml-1">{filtered.length}</Badge>
              </CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Cari dapur atau menu..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Utensils size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data produksi</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-muted-foreground">Tidak ditemukan hasil pencarian</p>
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
                    {filtered.slice(0, 30).map(p => (
                      <tr key={p.id} className={`border-b hover:bg-muted/30 transition-colors ${p.tanggal === today ? 'bg-primary/3' : ''}`}>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{p.tanggal}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-sm">{p.dapur_nama}</td>
                        <td className="py-3 px-4 max-w-[140px] truncate hidden md:table-cell text-sm text-muted-foreground">{p.menu_nama}</td>
                        <td className="py-3 px-4 text-right font-medium">{p.target_porsi.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-4 text-right font-bold text-primary">{p.realisasi_porsi?.toLocaleString("id-ID") ?? "—"}</td>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Jadwalkan Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={addForm.dapur_id} onValueChange={v => setAddForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Menu</Label>
              <Select value={addForm.menu_id} onValueChange={v => setAddForm(f => ({...f, menu_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih menu" /></SelectTrigger>
                <SelectContent>{(menuList ?? []).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nama} ({m.tanggal})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={addForm.tanggal} onChange={e => setAddForm(f => ({...f, tanggal: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Target Porsi</Label><Input type="number" value={addForm.target_porsi} onChange={e => setAddForm(f => ({...f, target_porsi: e.target.value}))} placeholder="500" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !addForm.dapur_id || !addForm.menu_id}>
              {create.isPending ? "Menyimpan..." : "Jadwalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editItem !== null} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {editItem && (
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <span className="font-semibold">{editItem.dapur_nama}</span>
                <span className="text-muted-foreground"> — {editItem.menu_nama}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{editItem.tanggal} · Target: {editItem.target_porsi.toLocaleString("id-ID")} porsi</p>
              </div>
            )}
            <div className="space-y-1.5"><Label>Realisasi Porsi</Label>
              <Input type="number" value={editForm.realisasi_porsi} onChange={e => setEditForm(f => ({...f, realisasi_porsi: e.target.value}))} placeholder="0" />
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
