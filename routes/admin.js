const express = require("express");
const User = require("../models/User");
const Dealer = require("../models/Dealer");
const Subscription = require("../models/Subscription");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

// ===================================================
// 🔹 ADMIN — Yeni müşteri oluştur
// ===================================================
router.post("/create-customer", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { username, email, password, subscriptions, phone } = req.body;

    if (!username || !email || !password || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ error: "Eksik veya geçersiz bilgi gönderildi." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Bu email zaten kayıtlı." });
    }

    const foundSubs = await Subscription.find({
      identifierValue: { $in: subscriptions },
    });

    if (foundSubs.length === 0) {
      return res.status(404).json({ error: "Geçerli abone numarası bulunamadı." });
    }

    const adminUser = await User.findById(req.user.id);

    let dealerRef = null;
    let dealerCode = adminUser?.dealerCode || "EGEWATT";

    if (dealerCode) {
      const foundDealer = await Dealer.findOne({ dealerCode });
      if (foundDealer) {
        dealerRef = foundDealer._id;
      }
    }

    const newUser = new User({
      username,
      email,
      password,
      phone,
      subscriptions,
      dealerCode,
      dealer: dealerRef,
      role: "customer", // 🔹 rolü net belirtiyoruz
    });

    await newUser.save();

    res.json({
      ok: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        subscriptions: newUser.subscriptions,
        dealerCode: newUser.dealerCode,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("❌ create-customer error:", err);
    res.status(500).json({ error: "Sunucu hatası", details: err.message });
  }
});

// ===================================================
// 🔹 ADMIN — Müşteri listesi (User koleksiyonundan doğrudan)
// ===================================================
router.get("/list-customers", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    const isSuperAdmin = adminUser.role && adminUser.role.toLowerCase() === "superadmin";

    // 🔹 Filtreyi belirle (superadmin tümünü görür, diğer admin sadece kendi bayisini)
    const filter = {
      role: { $in: ["customer", "Customer"] },
      ...(isSuperAdmin ? {} : { dealerCode: adminUser.dealerCode }),
    };

    // 🔹 Kullanıcıları çek
    const customers = await User.find(filter)
      .select("-password")
      .populate("dealer", "name dealerCode")
      .sort({ createdAt: -1 }); // en yeni en üstte

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (err) {
    console.error("❌ list-customers error:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası", details: err.message });
  }
});

module.exports = router;
