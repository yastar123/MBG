import React from "react";
import { Link } from "wouter";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-1">Halaman Tidak Ditemukan</p>
      <p className="text-sm text-muted-foreground mb-8">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <Button asChild>
        <Link href="/dashboard">
          <Home size={16} className="mr-2" />
          Kembali ke Dashboard
        </Link>
      </Button>
    </div>
  );
}
