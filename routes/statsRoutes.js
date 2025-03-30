import express from "express";
import { getTeacherStats } from "../controllers/teacherStatsController.js";
import { getGlobalStats } from "../controllers/globalStatsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Route voor leerkracht statistieken
router.get("/teacher", authMiddleware, getTeacherStats);

// ✅ Route voor algemene statistieken
router.get("/global", authMiddleware, getGlobalStats);

router.get("/test", (req, res) => {
    console.log("📡 API test werkt!");
    res.json({ message: "API test werkt!" });
});


export default router;
