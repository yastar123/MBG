import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Plus, Pencil, Trash2, MapPin, Users, UtensilsCrossed, CheckCircle2, MinusCircle, Search, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Dapur = {
  id: number; nama: string; lokasi: string; alamat: string | null;
  kapasitas_porsi: number; kepala_dapur_id: number | null;
  kepala_dapur_nama: string | null; status: string;
};
type User = { id: number; nama: string; role: string };

async function fetchDapur(): Promise<Dapur[]> {
  const r = await fetch("/api/dapur");
  if (!r.ok) throw new Error("Gagal memuat data dapur");
  return r.json();
}

const emptyForm = { nama: "", lokasi: "", alamat: "", kapasitas_porsi: "", kepala_dapur_id: "", status: "aktif" };

export default function DapurPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["/api/dapur"], queryFn: fetchDapur });
  const { data: userList } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dapur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const kepalaOptions = (userList ?? []).filter(u => ["kepala_dapur", "admin_dapur"].includes(u.role));

  const filtered = useMemo(() => {
    if (!search.trim()) return data ?? [];
    const q = search.toLowerCase();
    return (data ?? []).filter(d =>
      d.nama.toLowerCase().includes(q) ||
      d.lokasi.toLowerCase().includes(q) ||
      (d.alamat ?? "").toLowerCase().includes(q) ||
      (d.kepala_dapur_nama ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/dapur/${editing.id}` : "/api/dapur";
      const method = editing ? "PATCH" : "POST";
      const payload = {
        ...form,
        kepala_dapur_id: form.kepala_dapur_id ? parseInt(form.kepala_dapur_id) : null,
        kapasitas_porsi: form.kapasitas_porsi ? parseInt(form.kapasitas_porsi) : undefined,
      };
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error("Gagal menyimpan");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dapur"] });
      toast({ title: editing ? "Dapur diperbarui" : "Dapur berhasil ditambahkan" });
      setOpen(false);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/dapur/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dapur"] });
      toast({ title: "Dapur dihapus" });
      setDelId(null);
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: Dapur) {
    setEditing(d);
    setForm({ nama: d.nama, lokasi: d.lokasi, alamat: d.alamat ?? "", kapasitas_porsi: String(d.kapasitas_porsi), kepala_dapur_id: d.kepala_dapur_id?.toString() ?? "", status: d.status });
    setOpen(true);
  }

  const aktifCount = (data ?? []).filter(d => d.status === "aktif").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Manajemen Dapur</h1>
          <p className="page-subheading">Kelola semua unit dapur MBG</p>
        </div>
        <div className="flex items-center gap-2">
          {(data ?? []).length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Cari dapur..."
                className="pl-9 h-9 text-sm pr-8 w-44 sm:w-52"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
          )}
          <Button onClick={openAdd} className="gap-2 shrink-0">
            <Plus size={16} /> Tambah Dapur
          </Button>
        </div>
      </div>

      {!isLoading && data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 animate-slide-up">
          {[
            { label: "Total Dapur",  value: data.length,           icon: ChefHat,     iconBg: "bg-primary/10 text-primary",          valueClass: "text-foreground",       delay: "0s" },
            { label: "Aktif",        value: aktifCount,             icon: CheckCircle2, iconBg: "bg-emerald-100 text-emerald-600",     valueClass: "text-emerald-700",      delay: "0.05s" },
            { label: "Nonaktif",     value: data.length - aktifCount, icon: MinusCircle, iconBg: "bg-muted text-muted-foreground",    valueClass: "text-muted-foreground", delay: "0.1s" },
          ].map(stat => (
            <Card key={stat.label} className="shadow-sm animate-slide-up" style={{ animationDelay: stat.delay }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`stat-card-icon w-10 h-10 ${stat.iconBg}`}>
                    <stat.icon size={17} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold tabular-nums ${stat.valueClass}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <ChefHat size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Belum ada dapur</h3>
          <p className="text-sm text-muted-foreground mb-4">Mulai dengan menambahkan unit dapur pertama</p>
          <Button onClick={openAdd} size="sm" className="gap-2"><Plus size={14} />Tambah Dapur</Button>
        </div>
      ) : filtered.length === 0 && search ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-3">
            <Search size={22} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mb-3">Tidak ada dapur yang cocok dengan "<span className="font-medium">{search}</span>"</p>
          <Button variant="outline" size="sm" onClick={() => setSearch("")} className="gap-1.5"><X size={13} /> Hapus pencarian</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, idx) => (
            <Card
              key={d.id}
              className="shadow-sm card-hover animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <ChefHat size={16} />
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight">{d.nama}</CardTitle>
                  </div>
                  <Badge
                    variant={d.status === "aktif" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {d.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm pt-0">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{d.lokasi}</span>
                </div>
                {d.kepala_dapur_nama && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={13} className="shrink-0" />
                    <span className="truncate">{d.kepala_dapur_nama}</span>
                  </div>
                )}
                {d.alamat && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin size={13} className="shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{d.alamat}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t mt-3">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed size={13} className="text-primary" />
                    <span className="font-semibold text-primary text-sm">{d.kapasitas_porsi.toLocaleString("id-ID")}</span>
                    <span className="text-xs text-muted-foreground">porsi/hari</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(d)}>
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(d.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Dapur" : "Tambah Dapur Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Dapur</Label>
              <Input
                value={form.nama}
                onChange={e => setForm(f => ({...f, nama: e.target.value}))}
                placeholder="Dapur Ciputat Timur"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi / Wilayah</Label>
              <Input
                value={form.lokasi}
                onChange={e => setForm(f => ({...f, lokasi: e.target.value}))}
                placeholder="Tangerang Selatan"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alamat Lengkap <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={form.alamat}
                onChange={e => setForm(f => ({...f, alamat: e.target.value}))}
                placeholder="Jl. Contoh No. 1, Kel. Contoh, Kota..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kapasitas (porsi/hari)</Label>
              <Input
                type="number"
                value={form.kapasitas_porsi}
                onChange={e => setForm(f => ({...f, kapasitas_porsi: e.target.value}))}
                placeholder="500"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kepala Dapur <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Select value={form.kepala_dapur_id || "none"} onValueChange={v => setForm(f => ({...f, kepala_dapur_id: v === "none" ? "" : v}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Belum ditentukan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {kepalaOptions.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>
                  ))}
                  {kepalaOptions.length === 0 && (
                    <div className="py-3 text-center text-xs text-muted-foreground">
                      Belum ada pengguna dengan role Kepala Dapur
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nama || !form.lokasi}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Dapur</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus dapur <span className="font-semibold text-foreground">{(data ?? []).find(d => d.id === delId)?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
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
