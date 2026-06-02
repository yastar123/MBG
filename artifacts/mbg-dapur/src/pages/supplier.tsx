import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Pencil, Trash2, Phone, Mail, Star, Search, CheckCircle2, MinusCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Supplier = {
  id: number; nama: string; kontak: string; email: string | null;
  alamat: string | null; kategori_bahan: string | null; rating: number | null; status: string;
};

const emptyForm = { nama: "", kontak: "", email: "", alamat: "", kategori_bahan: "", rating: "", status: "aktif" };

function StarRating({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(num === i ? "" : String(i))}
          className="p-0.5 rounded transition-colors hover:scale-110 active:scale-95"
        >
          <Star
            size={22}
            className={i <= num ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {value && (
        <span className="text-xs text-amber-600 font-semibold ml-1">{parseFloat(value).toFixed(1)}</span>
      )}
    </div>
  );
}

export default function SupplierPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<Supplier[]>({ queryKey: ["/api/supplier"], queryFn: async () => (await fetch("/api/supplier")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/supplier/${editing.id}` : "/api/supplier";
      const method = editing ? "PATCH" : "POST";
      const payload = { ...form, rating: form.rating ? parseFloat(form.rating) : null };
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/supplier"] });
      toast({ title: editing ? "Supplier diperbarui" : "Supplier ditambahkan" });
      setOpen(false);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/supplier/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/supplier"] }); toast({ title: "Supplier dihapus" }); setDelId(null); },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ nama: s.nama, kontak: s.kontak, email: s.email ?? "", alamat: s.alamat ?? "", kategori_bahan: s.kategori_bahan ?? "", rating: s.rating?.toString() ?? "", status: s.status });
    setOpen(true);
  }

  const aktifCount = (data ?? []).filter(s => s.status === "aktif").length;
  const filtered = (data ?? []).filter(s =>
    !search ||
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    (s.kategori_bahan ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Supplier</h1>
          <p className="page-subheading">Kelola mitra pemasok bahan baku</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus size={16} /> Tambah Supplier</Button>
      </div>

      {!isLoading && data && data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 animate-slide-up">
          {[
            { label: "Total Supplier", value: data.length, icon: Building2, iconBg: "bg-primary/10 text-primary", valueClass: "text-foreground", delay: "0s" },
            { label: "Aktif", value: aktifCount, icon: CheckCircle2, iconBg: "bg-emerald-100 text-emerald-600", valueClass: "text-emerald-700", delay: "0.05s" },
            { label: "Nonaktif", value: data.length - aktifCount, icon: MinusCircle, iconBg: "bg-muted text-muted-foreground", valueClass: "text-muted-foreground", delay: "0.1s" },
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

      <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Cari supplier atau kategori..."
              className="pl-9 h-9 text-sm pr-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          <span className="text-sm text-muted-foreground shrink-0">{filtered.length} supplier</span>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Building2 size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {search ? "Supplier tidak ditemukan" : "Belum ada supplier"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Coba kata kunci lain" : "Mulai dengan menambahkan supplier pertama"}
            </p>
            {!search && <Button onClick={openAdd} size="sm" className="gap-2"><Plus size={14} />Tambah Supplier</Button>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, idx) => (
              <Card
                key={s.id}
                className="shadow-sm card-hover animate-slide-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{s.nama}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.kategori_bahan ?? "Umum"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {s.rating !== null && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Star size={11} className="text-amber-500" fill="currentColor" />
                          <span className="text-xs font-semibold text-amber-700">{s.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <Badge variant={s.status === "aktif" ? "default" : "secondary"} className="text-xs">{s.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="shrink-0" />
                      <span className="text-xs">{s.kontak}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="shrink-0" />
                        <a href={`mailto:${s.email}`} className="text-xs truncate hover:text-primary transition-colors">{s.email}</a>
                      </div>
                    )}
                    {s.alamat && (
                      <p className="text-xs leading-relaxed line-clamp-2">{s.alamat}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(s)}><Pencil size={13} /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(s.id)}><Trash2 size={13} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Tambah Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nama Supplier</Label>
              <Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} placeholder="PT. Maju Bersama" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>No. Kontak</Label>
                <Input value={form.kontak} onChange={e => setForm(f => ({...f, kontak: e.target.value}))} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="space-y-1.5"><Label>Email <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@supplier.com" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Alamat <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={form.alamat}
                onChange={e => setForm(f => ({...f, alamat: e.target.value}))}
                placeholder="Jl. Contoh No. 1, Kota..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Kategori Bahan</Label>
                <Input value={form.kategori_bahan} onChange={e => setForm(f => ({...f, kategori_bahan: e.target.value}))} placeholder="Protein, Sayuran..." />
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rating <span className="text-muted-foreground text-xs">(opsional, klik bintang)</span></Label>
              <StarRating value={form.rating} onChange={v => setForm(f => ({...f, rating: v}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nama || !form.kontak}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Supplier</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus supplier <span className="font-semibold text-foreground">{(data ?? []).find(s => s.id === delId)?.nama}</span>?
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
