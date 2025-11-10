// backend/routes/arilRoutes.js
import express from "express";
import profiles from "../config/arilProfiles.js";

const router = express.Router();

// ARIL profillerini döndür
router.get("/profiles", (req, res) => {
  return res.json({ ok: true, profiles });
});

export default router;
