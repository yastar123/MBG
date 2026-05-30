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
import { Wallet, TrendingUp, Plus, PiggyBank, ReceiptText } from "lucide-react";
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

  const [openAnggaran, setOpenAnggaran] = useState(false);
  const [formAnggaran, setFormAnggaran] = useState(emptyAnggaranForm);
  const [openRealisasi, setOpenRealisasi] = useState(false);
  const [formRealisasi, setFormRealisasi] = useState(emptyRealisasiForm);

  const saveAnggaran = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/keuangan/anggaran", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formAnggaran) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/keuangan/anggaran"] }); qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] }); toast({ title: "Anggaran ditambahkan" }); setOpenAnggaran(false); setFormAnggaran(emptyAnggaranForm); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const saveRealisasi = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/keuangan/realisasi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formRealisasi) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/keuangan/realisasi"] }); qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] }); toast({ title: "Realisasi dicatat" }); setOpenRealisasi(false); setFormRealisasi(emptyRealisasiForm); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const persen = summary?.persen_terpakai ?? 0;
  const isOverBudget = (summary?.sisa_anggaran ?? 0) < 0;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="page-heading">Keuangan</h1>
        <p className="page-subheading">Monitor anggaran dan realisasi pengeluaran</p>
      </div>

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
                {isOverBudget && <p className="text-xs text-destructive mt-1">Melebihi anggaran!</p>}
              </CardContent>
            </Card>
          </div>

          {summary.breakdown_kategori.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Breakdown Pengeluaran per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.breakdown_kategori} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="kategori" tickFormatter={k => kategoriLabel[k] ?? k} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}jt`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v: number) => fmt(v)}
                        labelFormatter={k => kategoriLabel[k as string] ?? k}
                        contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: '12px', backgroundColor: 'hsl(var(--card))' }}
                      />
                      <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
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
        <TabsList><TabsTrigger value="realisasi">Realisasi</TabsTrigger><TabsTrigger value="anggaran">Anggaran</TabsTrigger></TabsList>

        <TabsContent value="realisasi" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ReceiptText size={16} className="text-primary" />
                  Realisasi Pengeluaran
                </CardTitle>
                <Button size="sm" onClick={() => { setFormRealisasi(emptyRealisasiForm); setOpenRealisasi(true); }} className="gap-1.5">
                  <Plus size={14} /> Catat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(realisasi ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <ReceiptText size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Belum ada catatan realisasi</p>
                  <Button size="sm" onClick={() => { setFormRealisasi(emptyRealisasiForm); setOpenRealisasi(true); }} className="gap-1.5"><Plus size={14} />Catat Realisasi</Button>
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
                      </tr>
                    </thead>
                    <tbody>
                      {(realisasi ?? []).map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground">{r.tanggal}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{r.dapur_nama}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">{kategoriLabel[r.kategori] ?? r.kategori}</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell max-w-[180px] truncate">{r.deskripsi ?? "—"}</td>
                          <td className="py-3 px-4 text-right font-semibold">{fmt(r.jumlah)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anggaran" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet size={16} className="text-primary" />
                  Anggaran per Dapur
                </CardTitle>
                <Button size="sm" onClick={() => { setFormAnggaran(emptyAnggaranForm); setOpenAnggaran(true); }} className="gap-1.5">
                  <Plus size={14} /> Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(anggaran ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <Wallet size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Belum ada anggaran yang dibuat</p>
                  <Button size="sm" onClick={() => { setFormAnggaran(emptyAnggaranForm); setOpenAnggaran(true); }} className="gap-1.5"><Plus size={14} />Tambah Anggaran</Button>
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
                      </tr>
                    </thead>
                    <tbody>
                      {(anggaran ?? []).map(a => (
                        <tr key={a.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{a.dapur_nama}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{a.periode}</td>
                          <td className="py-3 px-4 text-right font-semibold">{fmt(a.total_anggaran)}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground hidden md:table-cell">{a.anggaran_per_porsi ? fmt(a.anggaran_per_porsi) : "—"}</td>
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

      <Dialog open={openAnggaran} onOpenChange={setOpenAnggaran}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Tambah Anggaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={formAnggaran.dapur_id} onValueChange={v => setFormAnggaran(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Periode (bulan)</Label>
              <Input type="month" value={formAnggaran.periode} onChange={e => setFormAnggaran(f => ({...f, periode: e.target.value}))} />
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

      <Dialog open={openRealisasi} onOpenChange={setOpenRealisasi}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Catat Realisasi Pengeluaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={formRealisasi.dapur_id} onValueChange={v => setFormRealisasi(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={formRealisasi.tanggal} onChange={e => setFormRealisasi(f => ({...f, tanggal: e.target.value}))} />
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
              <Input value={formRealisasi.deskripsi} onChange={e => setFormRealisasi(f => ({...f, deskripsi: e.target.value}))} placeholder="Pembelian bahan baku harian..." />
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
    </div>
  );
}
