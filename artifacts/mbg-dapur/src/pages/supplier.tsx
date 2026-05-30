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
import { Building2, Plus, Pencil, Trash2, Phone, Mail, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Supplier = {
  id: number; nama: string; kontak: string; email: string | null;
  alamat: string | null; kategori_bahan: string | null; rating: number | null; status: string;
};
const emptyForm = { nama: "", kontak: "", email: "", alamat: "", kategori_bahan: "", status: "aktif" };

export default function SupplierPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Supplier[]>({ queryKey: ["/api/supplier"], queryFn: async () => (await fetch("/api/supplier")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/supplier/${editing.id}` : "/api/supplier";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/supplier"] }); toast({ title: editing ? "Supplier diperbarui" : "Supplier ditambahkan" }); setOpen(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/supplier/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/supplier"] }); toast({ title: "Supplier dihapus" }); setDelId(null); },
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ nama: s.nama, kontak: s.kontak, email: s.email ?? "", alamat: s.alamat ?? "", kategori_bahan: s.kategori_bahan ?? "", status: s.status });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier</h1>
          <p className="text-muted-foreground text-sm">Kelola mitra pemasok bahan baku</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Supplier</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map(s => (
            <Card key={s.id} className="shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-md text-primary"><Building2 size={18} /></div>
                    <div>
                      <p className="font-semibold">{s.nama}</p>
                      <p className="text-xs text-muted-foreground">{s.kategori_bahan ?? "Umum"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.rating && (
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <Star size={12} fill="currentColor" />{s.rating.toFixed(1)}
                      </div>
                    )}
                    <Badge variant={s.status === "aktif" ? "default" : "secondary"} className="text-xs">{s.status}</Badge>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone size={12} />{s.kontak}</div>
                  {s.email && <div className="flex items-center gap-2"><Mail size={12} />{s.email}</div>}
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDelId(s.id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Tambah Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>No. Kontak</Label><Input value={form.kontak} onChange={e => setForm(f => ({...f, kontak: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Alamat</Label><Input value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kategori Bahan</Label><Input value={form.kategori_bahan} onChange={e => setForm(f => ({...f, kategori_bahan: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="nonaktif">Nonaktif</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Supplier</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin ingin menghapus supplier ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
