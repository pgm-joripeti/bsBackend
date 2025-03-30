// route om avatar up te loaden

import express from "express";
import { uploadAvatar } from "../controllers/avatarController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// 🔹 Multer configuratie: slaat bestand op in geheugen
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
op

router.post("/upload", authMiddleware, upload.single("avatar"), uploadAvatar);

export default router;
