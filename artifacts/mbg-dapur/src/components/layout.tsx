import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Utensils, 
  ChefHat, 
  PackageSearch, 
  Truck, 
  Users, 
  Wallet,
  Settings,
  LogOut,
  UserCircle,
  ClipboardList,
  CalendarCheck,
  Building2,
  UtensilsCrossed,
  Bell,
  Calendar
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "Operasional",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Dapur", href: "/dapur", icon: ChefHat },
      { name: "Menu", href: "/menu", icon: UtensilsCrossed },
      { name: "Produksi", href: "/produksi", icon: Utensils },
      { name: "Absensi", href: "/absensi", icon: CalendarCheck },
    ],
  },
  {
    label: "Logistik",
    items: [
      { name: "Gudang", href: "/gudang/stok", icon: PackageSearch },
      { name: "Distribusi", href: "/distribusi", icon: Truck },
      { name: "Supplier", href: "/supplier", icon: Building2 },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { name: "Penerima Manfaat", href: "/penerima-manfaat", icon: Users },
      { name: "Keuangan", href: "/keuangan/summary", icon: Wallet },
      { name: "Pengguna", href: "/pengguna", icon: UserCircle },
      { name: "Pengaturan", href: "/pengaturan", icon: Settings },
    ],
  },
];

function useDatetime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logout = useLogout();
  const now = useDatetime();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => clearToken()
    });
  };

  const allItems = navGroups.flatMap(g => g.items);
  const activeItem = allItems.find(i => location === i.href || location.startsWith(i.href + "/"));
  const activeGroup = navGroups.find(g => g.items.some(i => location === i.href || location.startsWith(i.href + "/")));

  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border shadow-sm">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5 px-1">
              <div className="bg-sidebar-primary/20 text-sidebar-primary p-2 rounded-lg border border-sidebar-primary/30">
                <Utensils size={18} />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight leading-none text-sidebar-foreground">MBG Dapur</h2>
                <p className="text-xs text-sidebar-foreground/50 font-medium mt-0.5">Sistem Manajemen</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-2">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs tracking-widest uppercase px-3 py-1">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location === item.href || location.startsWith(item.href + "/");
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                            <Link href={item.href} className="flex items-center gap-3 py-2">
                              <item.icon size={17} />
                              <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            {isLoading ? (
              <div className="h-12 bg-sidebar-accent/40 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate text-sidebar-foreground leading-tight">{user.nama}</p>
                    <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{user.role.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors shrink-0"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : null}
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b bg-card/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="md:hidden shrink-0" />

            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
                <span className="text-muted-foreground/60 shrink-0">MBG Dapur</span>
                {activeGroup && (
                  <>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-muted-foreground/60 shrink-0">{activeGroup.label}</span>
                  </>
                )}
                {activeItem && (
                  <>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-foreground font-semibold truncate">{activeItem.name}</span>
                  </>
                )}
              </div>
              <div className="md:hidden font-bold text-sm text-foreground truncate">
                {activeItem?.name ?? "MBG Dapur"}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
              <Calendar size={12} />
              <span>{dateStr}</span>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl animate-slide-up">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
