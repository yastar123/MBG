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
import { UtensilsCrossed, Plus, Pencil, Trash2, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Menu = { id: number; nama: string; deskripsi: string | null; tanggal: string; kategori: string; target_porsi: number; kalori: number | null };

const kategoriLabel: Record<string, string> = { makan_pagi: "Makan Pagi", makan_siang: "Makan Siang", snack: "Snack" };
const emptyForm = { nama: "", deskripsi: "", tanggal: new Date().toISOString().slice(0, 10), kategori: "makan_siang", target_porsi: "", kalori: "" };

export default function MenuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Menu[]>({ queryKey: ["/api/menu"], queryFn: async () => (await fetch("/api/menu")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/menu/${editing.id}` : "/api/menu";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error("Gagal menyimpan menu");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/menu"] }); toast({ title: editing ? "Menu diperbarui" : "Menu ditambahkan" }); setOpen(false); },
    onError: (e: Error) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/menu/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/menu"] }); toast({ title: "Menu dihapus" }); setDelId(null); },
  });

  function openAdd() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(m: Menu) {
    setEditing(m);
    setForm({ nama: m.nama, deskripsi: m.deskripsi ?? "", tanggal: m.tanggal, kategori: m.kategori, target_porsi: String(m.target_porsi), kalori: m.kalori?.toString() ?? "" });
    setOpen(true);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayMenu = (data ?? []).filter(m => m.tanggal === today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="text-muted-foreground text-sm">Rencanakan dan kelola menu harian</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Tambah Menu</Button>
      </div>

      {todayMenu.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Menu Hari Ini</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todayMenu.map(m => (
              <Card key={m.id} className="shadow-sm border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-md text-primary"><UtensilsCrossed size={16} /></div>
                      <span className="font-semibold text-sm">{m.nama}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{kategoriLabel[m.kategori] ?? m.kategori}</Badge>
                  </div>
                  {m.deskripsi && <p className="text-xs text-muted-foreground mb-2">{m.deskripsi}</p>}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.target_porsi.toLocaleString("id-ID")} porsi</span>
                    {m.kalori && <div className="flex items-center gap-1 text-amber-600"><Flame size={12} />{m.kalori} kal</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Semua Menu</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Nama Menu</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Kategori</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Target Porsi</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Kalori</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
              </tr></thead>
              <tbody>
                {(data ?? []).map(m => (
                  <tr key={m.id} className="border-b hover:bg-muted/30">
                    <td className="py-2">{m.tanggal}</td>
                    <td className="py-2 font-medium">{m.nama}</td>
                    <td className="py-2"><Badge variant="secondary" className="text-xs">{kategoriLabel[m.kategori] ?? m.kategori}</Badge></td>
                    <td className="py-2 text-right">{m.target_porsi.toLocaleString("id-ID")}</td>
                    <td className="py-2 text-right text-muted-foreground">{m.kalori ?? "-"}</td>
                    <td className="py-2 text-center flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil size={14} /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDelId(m.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Menu" : "Tambah Menu"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama Menu</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Deskripsi</Label><Input value={form.deskripsi} onChange={e => setForm(f => ({...f, deskripsi: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={v => setForm(f => ({...f, kategori: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(kategoriLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Target Porsi</Label><Input type="number" value={form.target_porsi} onChange={e => setForm(f => ({...f, target_porsi: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Kalori (opsional)</Label><Input type="number" value={form.kalori} onChange={e => setForm(f => ({...f, kalori: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Menu</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin ingin menghapus menu ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
