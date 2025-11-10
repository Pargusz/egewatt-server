require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodeCron = require("node-cron");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

// MODELLER
const ArilClient = require("./arilClient");
const Subscription = require("./models/Subscription");
const Consumption = require("./models/Consumption");
const User = require("./models/User");

const app = express();

// ==========================
// 🔹 MIDDLEWARE
// ==========================
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("🌍 Origin gelen istek:", req.headers.origin);
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_ORIGIN || "http://localhost:5173"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ==========================
// 🔹 ENV DEĞİŞKENLERİ
// ==========================
const {
  MONGO_URI,
  ARIL_API_URL,
  ARIL_AGENT_USERCODE,
  ARIL_AGENT_PASSWORD,
  PORT = 3000,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_ID,
  JWT_SECRET,
} = process.env;

if (
  !MONGO_URI ||
  !ARIL_API_URL ||
  !ARIL_AGENT_USERCODE ||
  !ARIL_AGENT_PASSWORD ||
  !WHATSAPP_TOKEN ||
  !WHATSAPP_PHONE_ID ||
  !JWT_SECRET
) {
  console.error("❌ Eksik .env değişkenleri! Lütfen gerekli alanları kontrol et.");
  process.exit(1);
}

// ==========================
// 🔹 MONGO BAĞLANTISI
// ==========================
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => {
    console.error("❌ Mongo bağlantı hatası:", err);
    process.exit(1);
  });

// ==========================
// 🔹 ARIL CLIENT
// ==========================
const aril = new ArilClient({
  baseUrl: ARIL_API_URL,
  userCode: ARIL_AGENT_USERCODE,
  password: ARIL_AGENT_PASSWORD,
});

// ==========================
// 🔹 WHATSAPP MESAJ GÖNDERME
// ==========================
async function sendWhatsAppMessage(phone, text) {
  try {
    if (!phone) throw new Error("Telefon numarası eksik!");
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`;

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" },
      },
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`📩 ${cleanPhone} numarasına WhatsApp template mesajı gönderildi.`);
    return response.data;
  } catch (err) {
    console.error("❌ WhatsApp mesaj hatası:", err.response?.data || err.message);
  }
}

// ==========================
// 🔹 TEST ENDPOINT
// ==========================
app.get("/api/test-whatsapp", async (req, res) => {
  try {
    const phone = req.query.phone || "+905530894570";
    await sendWhatsAppMessage(phone, "✅ WhatsApp API bağlantısı başarılı!");
    res.json({ ok: true, to: phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// 🔹 ROUTES (API prefix)
// ==========================
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const customerRoutes = require("./routes/customer");
const sernoRoutes = require("./routes/serno");
const dealerRoutes = require("./routes/dealer");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/dealer", dealerRoutes);
app.use("/api", sernoRoutes);

// ==========================
// 🔹 ARIL PROFİLLERİ ROUTE
// ==========================
app.get("/api/aril/profiles", (req, res) => {
  const profiles = [
    {
      id: "1",
      name: "Egewatt",
      url: process.env.ARIL_API_URL_1,
      user: process.env.ARIL_API_USER_1,
      pass: process.env.ARIL_API_PASS_1,
    },
    {
      id: "2",
      name: "Seçkin Kalıp",
      url: process.env.ARIL_API_URL_2,
      user: process.env.ARIL_API_USER_2,
      pass: process.env.ARIL_API_PASS_2,
    },
  ];

  const filtered = profiles.filter(p => p.url && p.user && p.pass);
  res.json({ ok: true, profiles: filtered });
});

// ==========================
// 🔹 SERVER BAŞLAT
// ==========================
app.listen(PORT, () =>
  console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`)
);
