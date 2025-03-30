import express from "express";
import { getTeacherQuizzes, deleteQuiz } from "../controllers/teacherQuizController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getTeacherQuizzes);
router.delete("/:quizId", authMiddleware, deleteQuiz);

export default router;
