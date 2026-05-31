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
  Activity,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: summary, isLoading: isLoadingSummary, isFetching } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetDashboardTrends();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    qc.invalidateQueries({ queryKey: ["/api/dashboard/trends"] });
  }

  const stats = [
    {
      title: "Porsi Diproduksi",
      value: summary?.total_porsi_hari_ini,
      icon: Utensils,
      description: "Total dari semua dapur aktif",
      iconBg: "bg-primary/10 text-primary",
      valueClass: "text-foreground",
      border: "border-primary/10",
      accent: "from-primary/5 to-transparent",
      trend: <ArrowUpRight size={14} className="text-primary/50" />,
      delay: "0s",
    },
    {
      title: "Dapur Aktif",
      value: summary?.total_dapur_aktif,
      icon: ChefHat,
      description: "Unit beroperasi hari ini",
      iconBg: "bg-emerald-100 text-emerald-700",
      valueClass: "text-foreground",
      border: "border-emerald-100",
      accent: "from-emerald-50/60 to-transparent",
      trend: <ArrowUpRight size={14} className="text-emerald-500/50" />,
      delay: "0.06s",
    },
    {
      title: "Pengiriman",
      value: summary?.total_pengiriman_hari_ini,
      icon: Truck,
      description: `${summary?.pengiriman_selesai ?? 0} selesai · ${summary?.pengiriman_dalam_proses ?? 0} proses`,
      iconBg: "bg-sky-100 text-sky-700",
      valueClass: "text-foreground",
      border: "border-sky-100",
      accent: "from-sky-50/60 to-transparent",
      trend: <ArrowUpRight size={14} className="text-sky-500/50" />,
      delay: "0.12s",
    },
    {
      title: "Peringatan Stok",
      value: summary?.stok_alert_count,
      icon: AlertTriangle,
      description: "Bahan di bawah minimum",
      iconBg: (summary?.stok_alert_count ?? 0) > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
      valueClass: (summary?.stok_alert_count ?? 0) > 0 ? "text-destructive" : "text-foreground",
      border: (summary?.stok_alert_count ?? 0) > 0 ? "border-destructive/30" : "border-border",
      accent: (summary?.stok_alert_count ?? 0) > 0 ? "from-destructive/5 to-transparent" : "from-transparent to-transparent",
      trend: (summary?.stok_alert_count ?? 0) > 0
        ? <ArrowDownRight size={14} className="text-destructive/60" />
        : <ArrowUpRight size={14} className="text-muted-foreground/30" />,
      alert: (summary?.stok_alert_count ?? 0) > 0,
      delay: "0.18s",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="page-heading">Dashboard Operasional</h1>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold shrink-0 shadow-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <p className="page-subheading">Ringkasan harian performa dapur MBG nasional.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isFetching}
          className="gap-1.5 shrink-0 h-9"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => (
          <Card
            key={card.title}
            className={`shadow-sm card-hover animate-slide-up overflow-hidden border ${card.border}`}
            style={{ animationDelay: card.delay }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} pointer-events-none`} />
            <CardContent className="pt-5 pb-5 relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <card.icon size={17} />
                </div>
                <div className="opacity-60">{card.trend}</div>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-9 w-20 mb-1.5" />
              ) : (
                <div className={`text-3xl font-bold tracking-tight animate-count-up tabular-nums ${card.valueClass}`}>
                  {card.value !== undefined && card.value !== null
                    ? Number(card.value).toLocaleString('id-ID')
                    : '—'}
                </div>
              )}
              <p className="text-xs font-semibold text-foreground/75 mt-1">{card.title}</p>
              {card.description && (
                <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed truncate">{card.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + summary grid */}
      <div className="grid gap-5 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '0.22s' }}>
        {/* Area chart */}
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                Tren Produksi — 7 Hari Terakhir
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  Realisasi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 inline-block border-t-2 border-dashed border-muted-foreground/40" />
                  Target
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTrends ? (
              <div className="h-[240px] w-full bg-muted/20 animate-shimmer rounded-lg" />
            ) : Array.isArray(trends) && trends.length > 0 ? (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends as object[]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--muted-foreground))" stopOpacity={0.08}/>
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
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      width={40}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.6)" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
                        fontSize: '12px',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                        padding: '10px 14px',
                      }}
                      formatter={(v: number, name: string) => [v.toLocaleString('id-ID') + ' porsi', name]}
                    />
                    <Area type="monotone" dataKey="target_porsi" name="Target" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth={1.5} strokeDasharray="5 3" fillOpacity={1} fill="url(#colorTarget)" />
                    <Area type="monotone" dataKey="total_porsi" name="Realisasi" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRealisasi)" dot={{ r: 3.5, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5.5, strokeWidth: 2.5, stroke: 'hsl(var(--background))', fill: 'hsl(var(--primary))' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                  <Activity className="text-muted-foreground" size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Belum ada data produksi</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Data akan muncul setelah produksi dicatat</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick summary side panel */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ringkasan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {isLoadingSummary ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => <Skeleton key={i} className="h-[60px] w-full rounded-xl" />)}
              </div>
            ) : (
              <>
                {[
                  {
                    icon: Utensils,
                    label: "Total Produksi",
                    sub: "porsi hari ini",
                    value: summary?.total_porsi_hari_ini?.toLocaleString("id-ID") ?? "—",
                    iconBg: "bg-primary/10 text-primary",
                    valueClass: "text-primary",
                  },
                  {
                    icon: ChefHat,
                    label: "Dapur Aktif",
                    sub: "unit beroperasi",
                    value: String(summary?.total_dapur_aktif ?? "—"),
                    iconBg: "bg-emerald-100 text-emerald-700",
                    valueClass: "text-emerald-700",
                  },
                  {
                    icon: Truck,
                    label: "Pengiriman Selesai",
                    sub: `dari ${summary?.total_pengiriman_hari_ini ?? 0} total`,
                    value: String(summary?.pengiriman_selesai ?? "—"),
                    iconBg: "bg-sky-100 text-sky-700",
                    valueClass: "text-sky-700",
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors animate-slide-up"
                    style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                  >
                    <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground/65 truncate">{item.sub}</p>
                    </div>
                    <span className={`font-bold text-lg shrink-0 tabular-nums ${item.valueClass}`}>{item.value}</span>
                  </div>
                ))}

                {(summary?.stok_alert_count ?? 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20 animate-slide-up" style={{ animationDelay: '0.45s' }}>
                    <div className="w-9 h-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-destructive leading-tight">Peringatan Stok</p>
                      <p className="text-xs text-muted-foreground/65">Bahan hampir habis</p>
                    </div>
                    <span className="font-bold text-lg text-destructive shrink-0 tabular-nums">{summary?.stok_alert_count}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
