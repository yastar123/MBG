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
import { ChefHat, Plus, Pencil, Trash2, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Dapur = {
  id: number; nama: string; lokasi: string; alamat: string | null;
  kapasitas_porsi: number; kepala_dapur_id: number | null;
  kepala_dapur_nama: string | null; status: string;
};

async function fetchDapur(): Promise<Dapur[]> {
  const r = await fetch("/api/dapur");
  if (!r.ok) throw new Error("Gagal memuat data dapur");
  return r.json();
}

const emptyForm = { nama: "", lokasi: "", alamat: "", kapasitas_porsi: "", status: "aktif" };

export default function DapurPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["/api/dapur"], queryFn: fetchDapur });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dapur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/dapur/${editing.id}` : "/api/dapur";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error("Gagal menyimpan");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dapur"] });
      toast({ title: editing ? "Dapur diperbarui" : "Dapur ditambahkan" });
      setOpen(false);
    },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/dapur/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dapur"] });
      toast({ title: "Dapur dihapus" });
      setDelId(null);
    },
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: Dapur) {
    setEditing(d);
    setForm({ nama: d.nama, lokasi: d.lokasi, alamat: d.alamat ?? "", kapasitas_porsi: String(d.kapasitas_porsi), status: d.status });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Dapur</h1>
          <p className="text-muted-foreground text-sm">Kelola semua unit dapur MBG</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Dapur</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((d) => (
            <Card key={d.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-md text-primary"><ChefHat size={18} /></div>
                    <CardTitle className="text-base">{d.nama}</CardTitle>
                  </div>
                  <Badge variant={d.status === "aktif" ? "default" : "secondary"} className="text-xs">
                    {d.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={14} />
                  <span>{d.lokasi}</span>
                </div>
                {d.kepala_dapur_nama && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} />
                    <span>{d.kepala_dapur_nama}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-medium text-primary">{d.kapasitas_porsi.toLocaleString("id-ID")} porsi/hari</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil size={14} /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDelId(d.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Dapur" : "Tambah Dapur"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama Dapur</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Lokasi / Wilayah</Label><Input value={form.lokasi} onChange={e => setForm(f => ({...f, lokasi: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Alamat Lengkap</Label><Input value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kapasitas (porsi/hari)</Label><Input type="number" value={form.kapasitas_porsi} onChange={e => setForm(f => ({...f, kapasitas_porsi: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="nonaktif">Nonaktif</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Dapur</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin ingin menghapus dapur ini? Tindakan tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)} disabled={del.isPending}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
