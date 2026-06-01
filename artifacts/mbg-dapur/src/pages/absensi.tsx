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
import { CalendarCheck, Plus, CheckCircle, XCircle, Clock, Search, Users, Pencil, Trash2, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

type Absensi = { id: number; dapur_id: number; user_id: number; tanggal: string; status: string; keterangan: string | null; dapur_nama: string | null; user_nama: string | null };
type Dapur = { id: number; nama: string };
type User = { id: number; nama: string; role: string; dapur_id: number | null };

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  hadir:       { label: "Hadir",       icon: CheckCircle, color: "text-primary",     bg: "bg-primary/10" },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle,     color: "text-destructive", bg: "bg-destructive/10" },
  izin:        { label: "Izin",        icon: Clock,       color: "text-amber-600",   bg: "bg-amber-100" },
  sakit:       { label: "Sakit",       icon: Clock,       color: "text-blue-600",    bg: "bg-blue-100" },
};

const getEmptyForm = () => ({ dapur_id: "", user_id: "", tanggal: new Date().toISOString().slice(0, 10), status: "hadir", keterangan: "" });

export default function AbsensiPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState(today);
  const [showAllDates, setShowAllDates] = useState(false);

  const { data, isLoading } = useQuery<Absensi[]>({ queryKey: ["/api/absensi"], queryFn: async () => (await fetch("/api/absensi")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const { data: userList } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Absensi | null>(null);
  const [form, setForm] = useState(getEmptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/absensi/${editing.id}` : "/api/absensi";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/absensi"] });
      toast({ title: editing ? "Absensi diperbarui" : "Absensi dicatat" });
      setOpen(false);
      setEditing(null);
      setForm(getEmptyForm());
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/absensi/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/absensi"] });
      toast({ title: "Absensi dihapus" });
      setDelId(null);
    },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(getEmptyForm()); setOpen(true); }
  function openEdit(a: Absensi) {
    setEditing(a);
    setForm({ dapur_id: String(a.dapur_id), user_id: String(a.user_id), tanggal: a.tanggal, status: a.status, keterangan: a.keterangan ?? "" });
    setOpen(true);
  }

  const todayData = (data ?? []).filter(a => a.tanggal === today);
  const countHadir = todayData.filter(a => a.status === "hadir").length;
  const countTidakHadir = todayData.filter(a => a.status === "tidak_hadir").length;
  const countIzin = todayData.filter(a => ["izin", "sakit"].includes(a.status)).length;
  const staffList = userList?.filter(u => ["staff_dapur", "kepala_dapur", "admin_dapur"].includes(u.role)) ?? [];

  const filtered = (data ?? []).filter(a => {
    const matchSearch = !search || a.user_nama?.toLowerCase().includes(search.toLowerCase()) || a.dapur_nama?.toLowerCase().includes(search.toLowerCase());
    const matchDate = showAllDates || a.tanggal === filterTanggal;
    return matchSearch && matchDate;
  });

  const filterLabel = showAllDates ? "Semua tanggal" : filterTanggal === today ? "Hari ini" : filterTanggal;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Absensi</h1>
          <p className="page-subheading">Monitor dan kelola kehadiran staff dapur</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <Plus size={16} /> Catat Absensi
        </Button>
      </div>

      {/* Today's stats */}
      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up">
        {[
          { label: "Hadir Hari Ini",  value: countHadir,       icon: CheckCircle, iconBg: "bg-primary/10 text-primary",      valueColor: "text-primary" },
          { label: "Izin / Sakit",    value: countIzin,        icon: Clock,       iconBg: "bg-amber-100 text-amber-600",     valueColor: "text-amber-600" },
          { label: "Tidak Hadir",     value: countTidakHadir,  icon: XCircle,     iconBg: "bg-red-100 text-red-600",         valueColor: "text-destructive" },
        ].map((stat, i) => (
          <Card key={stat.label} className="shadow-sm animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`stat-card-icon w-11 h-11 ${stat.iconBg}`}><stat.icon size={19} /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance history */}
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck size={16} className="text-primary" />
                Riwayat Absensi
                <Badge variant="secondary" className="text-xs ml-1">{filtered.length}</Badge>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Date filter */}
                <div className="flex items-center gap-1.5">
                  <Filter size={12} className="text-muted-foreground" />
                  {showAllDates ? (
                    <button
                      onClick={() => setShowAllDates(false)}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      {filterLabel}<X size={11} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        value={filterTanggal}
                        onChange={e => setFilterTanggal(e.target.value)}
                        className="h-8 text-xs w-36 px-2"
                      />
                      <button
                        onClick={() => setShowAllDates(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-muted"
                      >
                        Semua
                      </button>
                    </div>
                  )}
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                  <Input
                    placeholder="Cari staff atau dapur..."
                    className="pl-8 h-8 text-xs w-40 sm:w-48"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(data ?? []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={22} className="text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Belum ada data absensi</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Mulai catat kehadiran staff</p>
                </div>
                <Button size="sm" className="gap-1.5 mt-1" onClick={openAdd}><Plus size={13} />Catat Absensi</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state py-10">
                <p className="text-sm font-medium text-foreground/70">Tidak ada data untuk filter ini</p>
                <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={() => { setSearch(""); setShowAllDates(false); setFilterTanggal(today); }}>Reset filter</Button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Staff</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Dapur</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Keterangan</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map(a => {
                      const cfg = statusConfig[a.status];
                      const Icon = cfg?.icon ?? CheckCircle;
                      return (
                        <tr key={a.id} className={`border-b hover:bg-muted/30 transition-colors ${a.tanggal === today ? 'bg-primary/[0.02]' : ''}`}>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{a.tanggal}</td>
                          <td className="py-3 px-4 font-medium">{a.user_nama}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{a.dapur_nama}</td>
                          <td className="py-3 px-4 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? "bg-muted"} ${cfg?.color ?? "text-muted-foreground"}`}>
                              <Icon size={12} />
                              {cfg?.label ?? a.status}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{a.keterangan ?? "—"}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(a)} title="Edit">
                                <Pencil size={13} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(a.id)} title="Hapus">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length > 50 && (
                  <div className="px-4 py-3 text-xs text-center text-muted-foreground border-t bg-muted/10">
                    Menampilkan 50 dari {filtered.length} data
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Catat / Edit Absensi */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm(getEmptyForm()); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Absensi" : "Catat Absensi"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Dapur</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({...f, user_id: v}))} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Pilih staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">Belum ada staff terdaftar</div>
                  ) : (
                    staffList.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} disabled={!!editing} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([v, c]) => (
                      <SelectItem key={v} value={v}>
                        <span className="flex items-center gap-2"><c.icon size={13} className={c.color} />{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={form.keterangan}
                onChange={e => setForm(f => ({...f, keterangan: e.target.value}))}
                placeholder="Sakit, izin acara keluarga, dll..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.user_id || !form.dapur_id}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Hapus */}
      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Hapus Absensi</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus catatan absensi{" "}
            {(() => {
              const a = (data ?? []).find(x => x.id === delId);
              return a ? <><span className="font-semibold text-foreground">{a.user_nama}</span> pada {a.tanggal}</> : null;
            })()}?
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
