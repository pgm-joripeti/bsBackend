import express from "express";
import { getTeacherLeaderboard } from "../controllers/teacherLeaderboardController.js" 
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// leaderboard voor teachers
router.get("/", authMiddleware, getTeacherLeaderboard);

export default router;