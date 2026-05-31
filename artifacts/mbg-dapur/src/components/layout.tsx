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
  CalendarCheck,
  Building2,
  UtensilsCrossed,
  Calendar,
  Menu,
  ChevronRight,
  MoreHorizontal,
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
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
      { name: "Gudang", href: "/gudang", icon: PackageSearch },
      { name: "Distribusi", href: "/distribusi", icon: Truck },
      { name: "Supplier", href: "/supplier", icon: Building2 },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { name: "Penerima Manfaat", href: "/penerima-manfaat", icon: Users },
      { name: "Keuangan", href: "/keuangan", icon: Wallet },
      { name: "Pengguna", href: "/pengguna", icon: UserCircle },
      { name: "Pengaturan", href: "/pengaturan", icon: Settings },
    ],
  },
];

// Bottom nav items for mobile (5 most-used)
const bottomNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Produksi", href: "/produksi", icon: Utensils },
  { name: "Gudang", href: "/gudang", icon: PackageSearch },
  { name: "Distribusi", href: "/distribusi", icon: Truck },
  { name: "Lainnya", href: null, icon: MoreHorizontal },
];

function useDatetime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function isActive(location: string, href: string): boolean {
  if (href === "/gudang") return location === "/gudang" || location.startsWith("/gudang/");
  if (href === "/keuangan") return location === "/keuangan" || location.startsWith("/keuangan/");
  return location === href || location.startsWith(href + "/");
}

function SidebarInner({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => clearToken() });
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1">
          <div className="bg-sidebar-primary/25 text-sidebar-primary p-2 rounded-lg border border-sidebar-primary/30 shadow-sm">
            <Utensils size={17} />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight leading-none text-sidebar-foreground">MBG Dapur</h2>
            <p className="text-xs text-sidebar-foreground/45 font-medium mt-0.5">Sistem Manajemen</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/35 text-[10px] tracking-[0.12em] uppercase px-3 py-1 font-semibold">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(location, item.href);
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className="flex items-center gap-3 py-2"
                        >
                          <item.icon size={16} />
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
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-sidebar-primary/30">
                {user.nama?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-sidebar-foreground leading-tight">{user.nama ?? '—'}</p>
                <p className="text-xs text-sidebar-foreground/45 truncate capitalize">{user.role?.replace(/_/g, ' ') ?? ''}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : null}
      </SidebarFooter>
    </>
  );
}

function MobileBottomNav({ location, onOpenMenu }: { location: string; onOpenMenu: () => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border/60 shadow-lg safe-bottom">
      <div className="flex items-stretch h-16">
        {bottomNavItems.map((item) => {
          if (item.href === null) {
            return (
              <button
                key="more"
                onClick={onOpenMenu}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              >
                <item.icon size={20} strokeWidth={1.8} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }
          const active = isActive(location, item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all ${active ? 'bg-primary/10' : ''}`}>
                <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const now = useDatetime();

  const allItems = navGroups.flatMap(g => g.items);
  const activeItem = allItems.find(i => isActive(location, i.href));
  const activeGroup = navGroups.find(g => g.items.some(i => isActive(location, i.href)));

  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar className="border-r border-sidebar-border shadow-sm">
            <SidebarInner location={location} />
          </Sidebar>
        </div>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 bg-sidebar border-r border-sidebar-border [&>button]:hidden"
          >
            <div className="flex flex-col h-full">
              <SidebarInner location={location} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top header */}
          <header className="h-14 border-b bg-card/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-20 shadow-sm">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Buka menu navigasi"
            >
              <Menu size={18} />
            </button>
            <SidebarTrigger className="hidden md:flex shrink-0" />

            {/* Breadcrumb */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="hidden md:flex items-center gap-1 text-sm min-w-0">
                <span className="text-muted-foreground/50 text-xs shrink-0">MBG Dapur</span>
                {activeGroup && (
                  <>
                    <ChevronRight size={12} className="text-muted-foreground/30 shrink-0" />
                    <span className="text-muted-foreground/50 shrink-0 text-xs">{activeGroup.label}</span>
                  </>
                )}
                {activeItem && (
                  <>
                    <ChevronRight size={12} className="text-muted-foreground/30 shrink-0" />
                    <span className="text-foreground font-semibold text-xs truncate">{activeItem.name}</span>
                  </>
                )}
              </div>
              <div className="md:hidden font-bold text-sm text-foreground truncate">
                {activeItem?.name ?? "MBG Dapur"}
              </div>
            </div>

            {/* Date pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40 shrink-0 select-none">
              <Calendar size={11} />
              <span className="hidden lg:inline">{dateStr}</span>
              <span className="lg:hidden">{now.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
            </div>
          </header>

          {/* Page content — extra pb on mobile for bottom nav */}
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-6xl animate-slide-up">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav location={location} onOpenMenu={() => setMobileOpen(true)} />
      </div>
    </SidebarProvider>
  );
}
