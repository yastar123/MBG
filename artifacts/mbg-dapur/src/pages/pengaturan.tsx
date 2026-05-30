import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Database, Shield, Bell, ChefHat, CheckCircle2, Server, Clock } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const ROLE_ITEMS = [
  { role: "Super Admin", akses: "Akses penuh seluruh sistem", color: "bg-red-100 text-red-700" },
  { role: "Admin Yayasan", akses: "Laporan, anggaran, monitoring", color: "bg-purple-100 text-purple-700" },
  { role: "Admin Dapur", akses: "Manajemen dapur & produksi", color: "bg-blue-100 text-blue-700" },
  { role: "Admin Gudang", akses: "Manajemen stok & penerimaan bahan", color: "bg-amber-100 text-amber-700" },
  { role: "Kepala Dapur", akses: "Produksi & absensi staff", color: "bg-green-100 text-green-700" },
  { role: "Staff Dapur", akses: "Input produksi & absensi", color: "bg-teal-100 text-teal-700" },
  { role: "Staff Gudang", akses: "Input stok & pengeluaran bahan", color: "bg-orange-100 text-orange-700" },
  { role: "Driver", akses: "Update status pengiriman", color: "bg-pink-100 text-pink-700" },
  { role: "Verifikator", akses: "Verifikasi penerimaan manfaat", color: "bg-indigo-100 text-indigo-700" },
  { role: "Supplier", akses: "Lihat PO & update status pengiriman", color: "bg-gray-100 text-gray-700" },
];

const DEFAULT_NOTIF = [
  { id: "stok", label: "Stok di bawah minimum", desc: "Peringatan saat bahan baku hampir habis", active: true },
  { id: "pengiriman", label: "Pengiriman terlambat", desc: "Notifikasi saat pengiriman melewati jadwal", active: true },
  { id: "produksi", label: "Produksi di bawah target", desc: "Alert saat realisasi < 80% target", active: true },
  { id: "anggaran", label: "Anggaran hampir habis", desc: "Notifikasi saat sisa anggaran < 10%", active: false },
];

export default function PengaturanPage() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const [notifs, setNotifs] = useState(DEFAULT_NOTIF);

  const now = new Date();
  const toggleNotif = (id: string) => {
    setNotifs(n => n.map(x => x.id === id ? {...x, active: !x.active} : x));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi dan informasi sistem</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Server size={18} className="text-primary" /> Informasi Sistem</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[
                { label: "Versi Aplikasi", value: "1.0.0", icon: CheckCircle2, iconClass: "text-primary" },
                { label: "Database", value: "PostgreSQL 16", icon: Database, iconClass: "text-blue-500" },
                { label: "Bahasa", value: "Indonesia", icon: Settings, iconClass: "text-muted-foreground" },
                { label: "Zona Waktu", value: "WIB (UTC+7)", icon: Clock, iconClass: "text-muted-foreground" },
                { label: "Waktu Server", value: now.toLocaleTimeString("id-ID"), icon: Clock, iconClass: "text-muted-foreground" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className={item.iconClass} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">{item.value}</Badge>
                </div>
              ))}
            </div>
            {user && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Login sebagai</p>
                <p className="font-semibold text-sm">{user.nama}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={18} className="text-primary" /> Preferensi Notifikasi</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifs.map(n => (
                <div key={n.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`notif-${n.id}`} className="text-sm font-medium cursor-pointer">{n.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                  <Switch
                    id={`notif-${n.id}`}
                    checked={n.active}
                    onCheckedChange={() => toggleNotif(n.id)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">Preferensi disimpan di perangkat ini</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield size={18} className="text-primary" /> Hak Akses Peran</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {ROLE_ITEMS.map(r => (
                <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${r.color}`}>
                    <ChefHat size={12} className="inline mr-1" />
                    {r.role}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.akses}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
