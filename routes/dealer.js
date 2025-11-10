// routes/dealer.js
const express = require("express");
const Dealer = require("../models/Dealer");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const router = express.Router();

/**
 * 🧩 BAYİ OLUŞTUR
 */
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      dealerCode,
      email,
      password,
      arilApiUrl,
      arilUser,
      arilPassword,
    } = req.body;

    if (!name || !dealerCode || !email || !password) {
      return res.status(400).json({ error: "Lütfen tüm zorunlu alanları doldurun." });
    }

    const existingDealer = await Dealer.findOne({ $or: [{ email }, { dealerCode }] });
    const existingUser = await User.findOne({ email });
    if (existingDealer || existingUser) {
      return res.status(400).json({ error: "Bu e-posta veya bayi kodu zaten kayıtlı." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: name,
      email,
      password: hashedPassword,
      role: "dealer",
      phone: "+900000000000",
      subscriptions: [],
    });

    const dealer = await Dealer.create({
      name,
      dealerCode,
      email,
      password: hashedPassword,
      arilApiUrl,
      arilUser,
      arilPassword,
      user: user._id,
    });

    user.dealer = dealer._id;
    await user.save();

    res.json({
      ok: true,
      message: "✅ Bayi başarıyla oluşturuldu.",
      dealer,
    });
  } catch (err) {
    console.error("Dealer create error:", err);
    res.status(500).json({ error: "❌ Bayi oluşturulamadı." });
  }
});

/**
 * 📋 TÜM BAYİLERİ LİSTELE
 */
router.get("/list", async (req, res) => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });
    res.json({ ok: true, dealers });
  } catch (err) {
    console.error("Dealer list error:", err);
    res.status(500).json({ error: "Bayi listesi alınamadı." });
  }
});

/**
 * 🗑️ BAYİ SİL
 */
router.delete("/delete/:id", async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) return res.status(404).json({ error: "Bayi bulunamadı." });

    await User.findOneAndDelete({ email: dealer.email });
    await Dealer.findByIdAndDelete(req.params.id);

    res.json({ ok: true, message: "🗑️ Bayi başarıyla silindi." });
  } catch (err) {
    console.error("Dealer delete error:", err);
    res.status(500).json({ error: "Bayi silinemedi." });
  }
});

// 🔹 ÖNEMLİ: CommonJS export
module.exports = router;
