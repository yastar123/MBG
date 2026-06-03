export const ROLE_PAGES: Record<string, string[]> = {
  super_admin: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran", 
    "/pengguna", "/pengaturan"
  ],
  admin: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran", 
    "/pengguna", "/pengaturan"
  ],
  admin_yayasan: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran", 
    "/pengguna", "/pengaturan"
  ],
  kepala_dapur: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran", 
    "/pengaturan"
  ],
  admin_dapur: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran", 
    "/pengaturan"
  ],
  staff_dapur: [
    "/dashboard", "/menu", "/produksi", "/absensi", "/gudang", "/gudang/stok"
  ],
  driver: [
    "/dashboard", "/distribusi"
  ],
  petugas_gudang: [
    "/dashboard", "/gudang", "/gudang/stok", "/supplier"
  ],
  admin_gudang: [
    "/dashboard", "/gudang", "/gudang/stok", "/supplier"
  ],
  petugas_distribusi: [
    "/dashboard", "/distribusi"
  ],
  petugas_absensi: [
    "/dashboard", "/absensi"
  ],
  keuangan: [
    "/dashboard", "/keuangan", "/keuangan/summary", "/keuangan/anggaran"
  ],
  supervisor: [
    "/dashboard", "/dapur", "/menu", "/produksi", "/absensi", 
    "/gudang", "/gudang/stok", "/supplier", "/distribusi", 
    "/penerima-manfaat", "/keuangan", "/keuangan/summary", "/keuangan/anggaran"
  ]
};

export function hasAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = ROLE_PAGES[role];
  if (!allowed) return false;

  // Exact match or matches a subroute
  return allowed.some(allowedPath => {
    if (path === allowedPath) return true;
    // Example: allowed="/gudang" should match path="/gudang/stok"
    if (allowedPath !== "/" && path.startsWith(allowedPath + "/")) return true;
    return false;
  });
}
