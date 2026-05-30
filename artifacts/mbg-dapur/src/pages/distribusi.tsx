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
import { Truck, Plus, Pencil, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Pengiriman = {
  id: number; dapur_id: number; driver_id: number | null; tanggal: string;
  jumlah_porsi: number; tujuan: string; status: string; catatan: string | null;
  dapur_nama: string | null; driver_nama: string | null;
};
type Dapur = { id: number; nama: string };
type User = { id: number; nama: string; role: string };

const statusConfig: Record<string, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  dijadwalkan: { label: "Dijadwalkan", color: "text-muted-foreground", variant: "outline" },
  berangkat: { label: "Berangkat", color: "text-amber-600", variant: "secondary" },
  tiba: { label: "Tiba", color: "text-blue-600", variant: "secondary" },
  selesai: { label: "Selesai", color: "text-primary", variant: "default" },
  gagal: { label: "Gagal", color: "text-destructive", variant: "destructive" },
};

const emptyForm = { dapur_id: "", driver_id: "", tanggal: new Date().toISOString().slice(0, 10), jumlah_porsi: "", tujuan: "", catatan: "" };

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

  const drivers = userList?.filter(u => u.role === "driver") ?? [];

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/pengiriman/${editing.id}` : "/api/pengiriman";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pengiriman"] }); qc.invalidateQueries({ queryKey: ["/api/pengiriman/status-summary"] }); toast({ title: editing ? "Pengiriman diperbarui" : "Pengiriman ditambahkan" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: Pengiriman) {
    setEditing(p);
    setForm({ dapur_id: String(p.dapur_id), driver_id: p.driver_id?.toString() ?? "", tanggal: p.tanggal, jumlah_porsi: String(p.jumlah_porsi), tujuan: p.tujuan, catatan: p.catatan ?? "" });
    setOpen(true);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayList = data?.filter(p => p.tanggal === today) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distribusi</h1>
          <p className="text-muted-foreground text-sm">Kelola pengiriman makanan ke sekolah</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Pengiriman</Button>
      </div>

      {summary && (
        <div className="grid gap-3 md:grid-cols-5">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Card key={key} className="shadow-sm text-center">
              <CardContent className="pt-4 pb-4">
                <p className={`text-2xl font-bold ${cfg.color}`}>{(summary as any)[key] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck size={18} className="text-primary" /> Pengiriman Hari Ini ({todayList.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayList.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.status === "selesai" ? "bg-primary/10 text-primary" : p.status === "gagal" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-600"}`}>
                      {p.status === "selesai" ? <CheckCircle size={16} /> : p.status === "gagal" ? <XCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.tujuan}</p>
                      <p className="text-xs text-muted-foreground">{p.dapur_nama} • {p.jumlah_porsi.toLocaleString("id-ID")} porsi{p.driver_nama ? ` • ${p.driver_nama}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[p.status]?.variant ?? "outline"} className="text-xs">{statusConfig[p.status]?.label ?? p.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                  </div>
                </div>
              ))}
              {todayList.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">Belum ada pengiriman hari ini</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Semua Pengiriman</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Tujuan</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Porsi</th>
              <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
              <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
            </tr></thead>
            <tbody>
              {(data ?? []).slice(0, 30).map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="py-2">{p.tanggal}</td>
                  <td className="py-2">{p.tujuan}</td>
                  <td className="py-2 text-muted-foreground">{p.dapur_nama}</td>
                  <td className="py-2 text-right">{p.jumlah_porsi.toLocaleString("id-ID")}</td>
                  <td className="py-2 text-center">
                    <Badge variant={statusConfig[p.status]?.variant ?? "outline"} className="text-xs">{statusConfig[p.status]?.label ?? p.status}</Badge>
                  </td>
                  <td className="py-2 text-center">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Pengiriman" : "Tambah Pengiriman"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Dapur</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Driver</Label>
              <Select value={form.driver_id} onValueChange={v => setForm(f => ({...f, driver_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Belum ditentukan</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Tujuan / Sekolah</Label><Input value={form.tujuan} onChange={e => setForm(f => ({...f, tujuan: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Jumlah Porsi</Label><Input type="number" value={form.jumlah_porsi} onChange={e => setForm(f => ({...f, jumlah_porsi: e.target.value}))} /></div>
            {editing && (
              <div className="space-y-1"><Label>Status</Label>
                <Select value={form.tujuan !== "" ? editing.status : ""} defaultValue={editing.status}
                  onValueChange={v => setEditing(ed => ed ? {...ed, status: v} : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
