import express from "express";
import { register, login, getUserRole } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requestPasswordReset } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/role", authMiddleware, getUserRole);
router.post("/reset-password", requestPasswordReset);


export default router;
