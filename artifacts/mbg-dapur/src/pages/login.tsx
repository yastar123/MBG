import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Utensils, Loader2, Sparkles, ChefHat, Truck, BarChart3 } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

const FEATURES = [
  { icon: ChefHat, label: "Manajemen Dapur & Produksi" },
  { icon: Truck, label: "Distribusi & Pengiriman" },
  { icon: BarChart3, label: "Laporan Keuangan Real-time" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({ title: "Selamat datang kembali!", description: `Login sebagai ${res.user.nama}` });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Gagal login", description: "Email atau password tidak valid." });
      }
    });
  };

  function fillDemo() {
    form.setValue("email", "admin@test.com");
    form.setValue("password", "admin123");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl border border-white/20">
              <Utensils size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white tracking-tight">MBG Dapur</h2>
              <p className="text-white/70 text-xs font-medium">Sistem Manajemen Operasional</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <p className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Platform Terpadu
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Kelola dapur<br />dengan cerdas
            </h1>
            <p className="text-white/70 text-base mt-4 leading-relaxed max-w-xs">
              Pantau produksi, stok, distribusi, dan keuangan dapur MBG Anda dari satu platform terintegrasi.
            </p>
          </div>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${0.2 + i * 0.08}s` }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-white/40 text-xs">© 2025 MBG Dapur. Program Makan Bergizi Gratis.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-xl">
              <Utensils size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight">MBG Dapur</h2>
              <p className="text-xs text-muted-foreground">Sistem Manajemen Operasional</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Masuk ke akun Anda</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Silakan masukkan kredensial untuk melanjutkan.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nama@mbg.id"
                        type="email"
                        {...field}
                        className="h-11 bg-muted/40 border-border/60 focus:bg-white transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                        className="h-11 bg-muted/40 border-border/60 focus:bg-white transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-semibold mt-2 text-sm"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full group cursor-pointer p-4 rounded-xl bg-muted/50 border border-dashed border-border/60 hover:bg-muted hover:border-primary/30 transition-all duration-200 text-left"
            >
              <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} />
                Klik untuk isi otomatis akun demo
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-foreground">admin@test.com</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">admin123</p>
                </div>
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                  Super Admin
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
