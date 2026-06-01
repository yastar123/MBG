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
import { Package, AlertTriangle, Plus, Pencil, Trash2, TrendingDown, CheckCircle, ClipboardList, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

type Stok = { id: number; bahan_baku_id: number; bahan_baku_nama: string; kuantitas: number; satuan: string; stok_minimum: number; updated_at: string };
type BahanBaku = { id: number; nama: string; satuan: string; stok_minimum: number; kategori: string | null };
type Penerimaan = { id: number; supplier_id: number; tanggal: string; total_item: number | null; status: string; catatan: string | null; supplier_nama: string | null };
type Supplier = { id: number; nama: string };

const emptyBahan = { nama: "", satuan: "", stok_minimum: "", kategori: "" };
const getEmptyPenerimaan = () => ({ supplier_id: "", tanggal: new Date().toISOString().slice(0, 10), catatan: "", status: "pending" });

export default function GudangPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stok, isLoading: loadingStok } = useQuery<Stok[]>({ queryKey: ["/api/stok"], queryFn: async () => (await fetch("/api/stok")).json() });
  const { data: bahan, isLoading: loadingBahan } = useQuery<BahanBaku[]>({ queryKey: ["/api/bahan-baku"], queryFn: async () => (await fetch("/api/bahan-baku")).json() });
  const { data: penerimaan, isLoading: loadingPenerimaan } = useQuery<Penerimaan[]>({ queryKey: ["/api/penerimaan-bahan"], queryFn: async () => (await fetch("/api/penerimaan-bahan")).json() });
  const { data: supplierList } = useQuery<Supplier[]>({ queryKey: ["/api/supplier"], queryFn: async () => (await fetch("/api/supplier")).json() });

  const [openBahan, setOpenBahan] = useState(false);
  const [editBahan, setEditBahan] = useState<BahanBaku | null>(null);
  const [formBahan, setFormBahan] = useState(emptyBahan);
  const [delBahanId, setDelBahanId] = useState<number | null>(null);

  const [openPenerimaan, setOpenPenerimaan] = useState(false);
  const [formPenerimaan, setFormPenerimaan] = useState(getEmptyPenerimaan);

  // Stok update dialog
  const [openStokUpdate, setOpenStokUpdate] = useState(false);
  const [stokUpdateItem, setStokUpdateItem] = useState<Stok | null>(null);
  const [stokUpdateValue, setStokUpdateValue] = useState("");

  const saveBahan = useMutation({
    mutationFn: async () => {
      const url = editBahan ? `/api/bahan-baku/${editBahan.id}` : "/api/bahan-baku";
      const method = editBahan ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formBahan) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/bahan-baku"] });
      qc.invalidateQueries({ queryKey: ["/api/stok"] });
      toast({ title: editBahan ? "Bahan baku diperbarui" : "Bahan baku ditambahkan" });
      setOpenBahan(false);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const delBahan = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/bahan-baku/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/bahan-baku"] });
      qc.invalidateQueries({ queryKey: ["/api/stok"] });
      toast({ title: "Bahan baku dihapus" });
      setDelBahanId(null);
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const savePenerimaan = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/penerimaan-bahan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPenerimaan),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/penerimaan-bahan"] });
      qc.invalidateQueries({ queryKey: ["/api/stok"] });
      toast({ title: "Penerimaan bahan berhasil dicatat" });
      setOpenPenerimaan(false);
      setFormPenerimaan(getEmptyPenerimaan());
    },
    onError: () => toast({ title: "Gagal mencatat penerimaan", variant: "destructive" }),
  });

  const updateStok = useMutation({
    mutationFn: async () => {
      if (!stokUpdateItem) throw new Error();
      const r = await fetch(`/api/stok/${stokUpdateItem.bahan_baku_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuantitas: parseFloat(stokUpdateValue) }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/stok"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      toast({ title: "Stok berhasil diperbarui" });
      setOpenStokUpdate(false);
      setStokUpdateItem(null);
      setStokUpdateValue("");
    },
    onError: () => toast({ title: "Gagal memperbarui stok", variant: "destructive" }),
  });

  const alertItems = stok?.filter(s => s.kuantitas <= s.stok_minimum) ?? [];
  const hampirHabisItems = stok?.filter(s => s.kuantitas > s.stok_minimum && s.kuantitas <= s.stok_minimum * 1.5) ?? [];
  const amanItems = stok?.filter(s => s.kuantitas > s.stok_minimum * 1.5) ?? [];

  function openAddBahan() { setEditBahan(null); setFormBahan(emptyBahan); setOpenBahan(true); }
  function openEditBahan(b: BahanBaku) {
    setEditBahan(b);
    setFormBahan({ nama: b.nama, satuan: b.satuan, stok_minimum: String(b.stok_minimum), kategori: b.kategori ?? "" });
    setOpenBahan(true);
  }
  function openUpdateStok(s: Stok) {
    setStokUpdateItem(s);
    setStokUpdateValue(String(s.kuantitas));
    setOpenStokUpdate(true);
  }

  function getStokStatus(s: Stok) {
    if (s.kuantitas <= s.stok_minimum) return { label: "Rendah", variant: "destructive" as const, bar: "bg-destructive", pct: Math.min(100, Math.round((s.kuantitas / Math.max(s.stok_minimum, 0.01)) * 100)) };
    if (s.kuantitas <= s.stok_minimum * 1.5) return { label: "Hampir Habis", variant: "outline" as const, bar: "bg-amber-400", pct: Math.min(100, Math.round((s.kuantitas / (s.stok_minimum * 1.5)) * 100)) };
    return { label: "Aman", variant: "default" as const, bar: "bg-primary", pct: 100 };
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Gudang</h1>
          <p className="page-subheading">Manajemen bahan baku dan stok gudang</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { qc.invalidateQueries({ queryKey: ["/api/stok"] }); qc.invalidateQueries({ queryKey: ["/api/bahan-baku"] }); }}
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {!loadingStok && stok && stok.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 animate-slide-up">
          {[
            { label: "Total Bahan", value: stok.length, icon: Package, bg: "bg-muted/50", color: "text-foreground", border: "border-transparent" },
            { label: "Stok Rendah", value: alertItems.length, icon: TrendingDown, bg: alertItems.length > 0 ? "bg-destructive/5" : "bg-muted/50", color: alertItems.length > 0 ? "text-destructive" : "text-muted-foreground", border: alertItems.length > 0 ? "border border-destructive/20" : "border-transparent" },
            { label: "Stok Aman", value: amanItems.length, icon: CheckCircle, bg: "bg-primary/5", color: "text-primary", border: "border border-primary/10" },
          ].map((stat, i) => (
            <div key={stat.label} className={`${stat.bg} ${stat.border} rounded-xl p-4 text-center animate-slide-up`} style={{ animationDelay: `${i * 0.06}s` }}>
              <p className={`text-2xl font-bold ${stat.color} animate-count-up`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {alertItems.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm animate-slide-up">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-destructive/15 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={14} className="text-destructive" />
              </div>
              <span className="font-semibold text-destructive text-sm">
                {alertItems.length} bahan baku di bawah batas minimum
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertItems.map(s => (
                <Badge key={s.bahan_baku_id} variant="destructive" className="text-xs gap-1">
                  {s.bahan_baku_nama}: {s.kuantitas} {s.satuan}
                  <span className="opacity-70">(min {s.stok_minimum})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hampirHabisItems.length > 0 && alertItems.length === 0 && (
        <Card className="border-amber-200/60 bg-amber-50/40 shadow-sm animate-slide-up">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={14} className="text-amber-600" />
              </div>
              <span className="font-semibold text-amber-700 text-sm">
                {hampirHabisItems.length} bahan mendekati batas minimum
              </span>
              <div className="flex flex-wrap gap-1.5 ml-1">
                {hampirHabisItems.map(s => (
                  <Badge key={s.bahan_baku_id} variant="outline" className="text-xs text-amber-700 border-amber-300">
                    {s.bahan_baku_nama}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stok" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList className="mb-4">
          <TabsTrigger value="stok">
            Stok Saat Ini
            {alertItems.length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {alertItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bahan">Bahan Baku</TabsTrigger>
          <TabsTrigger value="penerimaan">Penerimaan</TabsTrigger>
        </TabsList>

        <TabsContent value="stok">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package size={16} className="text-primary" /> Stok Gudang
                </CardTitle>
                <p className="text-xs text-muted-foreground">Klik ikon pensil untuk update stok</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStok ? (
                <div className="p-4 space-y-2">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : (stok ?? []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Package size={22} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/70">Belum ada data stok</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Tambahkan bahan baku terlebih dahulu di tab "Bahan Baku"</p>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Bahan Baku</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Stok</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Minimum</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Level</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stok ?? []).map(s => {
                        const st = getStokStatus(s);
                        return (
                          <tr key={s.bahan_baku_id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-medium">{s.bahan_baku_nama}</td>
                            <td className="py-3 px-4 text-right font-semibold tabular-nums">
                              {s.kuantitas} <span className="text-muted-foreground font-normal text-xs">{s.satuan}</span>
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell text-xs tabular-nums">
                              {s.stok_minimum} {s.satuan}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell w-32">
                              <Progress value={st.pct} className="h-1.5" />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => openUpdateStok(s)}
                                title="Update stok"
                              >
                                <Pencil size={13} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bahan">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Daftar Bahan Baku</CardTitle>
                <Button size="sm" onClick={openAddBahan} className="gap-1.5"><Plus size={14} /> Tambah</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingBahan ? (
                <div className="p-4 space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : (bahan ?? []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Package size={22} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/70">Belum ada bahan baku</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Mulai dengan menambahkan bahan baku</p>
                  </div>
                  <Button size="sm" onClick={openAddBahan} className="gap-1.5 mt-1"><Plus size={14} />Tambah Bahan</Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Nama</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Satuan</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Kategori</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Min. Stok</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bahan ?? []).map(b => (
                        <tr key={b.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{b.nama}</td>
                          <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{b.satuan}</td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {b.kategori ? (
                              <Badge variant="secondary" className="text-xs">{b.kategori}</Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">{b.stok_minimum} <span className="text-muted-foreground text-xs">{b.satuan}</span></td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditBahan(b)}><Pencil size={13} /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelBahanId(b.id)}><Trash2 size={13} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="penerimaan">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary" />
                  Riwayat Penerimaan Bahan
                </CardTitle>
                <Button size="sm" onClick={() => { setFormPenerimaan(getEmptyPenerimaan()); setOpenPenerimaan(true); }} className="gap-1.5">
                  <Plus size={14} /> Catat Penerimaan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPenerimaan ? (
                <div className="p-4 space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : (penerimaan ?? []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <ClipboardList size={22} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/70">Belum ada riwayat penerimaan</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Catat setiap penerimaan bahan dari supplier</p>
                  </div>
                  <Button size="sm" onClick={() => { setFormPenerimaan(getEmptyPenerimaan()); setOpenPenerimaan(true); }} className="gap-1.5 mt-1">
                    <Plus size={14} /> Catat Penerimaan
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Supplier</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Jumlah Item</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Catatan</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(penerimaan ?? []).map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground">{p.tanggal}</td>
                          <td className="py-3 px-4 font-medium">{p.supplier_nama ?? "—"}</td>
                          <td className="py-3 px-4 text-right hidden sm:table-cell tabular-nums">{p.total_item ?? 0}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell max-w-[160px] truncate">{p.catatan ?? "—"}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={p.status === "diterima" ? "default" : p.status === "ditolak" ? "destructive" : "secondary"}
                              className="text-xs capitalize"
                            >
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Tambah/Edit Bahan Baku */}
      <Dialog open={openBahan} onOpenChange={setOpenBahan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editBahan ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nama Bahan</Label>
              <Input value={formBahan.nama} onChange={e => setFormBahan(f => ({...f, nama: e.target.value}))} placeholder="Beras, Ayam, Telur..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Satuan</Label>
                <Input value={formBahan.satuan} onChange={e => setFormBahan(f => ({...f, satuan: e.target.value}))} placeholder="kg, liter, butir" />
              </div>
              <div className="space-y-1.5"><Label>Stok Minimum</Label>
                <Input type="number" value={formBahan.stok_minimum} onChange={e => setFormBahan(f => ({...f, stok_minimum: e.target.value}))} placeholder="50" min={0} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Kategori <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Input value={formBahan.kategori} onChange={e => setFormBahan(f => ({...f, kategori: e.target.value}))} placeholder="Protein, Karbohidrat, Sayuran..." />
            </div>
            {!editBahan && (
              <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                Stok awal akan diset ke 0. Perbarui stok di tab "Stok Saat Ini" setelah bahan ditambahkan.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBahan(false)}>Batal</Button>
            <Button onClick={() => saveBahan.mutate()} disabled={saveBahan.isPending || !formBahan.nama || !formBahan.satuan}>
              {saveBahan.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Update Stok */}
      <Dialog open={openStokUpdate} onOpenChange={o => { if (!o) { setOpenStokUpdate(false); setStokUpdateItem(null); setStokUpdateValue(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Stok</DialogTitle>
          </DialogHeader>
          {stokUpdateItem && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/40 text-sm">
                <p className="font-semibold text-foreground">{stokUpdateItem.bahan_baku_nama}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stok saat ini: <span className="font-semibold text-foreground">{stokUpdateItem.kuantitas} {stokUpdateItem.satuan}</span>
                  {" · "}Minimum: {stokUpdateItem.stok_minimum} {stokUpdateItem.satuan}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Stok Baru ({stokUpdateItem.satuan})</Label>
                <Input
                  type="number"
                  value={stokUpdateValue}
                  onChange={e => setStokUpdateValue(e.target.value)}
                  placeholder={`Masukkan kuantitas dalam ${stokUpdateItem.satuan}`}
                  min={0}
                  step="0.01"
                  autoFocus
                />
              </div>
              {stokUpdateValue !== "" && parseFloat(stokUpdateValue) <= stokUpdateItem.stok_minimum && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-2 rounded-lg">
                  <AlertTriangle size={13} className="shrink-0" />
                  Nilai ini berada di bawah atau sama dengan batas minimum stok.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenStokUpdate(false); setStokUpdateItem(null); setStokUpdateValue(""); }}>Batal</Button>
            <Button
              onClick={() => updateStok.mutate()}
              disabled={updateStok.isPending || stokUpdateValue === "" || isNaN(parseFloat(stokUpdateValue))}
            >
              {updateStok.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus Bahan */}
      <Dialog open={delBahanId !== null} onOpenChange={() => setDelBahanId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Bahan Baku</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus bahan <span className="font-semibold text-foreground">{(bahan ?? []).find(b => b.id === delBahanId)?.nama}</span>?{" "}
            Data stok terkait juga akan dihapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelBahanId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delBahanId && delBahan.mutate(delBahanId)} disabled={delBahan.isPending}>
              {delBahan.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Catat Penerimaan */}
      <Dialog open={openPenerimaan} onOpenChange={setOpenPenerimaan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Catat Penerimaan Bahan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Supplier</Label>
              <Select value={formPenerimaan.supplier_id} onValueChange={v => setFormPenerimaan(f => ({...f, supplier_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                <SelectContent>
                  {(supplierList ?? []).length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Belum ada supplier. Tambahkan dulu di halaman Supplier.</div>
                  ) : (
                    (supplierList ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={formPenerimaan.tanggal} onChange={e => setFormPenerimaan(f => ({...f, tanggal: e.target.value}))} />
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={formPenerimaan.status} onValueChange={v => setFormPenerimaan(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="diterima">Diterima</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={formPenerimaan.catatan}
                onChange={e => setFormPenerimaan(f => ({...f, catatan: e.target.value}))}
                placeholder="Kondisi bahan, kuantitas, dll..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPenerimaan(false)}>Batal</Button>
            <Button onClick={() => savePenerimaan.mutate()} disabled={savePenerimaan.isPending || !formPenerimaan.supplier_id}>
              {savePenerimaan.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
