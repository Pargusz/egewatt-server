const express = require("express");
const Subscription = require("../models/Subscription");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Abone numaralarını serno'ya çevir
router.post("/resolve-sernos", authenticate, async (req, res) => {
  try {
    const { subscriptions } = req.body;

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ error: "Abone listesi eksik veya geçersiz" });
    }

    const found = await Subscription.find({
      identifierValue: { $in: subscriptions },
    });

    if (found.length === 0) {
      return res.status(404).json({ error: "Hiçbir abone numarası eşleşmedi" });
    }

    const sernos = found.map((s) => s.subscriptionSerno).filter(Boolean);

    res.json(sernos);
  } catch (err) {
    console.error("resolve-sernos error:", err.message);
    res.status(500).json({ error: "Serno çözümleme hatası" });
  }
});

module.exports = router;