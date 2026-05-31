import React from "react";
import { Link } from "wouter";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="animate-scale-in max-w-sm w-full">
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/8 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative w-28 h-28 rounded-full bg-muted flex items-center justify-center border-2 border-border">
            <Compass className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
        </div>

        <p className="text-6xl font-bold tracking-tight text-foreground mb-2 font-mono">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Halaman yang Anda cari tidak ada atau telah dipindahkan. Kembali ke dashboard untuk melanjutkan.
        </p>

        <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
          <Link href="/dashboard">
            <Home size={16} />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
