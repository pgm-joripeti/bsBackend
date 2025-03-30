import express from "express";
import { getUserLeague, assignUserLeague } from "../controllers/leagueController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Haal huidige league op voor student
router.get("/:userId/league", authMiddleware, getUserLeague);

// ✅ Wijs een nieuwe league toe als nodig
router.post("/:userId/assign-league", authMiddleware, assignUserLeague);

export default router;
