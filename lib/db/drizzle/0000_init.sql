CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'staff_dapur' NOT NULL,
	"dapur_id" integer,
	"no_hp" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dapur" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"lokasi" text NOT NULL,
	"alamat" text,
	"kapasitas_porsi" integer DEFAULT 0 NOT NULL,
	"kepala_dapur_id" integer,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text,
	"tanggal" date NOT NULL,
	"kategori" text DEFAULT 'makan_siang' NOT NULL,
	"target_porsi" integer DEFAULT 0 NOT NULL,
	"kalori" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produksi" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"menu_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"target_porsi" integer DEFAULT 0 NOT NULL,
	"realisasi_porsi" integer,
	"status" text DEFAULT 'dijadwalkan' NOT NULL,
	"catatan_qc" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absensi" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"status" text DEFAULT 'hadir' NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bahan_baku" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"satuan" text NOT NULL,
	"stok_minimum" numeric DEFAULT '0' NOT NULL,
	"kategori" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stok" (
	"id" serial PRIMARY KEY NOT NULL,
	"bahan_baku_id" integer NOT NULL,
	"kuantitas" numeric DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stok_bahan_baku_id_unique" UNIQUE("bahan_baku_id")
);
--> statement-breakpoint
CREATE TABLE "supplier" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"kontak" text NOT NULL,
	"email" text,
	"alamat" text,
	"kategori_bahan" text,
	"rating" numeric,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penerimaan_bahan" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"total_item" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengeluaran_bahan" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"total_item" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengiriman" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"driver_id" integer,
	"tanggal" date NOT NULL,
	"jumlah_porsi" integer DEFAULT 0 NOT NULL,
	"tujuan" text NOT NULL,
	"status" text DEFAULT 'dijadwalkan' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penerima_manfaat" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"sekolah" text NOT NULL,
	"kelas" text NOT NULL,
	"wilayah" text NOT NULL,
	"is_aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifikasi_penerimaan" (
	"id" serial PRIMARY KEY NOT NULL,
	"penerima_manfaat_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"status" text DEFAULT 'hadir' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anggaran" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"periode" text NOT NULL,
	"total_anggaran" numeric DEFAULT '0' NOT NULL,
	"anggaran_per_porsi" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "realisasi" (
	"id" serial PRIMARY KEY NOT NULL,
	"dapur_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"kategori" text NOT NULL,
	"jumlah" numeric DEFAULT '0' NOT NULL,
	"deskripsi" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifikasi" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"pesan" text NOT NULL,
	"tipe" text DEFAULT 'info' NOT NULL,
	"is_dibaca" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
