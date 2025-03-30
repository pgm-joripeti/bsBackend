import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// **Route om loginpagina te tonen**
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/pages/login.html"));
});

// **Route voor de registratiepagina**
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/pages/register.html"));
});

export default router;
