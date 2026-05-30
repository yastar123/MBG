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
import { CalendarCheck, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Absensi = { id: number; dapur_id: number; user_id: number; tanggal: string; status: string; keterangan: string | null; dapur_nama: string | null; user_nama: string | null };
type Dapur = { id: number; nama: string };
type User = { id: number; nama: string; role: string; dapur_id: number | null };

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hadir: { label: "Hadir", icon: CheckCircle, color: "text-primary" },
  tidak_hadir: { label: "Tidak Hadir", icon: XCircle, color: "text-destructive" },
  izin: { label: "Izin", icon: Clock, color: "text-amber-500" },
  sakit: { label: "Sakit", icon: Clock, color: "text-blue-500" },
};

const emptyForm = { dapur_id: "", user_id: "", tanggal: new Date().toISOString().slice(0, 10), status: "hadir", keterangan: "" };

export default function AbsensiPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/absensi"] }); toast({ title: "Absensi dicatat" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const todayData = (data ?? []).filter(a => a.tanggal === today);
  const countHadir = todayData.filter(a => a.status === "hadir").length;
  const countTidakHadir = todayData.filter(a => a.status === "tidak_hadir").length;
  const countIzin = todayData.filter(a => ["izin", "sakit"].includes(a.status)).length;

  const staffList = userList?.filter(u => ["staff_dapur", "kepala_dapur", "admin_dapur"].includes(u.role)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
          <p className="text-muted-foreground text-sm">Monitor kehadiran staff dapur harian</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }} className="gap-2"><Plus size={16} /> Catat Absensi</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><CheckCircle size={20} /></div>
              <div><p className="text-sm text-muted-foreground">Hadir Hari Ini</p><p className="text-2xl font-bold text-primary">{countHadir}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Clock size={20} /></div>
              <div><p className="text-sm text-muted-foreground">Izin / Sakit</p><p className="text-2xl font-bold text-amber-600">{countIzin}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg text-red-600"><XCircle size={20} /></div>
              <div><p className="text-sm text-muted-foreground">Tidak Hadir</p><p className="text-2xl font-bold text-destructive">{countTidakHadir}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck size={18} className="text-primary" /> Riwayat Absensi</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Staff</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Keterangan</th>
              </tr></thead>
              <tbody>
                {(data ?? []).slice(0, 50).map(a => {
                  const cfg = statusConfig[a.status];
                  const Icon = cfg?.icon ?? CheckCircle;
                  return (
                    <tr key={a.id} className="border-b hover:bg-muted/30">
                      <td className="py-2">{a.tanggal}</td>
                      <td className="py-2 font-medium">{a.user_nama}</td>
                      <td className="py-2 text-muted-foreground">{a.dapur_nama}</td>
                      <td className="py-2 text-center">
                        <div className={`flex items-center justify-center gap-1 ${cfg?.color ?? ""}`}>
                          <Icon size={14} />
                          <span className="text-xs">{cfg?.label ?? a.status}</span>
                        </div>
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">{a.keterangan ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Absensi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Dapur</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih dapur" /></SelectTrigger>
                <SelectContent>{(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Staff</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({...f, user_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Pilih staff" /></SelectTrigger>
                <SelectContent>{staffList.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Keterangan</Label><Input value={form.keterangan} onChange={e => setForm(f => ({...f, keterangan: e.target.value}))} /></div>
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
