import { Router } from "express";
import { getAvailability } from "../controllers/availabilityController";

const router = Router();

router.get("/", getAvailability);

export default router;