import { Router } from "express";
import { db, bahanBakuTable, stokTable, penerimaanBahanTable, pengeluaranBahanTable, supplierTable, dapurTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// BAHAN BAKU
router.get("/bahan-baku", authMiddleware, async (_req, res) => {
  const list = await db.select().from(bahanBakuTable).orderBy(bahanBakuTable.nama);
  res.json(list.map((b) => ({ ...b, stok_minimum: parseFloat(b.stok_minimum) })));
});

router.post("/bahan-baku", authMiddleware, async (req, res) => {
  const { nama, satuan, stok_minimum, kategori } = req.body;
  if (!nama || !satuan || stok_minimum === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [b] = await db
    .insert(bahanBakuTable)
    .values({ nama, satuan, stok_minimum: String(stok_minimum), kategori })
    .returning();

  // Auto-create stok record with kuantitas=0 so it appears in the stok tab immediately
  await db
    .insert(stokTable)
    .values({ bahan_baku_id: b.id, kuantitas: "0" })
    .onConflictDoNothing();

  res.status(201).json({ ...b, stok_minimum: parseFloat(b.stok_minimum) });
});

router.patch("/bahan-baku/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { nama, satuan, stok_minimum, kategori } = req.body;
  const [b] = await db
    .update(bahanBakuTable)
    .set({ nama, satuan, stok_minimum: stok_minimum ? String(stok_minimum) : undefined, kategori })
    .where(eq(bahanBakuTable.id, id))
    .returning();
  if (!b) { res.status(404).json({ error: "Bahan baku tidak ditemukan" }); return; }
  res.json({ ...b, stok_minimum: parseFloat(b.stok_minimum) });
});

router.delete("/bahan-baku/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  // Also clean up stok record
  await db.delete(stokTable).where(eq(stokTable.bahan_baku_id, id));
  await db.delete(bahanBakuTable).where(eq(bahanBakuTable.id, id));
  res.status(204).end();
});

// STOK
router.get("/stok", authMiddleware, async (req, res) => {
  const stok = await db.select().from(stokTable);
  const bahan = await db.select().from(bahanBakuTable);

  // Ensure every bahan_baku has a stok record (backfill for existing data)
  const missingIds = bahan.filter(b => !stok.find(s => s.bahan_baku_id === b.id)).map(b => b.id);
  if (missingIds.length > 0) {
    for (const id of missingIds) {
      await db.insert(stokTable).values({ bahan_baku_id: id, kuantitas: "0" }).onConflictDoNothing();
    }
    const updatedStok = await db.select().from(stokTable);
    const result = updatedStok.map((s) => {
      const b = bahan.find((x) => x.id === s.bahan_baku_id);
      return {
        ...s,
        bahan_baku_nama: b?.nama ?? "Unknown",
        satuan: b?.satuan ?? "",
        stok_minimum: b ? parseFloat(b.stok_minimum) : 0,
        kuantitas: parseFloat(s.kuantitas),
      };
    });
    res.json(result);
    return;
  }

  const result = stok.map((s) => {
    const b = bahan.find((x) => x.id === s.bahan_baku_id);
    return {
      ...s,
      bahan_baku_nama: b?.nama ?? "Unknown",
      satuan: b?.satuan ?? "",
      stok_minimum: b ? parseFloat(b.stok_minimum) : 0,
      kuantitas: parseFloat(s.kuantitas),
    };
  });
  res.json(result);
});

// Update stok level directly (e.g., manual stock adjustment)
router.patch("/stok/:bahan_baku_id", authMiddleware, async (req, res) => {
  const bahan_baku_id = parseInt(req.params["bahan_baku_id"] as string);
  const { kuantitas } = req.body;
  if (kuantitas === undefined || kuantitas === null) {
    res.status(400).json({ error: "Kuantitas wajib diisi" });
    return;
  }

  // Upsert: update if exists, insert if not
  const existing = await db.select().from(stokTable).where(eq(stokTable.bahan_baku_id, bahan_baku_id)).limit(1);
  if (existing.length > 0) {
    const [s] = await db
      .update(stokTable)
      .set({ kuantitas: String(kuantitas), updated_at: new Date() })
      .where(eq(stokTable.bahan_baku_id, bahan_baku_id))
      .returning();
    res.json({ ...s, kuantitas: parseFloat(s.kuantitas) });
  } else {
    const [s] = await db
      .insert(stokTable)
      .values({ bahan_baku_id, kuantitas: String(kuantitas) })
      .returning();
    res.json({ ...s, kuantitas: parseFloat(s.kuantitas) });
  }
});

router.get("/stok/alerts", authMiddleware, async (_req, res) => {
  const stok = await db.select().from(stokTable);
  const bahan = await db.select().from(bahanBakuTable);
  const alerts = stok
    .filter((s) => {
      const b = bahan.find((x) => x.id === s.bahan_baku_id);
      return b && parseFloat(s.kuantitas) <= parseFloat(b.stok_minimum);
    })
    .map((s) => {
      const b = bahan.find((x) => x.id === s.bahan_baku_id)!;
      return {
        bahan_baku_id: s.bahan_baku_id,
        bahan_baku_nama: b.nama,
        kuantitas: parseFloat(s.kuantitas),
        stok_minimum: parseFloat(b.stok_minimum),
        satuan: b.satuan,
      };
    });
  res.json(alerts);
});

// PENERIMAAN BAHAN
router.get("/penerimaan-bahan", authMiddleware, async (_req, res) => {
  const list = await db.select().from(penerimaanBahanTable).orderBy(penerimaanBahanTable.tanggal);
  const suppliers = await db.select().from(supplierTable);
  res.json(list.map((p) => ({
    ...p,
    supplier_nama: suppliers.find((s) => s.id === p.supplier_id)?.nama ?? null,
  })));
});

router.post("/penerimaan-bahan", authMiddleware, async (req, res) => {
  const { supplier_id, tanggal, catatan, status } = req.body;
  if (!supplier_id || !tanggal) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db
    .insert(penerimaanBahanTable)
    .values({ supplier_id: parseInt(supplier_id), tanggal, catatan, status: status ?? "pending" })
    .returning();

  const supplier = await db.select().from(supplierTable).where(eq(supplierTable.id, parseInt(supplier_id))).limit(1);
  res.status(201).json({ ...p, supplier_nama: supplier[0]?.nama ?? null });
});

// PENGELUARAN BAHAN
router.get("/pengeluaran-bahan", authMiddleware, async (_req, res) => {
  const list = await db.select().from(pengeluaranBahanTable).orderBy(pengeluaranBahanTable.tanggal);
  const dapur = await db.select().from(dapurTable);
  res.json(list.map((p) => ({
    ...p,
    dapur_nama: dapur.find((d) => d.id === p.dapur_id)?.nama ?? null,
  })));
});

router.post("/pengeluaran-bahan", authMiddleware, async (req, res) => {
  const { dapur_id, tanggal, catatan } = req.body;
  if (!dapur_id || !tanggal) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db
    .insert(pengeluaranBahanTable)
    .values({ dapur_id: parseInt(dapur_id), tanggal, catatan })
    .returning();

  const dapur = await db.select().from(dapurTable).where(eq(dapurTable.id, parseInt(dapur_id))).limit(1);
  res.status(201).json({ ...p, dapur_nama: dapur[0]?.nama ?? null });
});

export default router;
