import express from "express";
import { getQbitBalance } from "../controllers/studentQbitsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/", authMiddleware, getQbitBalance);

export default router;
