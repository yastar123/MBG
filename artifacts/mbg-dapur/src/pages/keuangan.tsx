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
import { Wallet, TrendingUp, Plus, PiggyBank, ReceiptText, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";

type Summary = { total_anggaran: number; total_realisasi: number; sisa_anggaran: number; persen_terpakai: number; breakdown_kategori: { kategori: string; jumlah: number }[] };
type Anggaran = { id: number; dapur_id: number; periode: string; total_anggaran: number; anggaran_per_porsi: number | null; dapur_nama: string | null };
type Realisasi = { id: number; dapur_id: number; tanggal: string; kategori: string; jumlah: number; deskripsi: string | null; dapur_nama: string | null };
type Dapur = { id: number; nama: string };

const kategoriLabel: Record<string, string> = { bahan_baku: "Bahan Baku", operasional: "Operasional", sdm: "SDM", lainnya: "Lainnya" };
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

function fmt(n: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n); }

const emptyAnggaranForm = { dapur_id: "", periode: new Date().toISOString().slice(0, 7), total_anggaran: "", anggaran_per_porsi: "" };
const emptyRealisasiForm = { dapur_id: "", tanggal: new Date().toISOString().slice(0, 10), kategori: "bahan_baku", jumlah: "", deskripsi: "" };

export default function KeuanganPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: summary, isLoading: loadSummary } = useQuery<Summary>({ queryKey: ["/api/keuangan/summary"], queryFn: async () => (await fetch("/api/keuangan/summary")).json() });
  const { data: anggaran } = useQuery<Anggaran[]>({ queryKey: ["/api/keuangan/anggaran"], queryFn: async () => (await fetch("/api/keuangan/anggaran")).json() });
  const { data: realisasi } = useQuery<Realisasi[]>({ queryKey: ["/api/keuangan/realisasi"], queryFn: async () => (await fetch("/api/keuangan/realisasi")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });

  // Anggaran dialog state
  const [openAnggaran, setOpenAnggaran] = useState(false);
  const [editAnggaran, setEditAnggaran] = useState<Anggaran | null>(null);
  const [formAnggaran, setFormAnggaran] = useState(emptyAnggaranForm);
  const [delAnggaranId, setDelAnggaranId] = useState<number | null>(null);

  // Realisasi dialog state
  const [openRealisasi, setOpenRealisasi] = useState(false);
  const [editRealisasi, setEditRealisasi] = useState<Realisasi | null>(null);
  const [formRealisasi, setFormRealisasi] = useState(emptyRealisasiForm);
  const [delRealisasiId, setDelRealisasiId] = useState<number | null>(null);

  const saveAnggaran = useMutation({
    mutationFn: async () => {
      const url = editAnggaran ? `/api/keuangan/anggaran/${editAnggaran.id}` : "/api/keuangan/anggaran";
      const method = editAnggaran ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formAnggaran) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/keuangan/anggaran"] });
      qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] });
      toast({ title: editAnggaran ? "Anggaran diperbarui" : "Anggaran ditambahkan" });
      setOpenAnggaran(false);
      setEditAnggaran(null);
      setFormAnggaran(emptyAnggaranForm);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const deleteAnggaran = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/keuangan/anggaran/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/keuangan/anggaran"] });
      qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] });
      toast({ title: "Anggaran dihapus" });
      setDelAnggaranId(null);
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const saveRealisasi = useMutation({
    mutationFn: async () => {
      const url = editRealisasi ? `/api/keuangan/realisasi/${editRealisasi.id}` : "/api/keuangan/realisasi";
      const method = editRealisasi ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formRealisasi) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/keuangan/realisasi"] });
      qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] });
      toast({ title: editRealisasi ? "Realisasi diperbarui" : "Realisasi dicatat" });
      setOpenRealisasi(false);
      setEditRealisasi(null);
      setFormRealisasi(emptyRealisasiForm);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const deleteRealisasi = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/keuangan/realisasi/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/keuangan/realisasi"] });
      qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] });
      toast({ title: "Realisasi dihapus" });
      setDelRealisasiId(null);
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openEditAnggaran(a: Anggaran) {
    setEditAnggaran(a);
    setFormAnggaran({ dapur_id: String(a.dapur_id), periode: a.periode, total_anggaran: String(a.total_anggaran), anggaran_per_porsi: a.anggaran_per_porsi?.toString() ?? "" });
    setOpenAnggaran(true);
  }

  function openEditRealisasi(r: Realisasi) {
    setEditRealisasi(r);
    setFormRealisasi({ dapur_id: String(r.dapur_id), tanggal: r.tanggal, kategori: r.kategori, jumlah: String(r.jumlah), deskripsi: r.deskripsi ?? "" });
    setOpenRealisasi(true);
  }

  const persen = summary?.persen_terpakai ?? 0;
  const isOverBudget = (summary?.sisa_anggaran ?? 0) < 0;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="page-heading">Keuangan</h1>
        <p className="page-subheading">Monitor anggaran dan realisasi pengeluaran</p>
      </div>

      {/* Summary cards */}
      {loadSummary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="space-y-4 animate-slide-up">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="shadow-sm card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="stat-card-icon w-10 h-10 bg-primary/10 text-primary"><Wallet size={18} /></div>
                  <p className="text-xs text-muted-foreground font-medium">Total Anggaran</p>
                </div>
                <p className="text-xl font-bold mt-2">{fmt(summary.total_anggaran)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="stat-card-icon w-10 h-10 bg-amber-100 text-amber-600"><TrendingUp size={18} /></div>
                  <p className="text-xs text-muted-foreground font-medium">Realisasi</p>
                </div>
                <p className="text-xl font-bold mt-2">{fmt(summary.total_realisasi)}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Terpakai</span>
                    <span className={persen > 90 ? "text-destructive font-semibold" : ""}>{persen}%</span>
                  </div>
                  <Progress value={Math.min(persen, 100)} className={`h-1.5 ${persen > 90 ? "[&>div]:bg-destructive" : ""}`} />
                </div>
              </CardContent>
            </Card>
            <Card className={`shadow-sm card-hover ${isOverBudget ? "border-destructive/30 bg-destructive/5" : ""}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`stat-card-icon w-10 h-10 ${isOverBudget ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-600"}`}>
                    <PiggyBank size={18} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Sisa Anggaran</p>
                </div>
                <p className={`text-xl font-bold mt-2 ${isOverBudget ? "text-destructive" : "text-green-700"}`}>
                  {fmt(summary.sisa_anggaran)}
                </p>
                {isOverBudget && <p className="text-xs text-destructive mt-1 font-medium">Melebihi anggaran!</p>}
              </CardContent>
            </Card>
          </div>

          {Array.isArray(summary.breakdown_kategori) && summary.breakdown_kategori.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Breakdown Pengeluaran per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.breakdown_kategori} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.6)" />
                      <XAxis dataKey="kategori" tickFormatter={k => kategoriLabel[k] ?? k} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}jt`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v: number) => [fmt(v), "Pengeluaran"]}
                        labelFormatter={k => kategoriLabel[k as string] ?? k}
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px', backgroundColor: 'hsl(var(--card))', padding: '10px 14px' }}
                      />
                      <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {summary.breakdown_kategori.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <Tabs defaultValue="realisasi" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList>
          <TabsTrigger value="realisasi">Realisasi</TabsTrigger>
          <TabsTrigger value="anggaran">Anggaran</TabsTrigger>
        </TabsList>

        {/* Realisasi tab */}
        <TabsContent value="realisasi" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ReceiptText size={16} className="text-primary" />
                  Realisasi Pengeluaran
                  {realisasi && realisasi.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">{realisasi.length}</Badge>
                  )}
                </CardTitle>
                <Button size="sm" onClick={() => { setEditRealisasi(null); setFormRealisasi(emptyRealisasiForm); setOpenRealisasi(true); }} className="gap-1.5">
                  <Plus size={14} /> Catat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(realisasi ?? []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><ReceiptText size={22} className="text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/70">Belum ada catatan realisasi</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Catat pengeluaran untuk mulai monitoring</p>
                  </div>
                  <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setEditRealisasi(null); setFormRealisasi(emptyRealisasiForm); setOpenRealisasi(true); }}>
                    <Plus size={14} />Catat Realisasi
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Dapur</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Kategori</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Deskripsi</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Jumlah</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(realisasi ?? []).map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{r.tanggal}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{r.dapur_nama}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">{kategoriLabel[r.kategori] ?? r.kategori}</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell max-w-[180px] truncate">{r.deskripsi ?? "—"}</td>
                          <td className="py-3 px-4 text-right font-semibold tabular-nums">{fmt(r.jumlah)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditRealisasi(r)}><Pencil size={13} /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelRealisasiId(r.id)}><Trash2 size={13} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/20">
                        <td colSpan={4} className="py-2.5 px-4 text-xs text-muted-foreground font-medium hidden md:table-cell">Total</td>
                        <td colSpan={2} className="py-2.5 px-4 text-xs text-muted-foreground font-medium md:hidden">Total</td>
                        <td className="py-2.5 px-4 text-right font-bold text-sm tabular-nums">
                          {fmt((realisasi ?? []).reduce((s, r) => s + r.jumlah, 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anggaran tab */}
        <TabsContent value="anggaran" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet size={16} className="text-primary" />
                  Anggaran per Dapur
                  {anggaran && anggaran.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">{anggaran.length}</Badge>
                  )}
                </CardTitle>
                <Button size="sm" onClick={() => { setEditAnggaran(null); setFormAnggaran(emptyAnggaranForm); setOpenAnggaran(true); }} className="gap-1.5">
                  <Plus size={14} /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(anggaran ?? []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Wallet size={22} className="text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/70">Belum ada anggaran yang dibuat</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Buat anggaran per dapur per periode</p>
                  </div>
                  <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setEditAnggaran(null); setFormAnggaran(emptyAnggaranForm); setOpenAnggaran(true); }}>
                    <Plus size={14} />Tambah Anggaran
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Dapur</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Periode</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Total Anggaran</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Per Porsi</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(anggaran ?? []).map(a => (
                        <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{a.dapur_nama}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{a.periode}</td>
                          <td className="py-3 px-4 text-right font-semibold tabular-nums">{fmt(a.total_anggaran)}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground hidden md:table-cell tabular-nums">{a.anggaran_per_porsi ? fmt(a.anggaran_per_porsi) : "—"}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditAnggaran(a)}><Pencil size={13} /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelAnggaranId(a.id)}><Trash2 size={13} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/20">
                        <td colSpan={2} className="py-2.5 px-4 text-xs text-muted-foreground font-medium hidden sm:table-cell">Total</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground font-medium sm:hidden">Total</td>
                        <td className="py-2.5 px-4 text-right font-bold text-sm tabular-nums">
                          {fmt((anggaran ?? []).reduce((s, a) => s + a.total_anggaran, 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Tambah / Edit Anggaran */}
      <Dialog open={openAnggaran} onOpenChange={v => { setOpenAnggaran(v); if (!v) { setEditAnggaran(null); setFormAnggaran(emptyAnggaranForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editAnggaran ? "Edit Anggaran" : "Tambah Anggaran"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={formAnggaran.dapur_id} onValueChange={v => setFormAnggaran(f => ({...f, dapur_id: v}))} disabled={!!editAnggaran}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Periode (bulan)</Label>
              <Input type="month" value={formAnggaran.periode} onChange={e => setFormAnggaran(f => ({...f, periode: e.target.value}))} disabled={!!editAnggaran} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Anggaran (Rp)</Label>
                <Input type="number" value={formAnggaran.total_anggaran} onChange={e => setFormAnggaran(f => ({...f, total_anggaran: e.target.value}))} placeholder="50000000" />
              </div>
              <div className="space-y-1.5"><Label>Per Porsi (Rp) <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input type="number" value={formAnggaran.anggaran_per_porsi} onChange={e => setFormAnggaran(f => ({...f, anggaran_per_porsi: e.target.value}))} placeholder="15000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAnggaran(false)}>Batal</Button>
            <Button onClick={() => saveAnggaran.mutate()} disabled={saveAnggaran.isPending || !formAnggaran.dapur_id || !formAnggaran.total_anggaran}>
              {saveAnggaran.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus Anggaran */}
      <Dialog open={delAnggaranId !== null} onOpenChange={() => setDelAnggaranId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Hapus Anggaran</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus anggaran{" "}
            {(() => {
              const a = (anggaran ?? []).find(x => x.id === delAnggaranId);
              return a ? <><span className="font-semibold text-foreground">{a.dapur_nama}</span> periode {a.periode}</> : null;
            })()}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelAnggaranId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delAnggaranId && deleteAnggaran.mutate(delAnggaranId)} disabled={deleteAnggaran.isPending}>
              {deleteAnggaran.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tambah / Edit Realisasi */}
      <Dialog open={openRealisasi} onOpenChange={v => { setOpenRealisasi(v); if (!v) { setEditRealisasi(null); setFormRealisasi(emptyRealisasiForm); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editRealisasi ? "Edit Realisasi" : "Catat Realisasi Pengeluaran"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={formRealisasi.dapur_id} onValueChange={v => setFormRealisasi(f => ({...f, dapur_id: v}))} disabled={!!editRealisasi}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={formRealisasi.tanggal} onChange={e => setFormRealisasi(f => ({...f, tanggal: e.target.value}))} disabled={!!editRealisasi} />
              </div>
              <div className="space-y-1.5"><Label>Kategori</Label>
                <Select value={formRealisasi.kategori} onValueChange={v => setFormRealisasi(f => ({...f, kategori: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(kategoriLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Jumlah (Rp)</Label>
              <Input type="number" value={formRealisasi.jumlah} onChange={e => setFormRealisasi(f => ({...f, jumlah: e.target.value}))} placeholder="1500000" />
            </div>
            <div className="space-y-1.5"><Label>Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={formRealisasi.deskripsi}
                onChange={e => setFormRealisasi(f => ({...f, deskripsi: e.target.value}))}
                placeholder="Pembelian bahan baku harian..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRealisasi(false)}>Batal</Button>
            <Button onClick={() => saveRealisasi.mutate()} disabled={saveRealisasi.isPending || !formRealisasi.dapur_id || !formRealisasi.jumlah}>
              {saveRealisasi.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus Realisasi */}
      <Dialog open={delRealisasiId !== null} onOpenChange={() => setDelRealisasiId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Hapus Realisasi</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus catatan pengeluaran ini?{" "}
            {delRealisasiId && (() => {
              const r = (realisasi ?? []).find(x => x.id === delRealisasiId);
              return r ? <><span className="font-semibold text-foreground">{kategoriLabel[r.kategori]} — {fmt(r.jumlah)}</span></> : null;
            })()}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelRealisasiId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delRealisasiId && deleteRealisasi.mutate(delRealisasiId)} disabled={deleteRealisasi.isPending}>
              {deleteRealisasi.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
