import React from "react";
import { 
  useGetDashboardSummary, 
  useGetDashboardTrends,
  getGetDashboardSummaryQueryKey,
  getGetDashboardTrendsQueryKey
} from "@workspace/api-client-react";
import { 
  Utensils, 
  ChefHat, 
  AlertTriangle, 
  Package, 
  TrendingUp,
  Truck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetDashboardTrends();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Operasional</h1>
        <p className="text-muted-foreground mt-1">Ringkasan harian performa dapur MBG nasional.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Porsi Diproduksi (Hari Ini)"
          value={summary?.total_porsi_hari_ini}
          icon={Utensils}
          loading={isLoadingSummary}
          description="Total dari semua dapur aktif"
        />
        <StatCard 
          title="Dapur Aktif"
          value={summary?.total_dapur_aktif}
          icon={ChefHat}
          loading={isLoadingSummary}
          description="Beroperasi hari ini"
        />
        <StatCard 
          title="Pengiriman"
          value={summary?.total_pengiriman_hari_ini}
          icon={Truck}
          loading={isLoadingSummary}
          description={`${summary?.pengiriman_selesai || 0} selesai, ${summary?.pengiriman_dalam_proses || 0} proses`}
        />
        <StatCard 
          title="Peringatan Stok"
          value={summary?.stok_alert_count}
          icon={AlertTriangle}
          loading={isLoadingSummary}
          description="Bahan baku di bawah batas minimum"
          alert={summary?.stok_alert_count ? summary.stok_alert_count > 0 : false}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tren Produksi (7 Hari Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrends ? (
              <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>
            ) : trends && trends.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Area type="monotone" dataKey="target_porsi" name="Target" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorTarget)" />
                    <Area type="monotone" dataKey="total_porsi" name="Realisasi" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRealisasi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data tren produksi.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Ringkasan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Utensils size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Produksi</p>
                    <p className="text-xs text-muted-foreground">Porsi diproduksi hari ini</p>
                  </div>
                </div>
                <span className="font-bold text-primary text-lg">{summary?.total_porsi_hari_ini?.toLocaleString("id-ID") ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ChefHat size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dapur Aktif</p>
                    <p className="text-xs text-muted-foreground">Beroperasi hari ini</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{summary?.total_dapur_aktif ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                    <Truck size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pengiriman Selesai</p>
                    <p className="text-xs text-muted-foreground">Dari {summary?.total_pengiriman_hari_ini ?? 0} total pengiriman</p>
                  </div>
                </div>
                <span className="font-bold text-lg text-green-700">{summary?.pengiriman_selesai ?? "-"}</span>
              </div>
              {(summary?.stok_alert_count ?? 0) > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-destructive">Peringatan Stok</p>
                      <p className="text-xs text-muted-foreground">Bahan baku hampir habis</p>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-destructive">{summary?.stok_alert_count}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  loading,
  alert = false
}: { 
  title: string; 
  value?: number | string; 
  icon: any; 
  description?: string;
  loading?: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={`shadow-sm ${alert ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>
            {value !== undefined ? value.toLocaleString('id-ID') : '-'}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
