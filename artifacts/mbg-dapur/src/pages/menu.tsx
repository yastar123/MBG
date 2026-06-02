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
import { UtensilsCrossed, Plus, Pencil, Trash2, Flame, CalendarDays, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Menu = { id: number; nama: string; deskripsi: string | null; tanggal: string; kategori: string; target_porsi: number; kalori: number | null };

const kategoriLabel: Record<string, string> = { makan_pagi: "Makan Pagi", makan_siang: "Makan Siang", snack: "Snack" };
const kategoriColor: Record<string, string> = {
  makan_pagi: "bg-amber-100 text-amber-700 border-amber-200",
  makan_siang: "bg-blue-100 text-blue-700 border-blue-200",
  snack: "bg-green-100 text-green-700 border-green-200",
};
const getEmptyForm = () => ({ nama: "", deskripsi: "", tanggal: new Date().toISOString().slice(0, 10), kategori: "makan_siang", target_porsi: "", kalori: "" });

export default function MenuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<Menu[]>({ queryKey: ["/api/menu"], queryFn: async () => (await fetch("/api/menu")).json() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [form, setForm] = useState(getEmptyForm);
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
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/menu"] }); toast({ title: "Menu dihapus" }); setDelId(null); },
    onError: () => toast({ title: "Gagal menghapus", variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(getEmptyForm()); setOpen(true); }
  function openEdit(m: Menu) {
    setEditing(m);
    setForm({ nama: m.nama, deskripsi: m.deskripsi ?? "", tanggal: m.tanggal, kategori: m.kategori, target_porsi: String(m.target_porsi), kalori: m.kalori?.toString() ?? "" });
    setOpen(true);
  }

  function formatTanggal(iso: string) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (iso === todayStr) return "Hari ini";
    if (iso === yesterdayStr) return "Kemarin";
    return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayMenu = (data ?? []).filter(m => m.tanggal === today);
  const allMenu = (data ?? []).filter(m =>
    !search || m.nama.toLowerCase().includes(search.toLowerCase()) || m.kategori.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-heading">Menu</h1>
          <p className="page-subheading">Rencanakan dan kelola menu harian</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0"><Plus size={16} /> Tambah Menu</Button>
      </div>

      {todayMenu.length > 0 && (
        <div className="animate-slide-up">
          <p className="section-label mb-3">Menu Hari Ini</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayMenu.map((m, i) => (
              <Card
                key={m.id}
                className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent card-hover animate-slide-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-2.5 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/15 rounded-lg text-primary shrink-0">
                        <UtensilsCrossed size={14} />
                      </div>
                      <span className="font-semibold text-sm leading-tight">{m.nama}</span>
                    </div>
                    <Badge className={`text-xs shrink-0 border ${kategoriColor[m.kategori] ?? ""}`} variant="outline">
                      {kategoriLabel[m.kategori] ?? m.kategori}
                    </Badge>
                  </div>
                  {m.deskripsi && <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{m.deskripsi}</p>}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-primary/10">
                    <span className="text-muted-foreground font-medium">{m.target_porsi.toLocaleString("id-ID")} porsi</span>
                    {m.kalori && (
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <Flame size={11} />{m.kalori} kal
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                Semua Menu
                <Badge variant="secondary" className="text-xs ml-1">{allMenu.length}</Badge>
              </CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Cari menu..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {allMenu.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <UtensilsCrossed size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {search ? "Menu tidak ditemukan" : "Belum ada menu yang ditambahkan"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Nama Menu</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Kategori</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Porsi</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs hidden lg:table-cell">Kalori</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-xs">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMenu.map(m => (
                      <tr key={m.id} className={`border-b hover:bg-muted/30 transition-colors ${m.tanggal === today ? 'bg-primary/[0.03]' : ''}`}>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {m.tanggal === today
                            ? <span className="text-primary font-semibold">Hari ini</span>
                            : <span className="text-muted-foreground">{formatTanggal(m.tanggal)}</span>
                          }
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div>{m.nama}</div>
                          {m.deskripsi && <div className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">{m.deskripsi}</div>}
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${kategoriColor[m.kategori] ?? "bg-muted text-muted-foreground"}`}>
                            {kategoriLabel[m.kategori] ?? m.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">{m.target_porsi.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground hidden lg:table-cell">
                          {m.kalori ? (
                            <span className="flex items-center justify-end gap-1 text-amber-600">
                              <Flame size={11} />{m.kalori}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(m)}><Pencil size={13} /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(m.id)}><Trash2 size={13} /></Button>
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Menu" : "Tambah Menu Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nama Menu</Label><Input value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))} placeholder="Nasi Ayam Kecap" /></div>
            <div className="space-y-1.5">
              <Label>Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Textarea
                value={form.deskripsi}
                onChange={e => setForm(f => ({...f, deskripsi: e.target.value}))}
                placeholder="Nasi putih dengan ayam kecap..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={v => setForm(f => ({...f, kategori: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(kategoriLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Target Porsi</Label><Input type="number" value={form.target_porsi} onChange={e => setForm(f => ({...f, target_porsi: e.target.value}))} placeholder="500" /></div>
              <div className="space-y-1.5"><Label>Kalori <span className="text-muted-foreground text-xs">(opsional)</span></Label><Input type="number" value={form.kalori} onChange={e => setForm(f => ({...f, kalori: e.target.value}))} placeholder="650" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.nama}>{save.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Menu</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Yakin ingin menghapus menu <span className="font-semibold text-foreground">{(data ?? []).find(m => m.id === delId)?.nama}</span>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => delId && del.mutate(delId)} disabled={del.isPending}>{del.isPending ? "Menghapus..." : "Hapus"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
