import express from "express";
import { handleStripeWebhook } from "../controllers/paymentController.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
