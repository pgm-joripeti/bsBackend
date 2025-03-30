// route voor memes via rad van fortuin

import express from "express";
import { getRandomMeme } from "../controllers/memeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/random', authMiddleware, getRandomMeme);

export default router;