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
import { UserCircle, Plus, Pencil, Search, Users, ShieldCheck, ToggleLeft, ToggleRight, Trash2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type User = { id: number; nama: string; email: string; role: string; dapur_id: number | null; no_hp: string | null; is_active: boolean };
type Dapur = { id: number; nama: string };

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", admin_yayasan: "Admin Yayasan", admin_dapur: "Admin Dapur",
  admin_gudang: "Admin Gudang", kepala_dapur: "Kepala Dapur", staff_dapur: "Staff Dapur",
  staff_gudang: "Staff Gudang", driver: "Driver", verifikator: "Verifikator", supplier: "Supplier",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  admin_yayasan: "bg-purple-100 text-purple-700",
  admin_dapur: "bg-blue-100 text-blue-700",
  kepala_dapur: "bg-green-100 text-green-700",
  staff_dapur: "bg-teal-100 text-teal-700",
  admin_gudang: "bg-amber-100 text-amber-700",
  staff_gudang: "bg-orange-100 text-orange-700",
  driver: "bg-pink-100 text-pink-700",
  verifikator: "bg-indigo-100 text-indigo-700",
  supplier: "bg-gray-100 text-gray-700",
};

const emptyForm = { nama: "", email: "", password: "", role: "staff_dapur", dapur_id: "", no_hp: "" };

export default function PenggunaPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<User[]>({ queryKey: ["/api/users"], queryFn: async () => (await fetch("/api/users")).json() });
  const { data: dapurList } = useQuery<Dapur[]>({ queryKey: ["/api/dapur"], queryFn: async () => (await fetch("/api/dapur")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const toggleActive = useMutation({
    mutationFn: async (u: User) => {
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: (_data, u) => {
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: u.is_active ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan" });
    },
    onError: () => toast({ title: "Gagal mengubah status", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "Pengguna dihapus" }); setDelId(null); },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { nama: form.nama, email: form.email, role: form.role, no_hp: form.no_hp || null };
      if (form.dapur_id) payload.dapur_id = parseInt(form.dapur_id);
      else payload.dapur_id = null;
      if (!editing || (showChangePassword && form.password)) payload.password = form.password;
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: editing ? "Pengguna diperbarui" : "Pengguna ditambahkan" });
      setOpen(false);
      setShowChangePassword(false);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setShowChangePassword(false); setOpen(true); }
  function openEdit(u: User) {
    setEditing(u);
    setForm({ nama: u.nama, email: u.email, password: "", role: u.role, dapur_id: u.dapur_id?.toString() ?? "", no_hp: u.no_hp ?? "" });
    setShowChangePassword(false);
    setOpen(true);
  }

  const filtered = (data ?? []).filter(u =>
    !search ||
    u.nama.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (roleLabel[u.role] ?? u.role).toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (data ?? []).filter(u => u.is_active).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Pengguna</h1>
          <p className="page-subheading">Kelola akun dan hak akses pengguna sistem</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus size={16} /> Tambah Pengguna</Button>
      </div>

      {!isLoading && data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 animate-slide-up">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Pengguna</p>
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Aktif</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{data.length - activeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nonaktif</p>
          </div>
        </div>
      )}

      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {Object.entries(roleLabel).map(([role, label]) => {
          const count = (data ?? []).filter(u => u.role === role).length;
          return (
            <Card key={role} className="shadow-sm">
              <CardContent className="pt-3.5 pb-3.5 text-center">
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Cari nama, email, role..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{filtered.length} pengguna</span>
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
                {search ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}
              </p>
              {!search && <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus size={14} />Tambah Pengguna</Button>}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden lg:table-cell">Dapur</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{u.nama}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell text-sm">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                          {roleLabel[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs hidden lg:table-cell">
                        {dapurList?.find(d => d.id === u.dapur_id)?.nama ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={u.is_active ? "default" : "secondary"} className="text-xs">
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${u.is_active ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-muted-foreground hover:bg-muted'}`}
                            onClick={() => toggleActive.mutate(u)}
                            disabled={toggleActive.isPending}
                            title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {u.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(u)} title="Edit">
                            <Pencil size={13} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(u.id)} title="Hapus">
                            <Trash2 size={13} />
                          </Button>
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

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Hapus Pengguna</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus pengguna <span className="font-semibold text-foreground">{(data ?? []).find(u => u.id === delId)?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && deleteUser.mutate(delId)} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setShowChangePassword(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              {editing ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} placeholder="Budi Santoso" />
            </div>
            <div className="space-y-1.5"><Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="budi@mbg.id" />
            </div>
            {!editing ? (
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Minimal 6 karakter" />
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setShowChangePassword(v => !v); setForm(f => ({ ...f, password: "" })); }}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <KeyRound size={14} />
                  {showChangePassword ? "Batal ganti password" : "Ganti password"}
                </button>
                {showChangePassword && (
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Password baru (min. 6 karakter)" />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(roleLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>No. HP <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input value={form.no_hp} onChange={e => setForm(f => ({...f, no_hp: e.target.value}))} placeholder="08xxxxxxxxxx" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Dapur <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Select value={form.dapur_id} onValueChange={v => setForm(f => ({...f, dapur_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Tidak terkait dapur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak terkait dapur</SelectItem>
                  {(dapurList ?? []).map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nama || !form.email || (!editing && !form.password) || (!!editing && showChangePassword && !form.password)}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
