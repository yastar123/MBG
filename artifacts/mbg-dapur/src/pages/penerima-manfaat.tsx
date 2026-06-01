import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Pencil, Trash2, Search, GraduationCap, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type PenerimaManfaat = { id: number; nama: string; sekolah: string; kelas: string; wilayah: string; is_aktif: boolean };
type Summary = { wilayah: string; total_penerima: number; hadir_hari_ini: number; persen_jangkauan: number };

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
const emptyForm = { nama: "", sekolah: "", kelas: "", wilayah: "", is_aktif: true };

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
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/penerima-manfaat/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/penerima-manfaat"] }); toast({ title: "Data dihapus" }); setDelId(null); },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: PenerimaManfaat) {
    setEditing(p);
    setForm({ nama: p.nama, sekolah: p.sekolah, kelas: p.kelas, wilayah: p.wilayah, is_aktif: p.is_aktif });
    setOpen(true);
  }

  const filtered = (data ?? []).filter(p =>
    !search ||
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.sekolah.toLowerCase().includes(search.toLowerCase()) ||
    p.wilayah.toLowerCase().includes(search.toLowerCase())
  );

  const totalAktif = (data ?? []).filter(p => p.is_aktif).length;
  const totalHadir = (summary ?? []).reduce((s, x) => s + x.hadir_hari_ini, 0);
  const jangkauan = totalAktif > 0 ? Math.round((totalHadir / totalAktif) * 100) : 0;
  const pieData = (summary ?? []).filter(s => s.total_penerima > 0).map(s => ({ name: s.wilayah, value: s.total_penerima }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Penerima Manfaat</h1>
          <p className="page-subheading">Kelola data siswa penerima program MBG</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus size={16} /> Tambah Penerima</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up">
        {[
          { label: "Total Aktif", value: totalAktif, icon: Users, iconBg: "bg-primary/10 text-primary", valueColor: "text-foreground", delay: "0s" },
          { label: "Hadir Hari Ini", value: totalHadir, icon: GraduationCap, iconBg: "bg-green-100 text-green-600", valueColor: "text-green-700", delay: "0.05s" },
          { label: "Jangkauan", value: `${jangkauan}%`, icon: School, iconBg: "bg-blue-100 text-blue-600", valueColor: "text-blue-700", delay: "0.1s" },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm animate-slide-up" style={{ animationDelay: stat.delay }}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`stat-card-icon w-11 h-11 ${stat.iconBg}`}>
                  <stat.icon size={19} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pieData.length > 0 && (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <CardHeader>
            <CardTitle className="text-base">Distribusi per Wilayah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={35}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} siswa`, "Total"]} contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Daftar Penerima
              <Badge variant="secondary" className="text-xs ml-1">{filtered.length}</Badge>
            </CardTitle>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input placeholder="Cari nama, sekolah, wilayah..." className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-48 w-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Users size={22} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {search ? "Penerima tidak ditemukan" : "Belum ada data penerima manfaat"}
              </p>
              {!search && <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus size={14} />Tambah Penerima</Button>}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Sekolah</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Kelas</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden lg:table-cell">Wilayah</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{p.nama}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{p.sekolah}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-sm">{p.kelas}</td>
                      <td className="py-3 px-4 hidden lg:table-cell text-sm">{p.wilayah}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.is_aktif ? "default" : "secondary"} className="text-xs">
                          {p.is_aktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p)}><Pencil size={13} /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(p.id)}><Trash2 size={13} /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Penerima" : "Tambah Penerima Manfaat"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} placeholder="Ahmad Budi" />
            </div>
            <div className="space-y-1.5"><Label>Sekolah</Label>
              <Input value={form.sekolah} onChange={e => setForm(f => ({...f, sekolah: e.target.value}))} placeholder="SD Negeri 01" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Kelas</Label>
                <Input value={form.kelas} onChange={e => setForm(f => ({...f, kelas: e.target.value}))} placeholder="Kelas 4" />
              </div>
              <div className="space-y-1.5"><Label>Wilayah</Label>
                <Input value={form.wilayah} onChange={e => setForm(f => ({...f, wilayah: e.target.value}))} placeholder="Jakarta Selatan" />
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Status Aktif</p>
                  <p className="text-xs text-muted-foreground">Penerima dapat menerima MBG</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_aktif}
                  onClick={() => setForm(f => ({ ...f, is_aktif: !f.is_aktif }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${form.is_aktif ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${form.is_aktif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nama || !form.sekolah}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Penerima</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus data penerima <span className="font-semibold text-foreground">{(data ?? []).find(p => p.id === delId)?.nama}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)} disabled={del.isPending}>
              {del.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
