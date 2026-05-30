import React from "react";
import { 
  useGetDashboardSummary, 
  useGetDashboardTrends,
} from "@workspace/api-client-react";
import { 
  Utensils, 
  ChefHat, 
  AlertTriangle, 
  TrendingUp,
  Truck,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetDashboardTrends();

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="page-heading">Dashboard Operasional</h1>
        <p className="page-subheading">Ringkasan harian performa dapur MBG nasional.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Porsi Diproduksi",
            value: summary?.total_porsi_hari_ini,
            icon: Utensils,
            description: "Total dari semua dapur aktif",
            colorClass: "bg-primary/10 text-primary",
            delay: "0s",
          },
          {
            title: "Dapur Aktif",
            value: summary?.total_dapur_aktif,
            icon: ChefHat,
            description: "Beroperasi hari ini",
            colorClass: "bg-emerald-100 text-emerald-700",
            delay: "0.05s",
          },
          {
            title: "Pengiriman",
            value: summary?.total_pengiriman_hari_ini,
            icon: Truck,
            description: `${summary?.pengiriman_selesai ?? 0} selesai · ${summary?.pengiriman_dalam_proses ?? 0} proses`,
            colorClass: "bg-blue-100 text-blue-700",
            delay: "0.1s",
          },
          {
            title: "Peringatan Stok",
            value: summary?.stok_alert_count,
            icon: AlertTriangle,
            description: "Bahan baku di bawah minimum",
            colorClass: summary?.stok_alert_count && summary.stok_alert_count > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            alert: (summary?.stok_alert_count ?? 0) > 0,
            delay: "0.15s",
          },
        ].map((card) => (
          <Card
            key={card.title}
            className={`shadow-sm card-hover animate-slide-up ${card.alert ? 'border-destructive/40 bg-destructive/5' : ''}`}
            style={{ animationDelay: card.delay }}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`stat-card-icon w-10 h-10 ${card.colorClass}`}>
                  <card.icon size={18} />
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/40 mt-1" />
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <div className={`text-3xl font-bold tracking-tight ${card.alert ? 'text-destructive' : 'text-foreground'}`}>
                  {card.value !== undefined && card.value !== null
                    ? Number(card.value).toLocaleString('id-ID')
                    : '—'}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{card.title}</p>
              {card.description && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{card.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Tren Produksi — 7 Hari Terakhir
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  Realisasi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 inline-block" />
                  Target
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTrends ? (
              <div className="h-[280px] w-full bg-muted/20 animate-shimmer rounded-lg" />
            ) : trends && trends.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="tanggal"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: 'var(--shadow-lg)',
                        fontSize: '12px',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Area type="monotone" dataKey="target_porsi" name="Target" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" />
                    <Area type="monotone" dataKey="total_porsi" name="Realisasi" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRealisasi)" dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Activity className="text-muted-foreground" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belum ada data produksi</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Data akan muncul setelah produksi dicatat</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ringkasan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  {
                    icon: Utensils,
                    label: "Total Produksi",
                    sub: "Porsi hari ini",
                    value: summary?.total_porsi_hari_ini?.toLocaleString("id-ID") ?? "—",
                    iconBg: "bg-primary/10 text-primary",
                    valueClass: "text-primary",
                  },
                  {
                    icon: ChefHat,
                    label: "Dapur Aktif",
                    sub: "Beroperasi",
                    value: String(summary?.total_dapur_aktif ?? "—"),
                    iconBg: "bg-emerald-100 text-emerald-700",
                    valueClass: "text-foreground",
                  },
                  {
                    icon: Truck,
                    label: "Pengiriman Selesai",
                    sub: `Dari ${summary?.total_pengiriman_hari_ini ?? 0} total`,
                    value: String(summary?.pengiriman_selesai ?? "—"),
                    iconBg: "bg-blue-100 text-blue-700",
                    valueClass: "text-blue-700",
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground/70">{item.sub}</p>
                    </div>
                    <span className={`font-bold text-base shrink-0 ${item.valueClass}`}>{item.value}</span>
                  </div>
                ))}

                {(summary?.stok_alert_count ?? 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/8 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-destructive leading-tight">Peringatan Stok</p>
                      <p className="text-xs text-muted-foreground/70">Bahan hampir habis</p>
                    </div>
                    <span className="font-bold text-base text-destructive shrink-0">{summary?.stok_alert_count}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
