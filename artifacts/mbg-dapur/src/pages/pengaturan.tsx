import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Database, Shield, Bell, ChefHat, CheckCircle2, Server, Clock, Info } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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

const DEFAULT_NOTIFS = [
  { id: "stok", label: "Stok di bawah minimum", desc: "Peringatan saat bahan baku hampir habis", active: true },
  { id: "pengiriman", label: "Pengiriman terlambat", desc: "Notifikasi saat pengiriman melewati jadwal", active: true },
  { id: "produksi", label: "Produksi di bawah target", desc: "Alert saat realisasi < 80% target", active: true },
  { id: "anggaran", label: "Anggaran hampir habis", desc: "Notifikasi saat sisa anggaran < 10%", active: false },
];

const STORAGE_KEY = "mbg_notif_prefs";

function loadNotifs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: Record<string, boolean> = JSON.parse(raw);
      return DEFAULT_NOTIFS.map(n => ({ ...n, active: saved[n.id] ?? n.active }));
    }
  } catch {}
  return DEFAULT_NOTIFS;
}

export default function PengaturanPage() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();
  const [notifs, setNotifs] = useState(loadNotifs);
  const [serverTime, setServerTime] = useState(new Date().toLocaleTimeString("id-ID"));

  useEffect(() => {
    const t = setInterval(() => setServerTime(new Date().toLocaleTimeString("id-ID")), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleNotif = (id: string) => {
    setNotifs(prev => {
      const next = prev.map(x => x.id === id ? { ...x, active: !x.active } : x);
      const map: Record<string, boolean> = {};
      next.forEach(n => { map[n.id] = n.active; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      const toggled = next.find(x => x.id === id);
      toast({ title: toggled?.active ? "Notifikasi diaktifkan" : "Notifikasi dinonaktifkan", description: toggled?.label });
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="page-heading">Pengaturan</h1>
        <p className="page-subheading">Konfigurasi dan informasi sistem</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 animate-slide-up">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Server size={15} className="text-primary" />
              </div>
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 mb-4">
              {[
                { label: "Versi Aplikasi", value: "1.0.0", icon: CheckCircle2, iconClass: "text-primary" },
                { label: "Database", value: "PostgreSQL 16", icon: Database, iconClass: "text-blue-500" },
                { label: "Bahasa", value: "Indonesia", icon: Info, iconClass: "text-muted-foreground" },
                { label: "Zona Waktu", value: "WIB (UTC+7)", icon: Settings, iconClass: "text-muted-foreground" },
                { label: "Waktu Server", value: serverTime, icon: Clock, iconClass: "text-muted-foreground" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-2.5">
                    <item.icon size={14} className={item.iconClass} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">{item.value}</Badge>
                </div>
              ))}
            </div>

            {user && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Sesi aktif</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user.nama}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bell size={15} className="text-primary" />
              </div>
              Preferensi Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifs.map(n => (
                <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`notif-${n.id}`} className="text-sm font-medium cursor-pointer leading-tight">{n.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                  </div>
                  <Switch
                    id={`notif-${n.id}`}
                    checked={n.active}
                    onCheckedChange={() => toggleNotif(n.id)}
                    className="shrink-0 mt-0.5"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-primary" />
              Preferensi tersimpan di perangkat ini
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield size={15} className="text-primary" />
              </div>
              Hak Akses Peran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {ROLE_ITEMS.map(r => (
                <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <span className={`text-xs px-2 py-1 rounded-lg font-semibold mt-0.5 shrink-0 flex items-center gap-1 ${r.color}`}>
                    <ChefHat size={11} />
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
