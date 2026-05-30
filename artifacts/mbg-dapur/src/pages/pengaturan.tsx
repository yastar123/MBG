import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Shield, Bell, Globe, ChefHat } from "lucide-react";

const INFO_ITEMS = [
  { label: "Versi Aplikasi", value: "1.0.0" },
  { label: "Database", value: "PostgreSQL" },
  { label: "Bahasa", value: "Indonesia" },
  { label: "Zona Waktu", value: "WIB (UTC+7)" },
];

const ROLE_ITEMS = [
  { role: "Super Admin", akses: "Akses penuh seluruh sistem" },
  { role: "Admin Yayasan", akses: "Laporan, anggaran, monitoring" },
  { role: "Admin Dapur", akses: "Manajemen dapur & produksi" },
  { role: "Admin Gudang", akses: "Manajemen stok & penerimaan bahan" },
  { role: "Kepala Dapur", akses: "Produksi & absensi staff" },
  { role: "Staff Dapur", akses: "Input produksi & absensi" },
  { role: "Staff Gudang", akses: "Input stok & pengeluaran bahan" },
  { role: "Driver", akses: "Update status pengiriman" },
  { role: "Verifikator", akses: "Verifikasi penerimaan manfaat" },
  { role: "Supplier", akses: "Lihat PO & update status pengiriman" },
];

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi dan informasi sistem</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings size={18} className="text-primary" /> Informasi Sistem</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {INFO_ITEMS.map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Badge variant="secondary" className="font-mono text-xs">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={18} className="text-primary" /> Notifikasi Sistem</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Stok di bawah minimum", active: true },
                { label: "Pengiriman terlambat", active: true },
                { label: "Produksi di bawah target", active: true },
                { label: "Anggaran hampir habis", active: false },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{n.label}</span>
                  <Badge variant={n.active ? "default" : "secondary"} className="text-xs">{n.active ? "Aktif" : "Nonaktif"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield size={18} className="text-primary" /> Hak Akses Peran</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {ROLE_ITEMS.map(r => (
                <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <ChefHat size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{r.role}</p>
                    <p className="text-xs text-muted-foreground">{r.akses}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
