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
import { UserCircle, Plus, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type User = { id: number; nama: string; email: string; role: string; dapur_id: number | null; no_hp: string | null; is_active: boolean };
type Dapur = { id: number; nama: string };

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", admin_yayasan: "Admin Yayasan", admin_dapur: "Admin Dapur",
  admin_gudang: "Admin Gudang", kepala_dapur: "Kepala Dapur", staff_dapur: "Staff Dapur",
  staff_gudang: "Staff Gudang", driver: "Driver", verifikator: "Verifikator", supplier: "Supplier",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700", admin_yayasan: "bg-purple-100 text-purple-700",
  admin_dapur: "bg-blue-100 text-blue-700", kepala_dapur: "bg-green-100 text-green-700",
  staff_dapur: "bg-teal-100 text-teal-700", admin_gudang: "bg-amber-100 text-amber-700",
  staff_gudang: "bg-orange-100 text-orange-700", driver: "bg-pink-100 text-pink-700",
  verifikator: "bg-indigo-100 text-indigo-700", supplier: "bg-gray-100 text-gray-700",
};

const emptyForm = { nama: "", email: "", password_hash: "", role: "staff_dapur", dapur_id: "", no_hp: "" };

export default function PenggunaPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { ...form };
      if (form.dapur_id) payload.dapur_id = parseInt(form.dapur_id); else payload.dapur_id = null;
      if (!editing) payload.password_hash = form.password_hash;
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: editing ? "Pengguna diperbarui" : "Pengguna ditambahkan" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(u: User) {
    setEditing(u);
    setForm({ nama: u.nama, email: u.email, password_hash: "", role: u.role, dapur_id: u.dapur_id?.toString() ?? "", no_hp: u.no_hp ?? "" });
    setOpen(true);
  }

  const filtered = (data ?? []).filter(u =>
    u.nama.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengguna</h1>
          <p className="text-muted-foreground text-sm">Kelola akun dan hak akses pengguna sistem</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Pengguna</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(roleLabel).map(([role, label]) => {
          const count = (data ?? []).filter(u => u.role === role).length;
          return (
            <Card key={role} className="shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Cari nama, email, role..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Nama</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Dapur</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {u.nama.charAt(0)}
                        </div>
                        <span className="font-medium">{u.nama}</span>
                      </div>
                    </td>
                    <td className="py-2 text-muted-foreground">{u.email}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {roleLabel[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{dapurList?.find(d => d.id === u.dapur_id)?.nama ?? "-"}</td>
                    <td className="py-2 text-center">
                      <Badge variant={u.is_active ? "default" : "secondary"} className="text-xs">{u.is_active ? "Aktif" : "Nonaktif"}</Badge>
                    </td>
                    <td className="py-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            {!editing && <div className="space-y-1"><Label>Password</Label><Input type="password" value={form.password_hash} onChange={e => setForm(f => ({...f, password_hash: e.target.value}))} /></div>}
            <div className="space-y-1"><Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roleLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Dapur (opsional)</Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Tidak terkait dapur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak terkait dapur</SelectItem>
                  {(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>No. HP</Label><Input value={form.no_hp} onChange={e => setForm(f => ({...f, no_hp: e.target.value}))} /></div>
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
