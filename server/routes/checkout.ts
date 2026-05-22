import express from "express";
import { reserveCart, releaseReservation } from "../controllers/checkout";

const router = express.Router();

router.post("/reserve", reserveCart);
router.post("/release", releaseReservation);

export default router;
