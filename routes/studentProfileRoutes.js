import express from "express";
import { getStudentProfile } from "../controllers/studentProfileController.js";
import { uploadProfilePicture } from "../controllers/teacherProfileController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Voor een leerling kun je eventueel extra logica toevoegen in de controller, bijvoorbeeld op basis van req.user.role
router.get("/", authMiddleware, getStudentProfile);
router.post("/upload-avatar", authMiddleware, upload.single("avatar"), uploadProfilePicture);

export default router;
