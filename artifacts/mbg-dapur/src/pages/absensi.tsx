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
import { CalendarCheck, Plus, CheckCircle, XCircle, Clock, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Absensi = { id: number; dapur_id: number; user_id: number; tanggal: string; status: string; keterangan: string | null; dapur_nama: string | null; user_nama: string | null };
type Dapur = { id: number; nama: string };
type User = { id: number; nama: string; role: string; dapur_id: number | null };

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  hadir:        { label: "Hadir",        icon: CheckCircle, color: "text-primary",     bg: "bg-primary/10" },
  tidak_hadir:  { label: "Tidak Hadir",  icon: XCircle,     color: "text-destructive", bg: "bg-destructive/10" },
  izin:         { label: "Izin",         icon: Clock,       color: "text-amber-600",   bg: "bg-amber-100" },
  sakit:        { label: "Sakit",        icon: Clock,       color: "text-blue-600",    bg: "bg-blue-100" },
};

const emptyForm = { dapur_id: "", user_id: "", tanggal: new Date().toISOString().slice(0, 10), status: "hadir", keterangan: "" };

export default function AbsensiPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<Absensi[]>({ queryKey: ["/api/absensi"], queryFn: async () => (await fetch("/api/absensi")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const { data: userList } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/absensi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/absensi"] }); toast({ title: "Absensi berhasil dicatat" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const todayData = (data ?? []).filter(a => a.tanggal === today);
  const countHadir = todayData.filter(a => a.status === "hadir").length;
  const countTidakHadir = todayData.filter(a => a.status === "tidak_hadir").length;
  const countIzin = todayData.filter(a => ["izin", "sakit"].includes(a.status)).length;
  const staffList = userList?.filter(u => ["staff_dapur", "kepala_dapur", "admin_dapur"].includes(u.role)) ?? [];

  const filtered = (data ?? []).filter(a =>
    !search ||
    a.user_nama?.toLowerCase().includes(search.toLowerCase()) ||
    a.dapur_nama?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Absensi</h1>
          <p className="page-subheading">Monitor kehadiran staff dapur harian</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }} className="gap-2 shrink-0">
          <Plus size={16} /> Catat Absensi
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up">
        {[
          { label: "Hadir Hari Ini", value: countHadir, icon: CheckCircle, iconBg: "bg-primary/10 text-primary", valueColor: "text-primary" },
          { label: "Izin / Sakit", value: countIzin, icon: Clock, iconBg: "bg-amber-100 text-amber-600", valueColor: "text-amber-600" },
          { label: "Tidak Hadir", value: countTidakHadir, icon: XCircle, iconBg: "bg-red-100 text-red-600", valueColor: "text-destructive" },
        ].map((stat, i) => (
          <Card key={stat.label} className="shadow-sm animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
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
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Cari staff atau dapur..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Users size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {search ? "Data tidak ditemukan" : "Belum ada data absensi"}
                </p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map(a => {
                      const cfg = statusConfig[a.status];
                      const Icon = cfg?.icon ?? CheckCircle;
                      return (
                        <tr key={a.id} className={`border-b hover:bg-muted/30 transition-colors ${a.tanggal === today ? 'bg-primary/3' : ''}`}>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{a.tanggal}</td>
                          <td className="py-3 px-4 font-medium">{a.user_nama}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{a.dapur_nama}</td>
                          <td className="py-3 px-4 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? "bg-muted"} ${cfg?.color ?? "text-muted-foreground"}`}>
                              <Icon size={12} />
                              {cfg?.label ?? a.status}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{a.keterangan ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Catat Absensi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Dapur</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Staff</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({...f, user_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih staff" /></SelectTrigger>
                <SelectContent>{staffList.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label>
                <Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} />
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Input value={form.keterangan} onChange={e => setForm(f => ({...f, keterangan: e.target.value}))} placeholder="Tambahkan keterangan..." />
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
    </div>
  );
}
