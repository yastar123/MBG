import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Utensils, Loader2, Sparkles, ChefHat, Truck, BarChart3, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  { icon: ChefHat, label: "Manajemen Dapur & Produksi", desc: "Pantau semua unit dapur secara real-time" },
  { icon: Truck, label: "Distribusi & Pengiriman", desc: "Lacak pengiriman ke sekolah dengan akurat" },
  { icon: BarChart3, label: "Laporan Keuangan Real-time", desc: "Monitoring anggaran dan realisasi pengeluaran" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[52%] gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full bg-white/4 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/3" />
          <div className="absolute top-20 right-24 w-24 h-24 rounded-2xl border border-white/10 rotate-12 animate-float" />
          <div className="absolute bottom-32 left-16 w-16 h-16 rounded-2xl border border-white/8 -rotate-6 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl border border-white/20 shadow-lg">
              <Utensils size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-tight">MBG Dapur</h2>
              <p className="text-white/60 text-xs font-medium">Sistem Manajemen Operasional</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <p className="text-white/55 text-xs font-semibold mb-3 flex items-center gap-2 tracking-wider uppercase">
              <Sparkles size={12} /> Platform Terpadu
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Kelola dapur<br />dengan cerdas
            </h1>
            <p className="text-white/65 text-base mt-4 leading-relaxed max-w-sm">
              Pantau produksi, stok, distribusi, dan keuangan dapur MBG dari satu platform terintegrasi.
            </p>
          </div>

          <div className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="flex items-center gap-3.5 animate-slide-up"
                style={{ animationDelay: `${0.2 + i * 0.07}s` }}
              >
                <div className="w-9 h-9 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-6">
            {["100+", "50K+", "99.9%"].map((val, i) => (
              <div key={i}>
                <p className="text-white font-bold text-lg leading-none">{val}</p>
                <p className="text-white/40 text-xs mt-0.5">{["Dapur", "Porsi/hari", "Uptime"][i]}</p>
              </div>
            ))}
          </div>
          <p className="text-white/25 text-xs mt-6">© {new Date().getFullYear()} MBG Dapur. Program Makan Bergizi Gratis.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-md">
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">MBG Dapur</h2>
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
                        autoComplete="email"
                        {...field}
                        className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-ring/20"
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
                      <div className="relative">
                        <Input
                          placeholder="Masukkan kata sandi"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          {...field}
                          className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-ring/20 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-semibold mt-2 text-sm gap-2 group"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full group cursor-pointer p-4 rounded-xl bg-muted/40 border border-dashed border-border/60 hover:bg-muted hover:border-primary/40 transition-all duration-200 text-left"
            >
              <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors mb-2 flex items-center gap-1.5">
                <Sparkles size={11} />
                Klik untuk isi otomatis akun demo
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-foreground leading-tight">admin@test.com</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">admin123</p>
                </div>
                <div className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-semibold border border-primary/15">
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
