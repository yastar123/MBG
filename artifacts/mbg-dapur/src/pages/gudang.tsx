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
import { Package, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Stok = { bahan_baku_id: number; bahan_baku_nama: string; kuantitas: number; satuan: string; stok_minimum: number };
type BahanBaku = { id: number; nama: string; satuan: string; stok_minimum: number; kategori: string | null };
type Penerimaan = { id: number; supplier_id: number; tanggal: string; total_item: number | null; status: string; catatan: string | null; supplier_nama: string | null };

const emptyBahan = { nama: "", satuan: "", stok_minimum: "", kategori: "" };

export default function GudangPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stok, isLoading: loadingStok } = useQuery<Stok[]>({ queryKey: ["/api/stok"], queryFn: async () => (await fetch("/api/stok")).json() });
  const { data: bahan, isLoading: loadingBahan } = useQuery<BahanBaku[]>({ queryKey: ["/api/bahan-baku"], queryFn: async () => (await fetch("/api/bahan-baku")).json() });
  const { data: penerimaan } = useQuery<Penerimaan[]>({ queryKey: ["/api/penerimaan-bahan"], queryFn: async () => (await fetch("/api/penerimaan-bahan")).json() });
  const [openBahan, setOpenBahan] = useState(false);
  const [editBahan, setEditBahan] = useState<BahanBaku | null>(null);
  const [formBahan, setFormBahan] = useState(emptyBahan);

  const saveBahan = useMutation({
    mutationFn: async () => {
      const url = editBahan ? `/api/bahan-baku/${editBahan.id}` : "/api/bahan-baku";
      const method = editBahan ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formBahan) });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/bahan-baku"] }); qc.invalidateQueries({ queryKey: ["/api/stok"] }); toast({ title: "Bahan baku disimpan" }); setOpenBahan(false); },
    onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
  });

  const delBahan = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/bahan-baku/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/bahan-baku"] }); qc.invalidateQueries({ queryKey: ["/api/stok"] }); toast({ title: "Bahan baku dihapus" }); },
  });

  const alertItems = stok?.filter(s => s.kuantitas <= s.stok_minimum) ?? [];

  function openAddBahan() { setEditBahan(null); setFormBahan(emptyBahan); setOpenBahan(true); }
  function openEditBahan(b: BahanBaku) {
    setEditBahan(b);
    setFormBahan({ nama: b.nama, satuan: b.satuan, stok_minimum: String(b.stok_minimum), kategori: b.kategori ?? "" });
    setOpenBahan(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gudang</h1>
        <p className="text-muted-foreground text-sm">Manajemen bahan baku dan stok gudang</p>
      </div>

      {alertItems.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-destructive" />
              <span className="font-semibold text-destructive text-sm">{alertItems.length} bahan baku di bawah batas minimum</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertItems.map(s => (
                <Badge key={s.bahan_baku_id} variant="destructive" className="text-xs">
                  {s.bahan_baku_nama}: {s.kuantitas} {s.satuan} (min {s.stok_minimum})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stok">
        <TabsList><TabsTrigger value="stok">Stok Saat Ini</TabsTrigger><TabsTrigger value="bahan">Bahan Baku</TabsTrigger><TabsTrigger value="penerimaan">Penerimaan</TabsTrigger></TabsList>

        <TabsContent value="stok" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Package size={18} className="text-primary" /> Stok Gudang</CardTitle></CardHeader>
            <CardContent>
              {loadingStok ? <Skeleton className="h-48 w-full" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Bahan Baku</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Stok</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Minimum</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                  </tr></thead>
                  <tbody>
                    {(stok ?? []).map(s => (
                      <tr key={s.bahan_baku_id} className="border-b hover:bg-muted/30">
                        <td className="py-2 font-medium">{s.bahan_baku_nama}</td>
                        <td className="py-2 text-right">{s.kuantitas} {s.satuan}</td>
                        <td className="py-2 text-right text-muted-foreground">{s.stok_minimum} {s.satuan}</td>
                        <td className="py-2 text-center">
                          {s.kuantitas <= s.stok_minimum
                            ? <Badge variant="destructive" className="text-xs">Rendah</Badge>
                            : s.kuantitas <= s.stok_minimum * 1.5
                            ? <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Hampir Habis</Badge>
                            : <Badge variant="default" className="text-xs">Aman</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bahan" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Bahan Baku</CardTitle>
                <Button size="sm" onClick={openAddBahan} className="gap-1"><Plus size={14} /> Tambah</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBahan ? <Skeleton className="h-48 w-full" /> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Satuan</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Kategori</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Minimum</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {(bahan ?? []).map(b => (
                      <tr key={b.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 font-medium">{b.nama}</td>
                        <td className="py-2">{b.satuan}</td>
                        <td className="py-2 text-muted-foreground">{b.kategori ?? "-"}</td>
                        <td className="py-2 text-right">{b.stok_minimum}</td>
                        <td className="py-2 text-center flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditBahan(b)}><Pencil size={14} /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => delBahan.mutate(b.id)}><Trash2 size={14} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="penerimaan" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Riwayat Penerimaan Bahan</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Jumlah Item</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {(penerimaan ?? []).map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="py-2">{p.tanggal}</td>
                      <td className="py-2">{p.supplier_nama ?? "-"}</td>
                      <td className="py-2 text-right">{p.total_item ?? 0}</td>
                      <td className="py-2 text-center">
                        <Badge variant={p.status === "diterima" ? "default" : "secondary"} className="text-xs capitalize">{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openBahan} onOpenChange={setOpenBahan}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBahan ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nama</Label><Input value={formBahan.nama} onChange={e => setFormBahan(f => ({...f, nama: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Satuan</Label><Input value={formBahan.satuan} onChange={e => setFormBahan(f => ({...f, satuan: e.target.value}))} placeholder="kg, liter, butir, dll" /></div>
            <div className="space-y-1"><Label>Kategori</Label><Input value={formBahan.kategori} onChange={e => setFormBahan(f => ({...f, kategori: e.target.value}))} /></div>
            <div className="space-y-1"><Label>Stok Minimum</Label><Input type="number" value={formBahan.stok_minimum} onChange={e => setFormBahan(f => ({...f, stok_minimum: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBahan(false)}>Batal</Button>
            <Button onClick={() => saveBahan.mutate()} disabled={saveBahan.isPending}>{saveBahan.isPending ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
