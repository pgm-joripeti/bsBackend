import express from "express";
import multer from "multer";
import { uploadImageToSupabase } from "../controllers/uploadController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadImageToSupabase);

export default router;
