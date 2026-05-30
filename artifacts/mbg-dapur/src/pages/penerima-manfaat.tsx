import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Pencil, Trash2, Search, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type PenerimaManfaat = { id: number; nama: string; sekolah: string; kelas: string; wilayah: string; is_aktif: boolean };
type Summary = { wilayah: string; total_penerima: number; hadir_hari_ini: number; persen_jangkauan: number };

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
const emptyForm = { nama: "", sekolah: "", kelas: "", wilayah: "" };

export default function PenerimaManfaatPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<PenerimaManfaat[]>({ queryKey: ["/api/penerima-manfaat"], queryFn: async () => (await fetch("/api/penerima-manfaat")).json() });
  const { data: summary } = useQuery<Summary[]>({ queryKey: ["/api/verifikasi-penerimaan/summary"], queryFn: async () => (await fetch("/api/verifikasi-penerimaan/summary")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PenerimaManfaat | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/penerima-manfaat/${editing.id}` : "/api/penerima-manfaat";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/penerima-manfaat"] }); toast({ title: editing ? "Data diperbarui" : "Penerima ditambahkan" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/penerima-manfaat/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/penerima-manfaat"] }); toast({ title: "Data dihapus" }); setDelId(null); },
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: PenerimaManfaat) {
    setEditing(p);
    setForm({ nama: p.nama, sekolah: p.sekolah, kelas: p.kelas, wilayah: p.wilayah });
    setOpen(true);
  }

  const filtered = (data ?? []).filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.sekolah.toLowerCase().includes(search.toLowerCase()) ||
    p.wilayah.toLowerCase().includes(search.toLowerCase())
  );

  const totalAktif = (data ?? []).filter(p => p.is_aktif).length;
  const totalHadir = (summary ?? []).reduce((s, x) => s + x.hadir_hari_ini, 0);

  const pieData = (summary ?? []).map(s => ({ name: s.wilayah, value: s.total_penerima }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penerima Manfaat</h1>
          <p className="text-muted-foreground text-sm">Kelola data siswa penerima program MBG</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Penerima</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm"><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><Users size={20} /></div>
            <div><p className="text-sm text-muted-foreground">Total Aktif</p><p className="text-2xl font-bold">{totalAktif}</p></div>
          </div>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg text-green-600"><GraduationCap size={20} /></div>
            <div><p className="text-sm text-muted-foreground">Hadir Hari Ini</p><p className="text-2xl font-bold">{totalHadir}</p></div>
          </div>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><GraduationCap size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Jangkauan Hari Ini</p>
              <p className="text-2xl font-bold">{totalAktif > 0 ? Math.round((totalHadir / totalAktif) * 100) : 0}%</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {pieData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Distribusi per Wilayah</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Cari nama, sekolah, wilayah..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} penerima</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Nama</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Sekolah</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Kelas</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Wilayah</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">{p.nama}</td>
                    <td className="py-2 text-muted-foreground">{p.sekolah}</td>
                    <td className="py-2">{p.kelas}</td>
                    <td className="py-2">{p.wilayah}</td>
                    <td className="py-2 text-center">
                      <Badge variant={p.is_aktif ? "default" : "secondary"} className="text-xs">{p.is_aktif ? "Aktif" : "Nonaktif"}</Badge>
                    </td>
                    <td className="py-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDelId(p.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Penerima" : "Tambah Penerima Manfaat"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Sekolah</Label><Input value={form.sekolah} onChange={e => setForm(f => ({...f, sekolah: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kelas</Label><Input value={form.kelas} onChange={e => setForm(f => ({...f, kelas: e.target.value}))} placeholder="Kelas 1, Kelas 2, dst" /></div>
            <div className="space-y-1"><Label>Wilayah</Label><Input value={form.wilayah} onChange={e => setForm(f => ({...f, wilayah: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Penerima</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin ingin menghapus data penerima manfaat ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
