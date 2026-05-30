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
import { Utensils, Plus, Pencil, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type Produksi = {
  id: number; dapur_id: number; menu_id: number; tanggal: string;
  target_porsi: number; realisasi_porsi: number | null; status: string;
  catatan_qc: string | null; dapur_nama: string | null; menu_nama: string | null;
};
type Dapur = { id: number; nama: string };
type Menu = { id: number; nama: string; tanggal: string };

const emptyAddForm = { dapur_id: "", menu_id: "", tanggal: new Date().toISOString().slice(0, 10), target_porsi: "" };

const statusLabel: Record<string, string> = {
  dijadwalkan: "Dijadwalkan", proses: "Proses", selesai: "Selesai",
  qc_lulus: "QC Lulus", qc_gagal: "QC Gagal",
};
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  dijadwalkan: "outline", proses: "secondary", selesai: "secondary",
  qc_lulus: "default", qc_gagal: "destructive",
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

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/produksi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!r.ok) throw new Error("Gagal menjadwalkan produksi");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/produksi"] });
      toast({ title: "Produksi dijadwalkan" });
      setOpenAdd(false);
      setAddForm(emptyAddForm);
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/produksi/${editItem!.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/produksi"] });
      toast({ title: "Produksi diperbarui" });
      setEditItem(null);
    },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produksi</h1>
          <p className="text-muted-foreground text-sm">Monitor dan catat realisasi produksi harian</p>
        </div>
        <Button onClick={() => { setAddForm(emptyAddForm); setOpenAdd(true); }} className="gap-2">
          <Plus size={16} /> Jadwalkan Produksi
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm"><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><CalendarDays size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Target Hari Ini</p>
              <p className="text-2xl font-bold text-primary">{totalTarget.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">porsi dari {todayData.length} sesi</p>
            </div>
          </div>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Utensils size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Realisasi</p>
              <p className="text-2xl font-bold">{totalRealisasi.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">porsi selesai diproduksi</p>
            </div>
          </div>
        </CardContent></Card>
        <Card className={`shadow-sm ${persen >= 95 ? "" : persen >= 80 ? "border-amber-200" : "border-red-200"}`}><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${persen >= 95 ? "bg-primary/10 text-primary" : persen >= 80 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-destructive"}`}>
              {persen >= 95 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pencapaian</p>
              <p className={`text-2xl font-bold ${persen >= 95 ? "text-primary" : persen >= 80 ? "text-amber-600" : "text-destructive"}`}>{persen}%</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{persen >= 95 ? "Target tercapai" : "Di bawah target"}</span>
              </div>
            </div>
          </div>
          {totalTarget > 0 && <Progress value={persen} className="mt-3 h-1.5" />}
        </CardContent></Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Utensils size={18} className="text-primary" /> Data Produksi Terbaru</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Menu</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Target</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Realisasi</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
                </tr></thead>
                <tbody>
                  {(data ?? []).slice(0, 30).map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2">{p.tanggal}</td>
                      <td className="py-2">{p.dapur_nama}</td>
                      <td className="py-2 max-w-[160px] truncate">{p.menu_nama}</td>
                      <td className="py-2 text-right">{p.target_porsi.toLocaleString("id-ID")}</td>
                      <td className="py-2 text-right font-medium">{p.realisasi_porsi?.toLocaleString("id-ID") ?? "-"}</td>
                      <td className="py-2 text-center">
                        <Badge variant={statusVariant[p.status] ?? "outline"} className="text-xs">{statusLabel[p.status] ?? p.status}</Badge>
                      </td>
                      <td className="py-2 text-center">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Jadwalkan Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Dapur</Label>
              <Select value={addForm.dapur_id} onValueChange={v => setAddForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Menu</Label>
              <Select value={addForm.menu_id} onValueChange={v => setAddForm(f => ({...f, menu_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih menu" /></SelectTrigger>
                <SelectContent>{(menuList ?? []).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nama} ({m.tanggal})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Tanggal</Label><Input type="date" value={addForm.tanggal} onChange={e => setAddForm(f => ({...f, tanggal: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Target Porsi</Label><Input type="number" value={addForm.target_porsi} onChange={e => setAddForm(f => ({...f, target_porsi: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Menyimpan..." : "Jadwalkan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editItem !== null} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Produksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{editItem?.dapur_nama}</span> — {editItem?.menu_nama}
            </div>
            <div className="space-y-1"><Label>Realisasi Porsi</Label><Input type="number" value={editForm.realisasi_porsi} onChange={e => setEditForm(f => ({...f, realisasi_porsi: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Catatan QC</Label><Input value={editForm.catatan_qc} onChange={e => setEditForm(f => ({...f, catatan_qc: e.target.value}))} /></div>
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
