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
  await db.delete(bahanBakuTable).where(eq(bahanBakuTable.id, id));
  res.status(204).end();
});

// STOK
router.get("/stok", authMiddleware, async (req, res) => {
  const stok = await db.select().from(stokTable);
  const bahan = await db.select().from(bahanBakuTable);
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
  const { supplier_id, tanggal, catatan } = req.body;
  if (!supplier_id || !tanggal) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db
    .insert(penerimaanBahanTable)
    .values({ supplier_id: parseInt(supplier_id), tanggal, catatan })
    .returning();
  res.status(201).json({ ...p, supplier_nama: null });
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
  res.status(201).json({ ...p, dapur_nama: null });
});

export default router;
