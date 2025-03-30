import express from "express";
import multer from "multer";
import { 
    getQuizzesForStudent, 
    getTeacherQuizzes,
    getQuizQuestions, 
    submitAnswer,
    finishQuiz,
    getQuizResults,
    getQuizById,
    updateQuiz, 
    deleteQuiz 
} from "../controllers/quizController.js";
import { createQuiz } from "../controllers/createQuizController.js";
import { getAiTip } from "../controllers/aiController.js";
import { uploadImageToSupabase } from "../controllers/uploadController.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";
import authMiddleware_for_quiz_edit from "../middlewares/authMiddleware_for_quiz_edit.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Routes voor leerlingen (zien alleen quizzen die relevant zijn voor hun richting)
router.get("/student", authMiddleware, getQuizzesForStudent);

// 🔹 Routes voor leerkrachten (zien enkel hun eigen quizzen)
router.get("/teacher", authMiddleware, getTeacherQuizzes);

// 🔹 Quiz aanmaken 
router.post("/", authMiddleware, createQuiz); 

// 🔹 Quizvragen ophalen
router.get("/:quizId/questions", authMiddleware, getQuizQuestions);

// 🔹 Antwoord indienen voor een vraag
router.post("/:quizId/answer", authMiddleware, submitAnswer);

// 🔹 Quiz voltooien en opslaan in quiz_results
router.post("/:quizId/finish", authMiddleware, finishQuiz); 

// Quiz resultaten bij beëindigen quiz ophalen om weer te geven
router.get("/quiz_results/:quizId", authMiddleware, getQuizResults);

// Haal quiz op op basis van id zodat we deze kunnen bewerken in frontend: initEditQuiz.js
router.get("/:id", authMiddleware_for_quiz_edit, getQuizById);

// Quiz updaten
router.put("/:id", authMiddleware, updateQuiz);

// Quiz updaten
router.delete("/:id", authMiddleware, deleteQuiz);

// ✅ AI Tip ophalen
router.post("/ai-tip", authMiddleware, getAiTip);

// image uploaden voor quiz
router.post("/upload", upload.single("file"), uploadImageToSupabase);

export default router;
