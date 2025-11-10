const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");

const router = express.Router();

// -------------------------
// LOGIN (müşteri + bayi + admin)
// -------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });

    // Şifre kontrolü (User modelindeki comparePassword metodu ile)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Geçersiz şifre" });

    // JWT token oluştur
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // 🔹 Burada artık dealer, admin veya customer olabilir
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Geriye kullanıcı bilgilerini döndür
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptions: user.subscriptions || [],
        phone: user.phone || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// -------------------------
// REGISTER (müşteri + bayi kaydı)
// -------------------------
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      subscriptions = [],
      role = "customer", // 🔹 default olarak normal müşteri
    } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Bu e-posta zaten kayıtlı" });

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username,
      email,
      password,
      phone,
      subscriptions,
      role, // 🔹 admin, dealer veya customer olabilir
    });

    await newUser.save();

    // ✅ WhatsApp mesajı gönderimi
    if (phone) {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const message = `👋 Merhaba ${username}!
      
Egewatt sistemine kaydınız başarıyla oluşturuldu ✅

📧 E-posta: ${email}
🔑 Şifre: ${password}
🎭 Rol: ${role.toUpperCase()}

Sisteme giriş için:
🌐 https://egewatt.com/

— Egewatt Destek Ekibi ⚡`;

      try {
        await sendWhatsAppMessage(formattedPhone, message);
        console.log(`📩 ${formattedPhone} numarasına kayıt mesajı gönderildi.`);
      } catch (msgErr) {
        console.error("WhatsApp gönderim hatası:", msgErr);
      }
    }

    res.status(201).json({
      message: "Kullanıcı başarıyla oluşturuldu",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        subscriptions: newUser.subscriptions,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
