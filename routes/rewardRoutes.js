// route voor rewards op rad van fortuin

import express from "express";
import { rewardQbit, rewardXp } from "../controllers/rewardController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/xp', authMiddleware, rewardXp);
router.post('/qbit', authMiddleware, rewardQbit);

export default router;
