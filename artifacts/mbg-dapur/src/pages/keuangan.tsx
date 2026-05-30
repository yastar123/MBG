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
import { Wallet, TrendingUp, Plus, PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/keuangan/anggaran"] }); qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] }); toast({ title: "Anggaran ditambahkan" }); setOpenAnggaran(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const saveRealisasi = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/keuangan/realisasi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formRealisasi) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/keuangan/realisasi"] }); qc.invalidateQueries({ queryKey: ["/api/keuangan/summary"] }); toast({ title: "Realisasi dicatat" }); setOpenRealisasi(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
        <p className="text-muted-foreground text-sm">Monitor anggaran dan realisasi pengeluaran</p>
      </div>

      {loadSummary ? (
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm"><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Wallet size={20} /></div>
              <div><p className="text-sm text-muted-foreground">Total Anggaran</p><p className="text-lg font-bold">{fmt(summary.total_anggaran)}</p></div>
            </div>
          </CardContent></Card>
          <Card className="shadow-sm"><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><TrendingUp size={20} /></div>
              <div>
                <p className="text-sm text-muted-foreground">Realisasi ({summary.persen_terpakai}%)</p>
                <p className="text-lg font-bold">{fmt(summary.total_realisasi)}</p>
              </div>
            </div>
          </CardContent></Card>
          <Card className={`shadow-sm ${summary.sisa_anggaran < 0 ? "border-destructive/40" : ""}`}><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg text-green-600"><PiggyBank size={20} /></div>
              <div><p className="text-sm text-muted-foreground">Sisa Anggaran</p><p className={`text-lg font-bold ${summary.sisa_anggaran < 0 ? "text-destructive" : ""}`}>{fmt(summary.sisa_anggaran)}</p></div>
            </div>
          </CardContent></Card>
        </div>
      )}

      {summary && summary.breakdown_kategori.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Breakdown Pengeluaran per Kategori</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.breakdown_kategori}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="kategori" tickFormatter={k => kategoriLabel[k] ?? k} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}jt`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={k => kategoriLabel[k as string] ?? k} />
                  <Bar dataKey="jumlah" radius={[4,4,0,0]}>
                    {summary.breakdown_kategori.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="realisasi">
        <TabsList><TabsTrigger value="realisasi">Realisasi</TabsTrigger><TabsTrigger value="anggaran">Anggaran</TabsTrigger></TabsList>

        <TabsContent value="realisasi" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Realisasi Pengeluaran</CardTitle>
                <Button size="sm" onClick={() => setOpenRealisasi(true)} className="gap-1"><Plus size={14} /> Catat</Button>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Kategori</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Jumlah</th>
                </tr></thead>
                <tbody>
                  {(realisasi ?? []).map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-2">{r.tanggal}</td>
                      <td className="py-2 text-muted-foreground">{r.dapur_nama}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{kategoriLabel[r.kategori] ?? r.kategori}</Badge></td>
                      <td className="py-2 text-right font-medium">{fmt(r.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anggaran" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Anggaran per Dapur</CardTitle>
                <Button size="sm" onClick={() => setOpenAnggaran(true)} className="gap-1"><Plus size={14} /> Tambah</Button>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Periode</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Total Anggaran</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Per Porsi</th>
                </tr></thead>
                <tbody>
                  {(anggaran ?? []).map(a => (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 font-medium">{a.dapur_nama}</td>
                      <td className="py-2 text-muted-foreground">{a.periode}</td>
                      <td className="py-2 text-right">{fmt(a.total_anggaran)}</td>
                      <td className="py-2 text-right text-muted-foreground">{a.anggaran_per_porsi ? fmt(a.anggaran_per_porsi) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openAnggaran} onOpenChange={setOpenAnggaran}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Anggaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Dapur</Label>
              <Select value={formAnggaran.dapur_id} onValueChange={v => setFormAnggaran(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Periode (bulan)</Label><Input type="month" value={formAnggaran.periode} onChange={e => setFormAnggaran(f => ({...f, periode: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Total Anggaran (Rp)</Label><Input type="number" value={formAnggaran.total_anggaran} onChange={e => setFormAnggaran(f => ({...f, total_anggaran: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Anggaran per Porsi (Rp)</Label><Input type="number" value={formAnggaran.anggaran_per_porsi} onChange={e => setFormAnggaran(f => ({...f, anggaran_per_porsi: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAnggaran(false)}>Batal</Button>
            <Button onClick={() => saveAnggaran.mutate()} disabled={saveAnggaran.isPending}>{saveAnggaran.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRealisasi} onOpenChange={setOpenRealisasi}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Realisasi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Dapur</Label>
              <Select value={formRealisasi.dapur_id} onValueChange={v => setFormRealisasi(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Tanggal</Label><Input type="date" value={formRealisasi.tanggal} onChange={e => setFormRealisasi(f => ({...f, tanggal: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kategori</Label>
              <Select value={formRealisasi.kategori} onValueChange={v => setFormRealisasi(f => ({...f, kategori: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(kategoriLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Jumlah (Rp)</Label><Input type="number" value={formRealisasi.jumlah} onChange={e => setFormRealisasi(f => ({...f, jumlah: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Deskripsi</Label><Input value={formRealisasi.deskripsi} onChange={e => setFormRealisasi(f => ({...f, deskripsi: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRealisasi(false)}>Batal</Button>
            <Button onClick={() => saveRealisasi.mutate()} disabled={saveRealisasi.isPending}>{saveRealisasi.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
