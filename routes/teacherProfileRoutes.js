import express from "express";
import { getTeacherProfile, uploadProfilePicture } from "../controllers/teacherProfileController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authMiddleware, getTeacherProfile);
router.post("/upload-avatar", authMiddleware, upload.single("avatar"), uploadProfilePicture);

export default router;
