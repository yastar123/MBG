import React from "react";
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
  UtensilsCrossed
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        clearToken();
      }
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border shadow-sm">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Utensils size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg tracking-tight leading-none text-sidebar-foreground">MBG Dapur</h2>
                <p className="text-xs text-sidebar-foreground/70 font-medium">Sistem Manajemen</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location === item.href || location.startsWith(item.href + "/");
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                            <Link href={item.href} className="flex items-center gap-3">
                              <item.icon size={18} />
                              <span className="font-medium">{item.name}</span>
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
          <SidebarFooter className="border-t border-sidebar-border p-4">
            {isLoading ? (
              <div className="h-10 bg-sidebar-accent animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {user.nama.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate text-sidebar-foreground">{user.nama}</p>
                    <p className="text-xs text-sidebar-foreground/70 truncate capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                  title="Keluar"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : null}
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b bg-card flex items-center px-4 shrink-0 md:hidden">
            <SidebarTrigger />
            <div className="font-bold ml-4">MBG Dapur</div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
