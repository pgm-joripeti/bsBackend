import express from "express";
import { getPrograms, getGrades, getSubjects } from "../controllers/dropdownController.js";

const router = express.Router();

router.get("/programs", getPrograms);
router.get("/grades", getGrades);
router.get("/subjects", getSubjects);

export default router;
