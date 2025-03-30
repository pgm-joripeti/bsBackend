import express from "express";
import { getStudentLeaderboard, getStudentRanking } from "../controllers/studentLeaderboardController.js" 
import authMiddleware_for_quiz_edit from "../middlewares/authMiddleware_for_quiz_edit.js";

const router = express.Router();

// leaderboard voor students
router.get("/", authMiddleware_for_quiz_edit, getStudentLeaderboard);
router.get("/ranking", authMiddleware_for_quiz_edit, getStudentRanking);

export default router;