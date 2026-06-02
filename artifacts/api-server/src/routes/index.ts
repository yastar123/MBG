import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import dapurRouter from "./dapur";
import menuRouter from "./menu";
import produksiRouter from "./produksi";
import absensiRouter from "./absensi";
import gudangRouter from "./gudang";
import supplierRouter from "./supplier";
import pengirimanRouter from "./pengiriman";
import penerimaManfaatRouter from "./penerima_manfaat";
import keuanganRouter from "./keuangan";
import dashboardRouter from "./dashboard";
import notifikasiRouter from "./notifikasi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(dapurRouter);
router.use(menuRouter);
router.use(produksiRouter);
router.use(absensiRouter);
router.use(gudangRouter);
router.use(supplierRouter);
router.use(pengirimanRouter);
router.use(penerimaManfaatRouter);
router.use(keuanganRouter);
router.use(dashboardRouter);
router.use(notifikasiRouter);

export default router;
