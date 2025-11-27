import { Router } from "express";
import { getLogs } from "../controllers/logController";
import { authMiddleware } from "../middleware/authMiddleware"; // admin auth

const router = Router();

/**
 * Admin-only logs route
 * Example: GET /api/logs?page=1&limit=50&module=auth&action=USER_LOGIN
 */
router.get("/", authMiddleware, getLogs);

export default router;
