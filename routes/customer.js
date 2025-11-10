const express = require("express");
const { authenticate } = require("../middleware/auth");
const Consumption = require("../models/Consumption");
const ArilClient = require("../arilClient");

const router = express.Router();

const client = new ArilClient({
  baseUrl: process.env.ARIL_API_URL,
  userCode: process.env.ARIL_AGENT_USERCODE,
  password: process.env.ARIL_AGENT_PASSWORD,
});

function formatDate(date, endOfDay = false) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${MM}${dd}${endOfDay ? "235959" : "000000"}`;
}

// Günlük tüketim
router.get("/daily/:serno", authenticate, async (req, res) => {
  try {
    const serno = req.params.serno;
    if (!serno) return res.status(400).json({ error: "Serno eksik" });

    const today = new Date();
    //today.setDate(today.getDate() + 1);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(start, false),
      EndDate: formatDate(today, true),
      IncludeLoadProfiles: false,
      OwnerType: 2,
      WithoutMultiplier: false,
      MergeResult: true,
    };

    const response = await client.proxyService("GetOwnerConsumptions", payload);
    
    const consumptions = (response.MergedConsumptions || []).map((c) => ({
      ownerSerno: serno,
      pd: c.Pd,
      cn: c.Cn,
      ri: c.Ri,
      rc: c.Rc,
      gn: c.Gn,
      rio: c.Rio,
      rco: c.Rco,
      ml: c.Ml,
      raw: c,
    }));


    const grouped_by_day = consumptions.reduce((acc, curr) => {
  
  // 1. Tarih anahtarını (dayKey) al
  const day = curr.raw.pd.toString(); // "20251101000000"

  // --- DÜZELTME BURADA ---
  // Date objesi oluşturmak yerine string'i doğrudan formatla:
  const dayKey = `${day.substring(0, 4)}-${day.substring(4, 6)}-${day.substring(6, 8)}`;
  // dayKey şimdi "2025-11-01" (timezone dönüşümü olmadan)
  // --- DÜZELTME BİTTİ ---


  // 2. 'cn' değerini güvenli bir şekilde sayıya çevir
  const currentCn = parseFloat(curr.raw.cn) || 0;

  // 3. Bu günü daha önce gördük mü?
  if (!acc[dayKey]) {
    // ... (kodunuzun geri kalanı aynı) ...
    acc[dayKey] = {
      ...curr,
      pd: dayKey, 
      cn: currentCn 
    };
    delete acc[dayKey].raw; 
  } else {
    acc[dayKey].cn += currentCn;
  }

  return acc;
}, {});
    
    if (consumptions.length > 0) {
      await Consumption.insertMany(consumptions, { ordered: false }).catch(() => {});
    }

    res.json({
      dailyLabels: Object.keys(grouped_by_day),
      dailyValues: Object.values(grouped_by_day).map(item => item.cn),
    });
  } catch (err) {
    console.error("Daily error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

router.get("/monthly/:serno", authenticate, async (req, res) => {
  try {
    const serno = req.params.serno;
    if (!serno) return res.status(400).json({ error: "Serno eksik" });

    const today = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1); // Son 1 yıl verisi alınır

    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(start, false),
      EndDate: formatDate(today, true),
      IncludeLoadProfiles: false,
      OwnerType: 2,
      WithoutMultiplier: false,
      MergeResult: true,
    };

    const response = await client.proxyService("GetOwnerConsumptions", payload);
    const consumptions = (response.MergedConsumptions || []).map((c) => ({
      ownerSerno: serno,
      pd: c.Pd,
      cn: c.Cn,
      ri: c.Ri,
      rc: c.Rc,
      gn: c.Gn,
      rio: c.Rio,
      rco: c.Rco,
      ml: c.Ml,
      raw: c,
    }));

    // --- AYLIK GRUPLAMA ---
    const grouped_by_month = consumptions.reduce((acc, curr) => {
      const day = curr.raw.pd.toString(); // "20251101000000"
      const year = day.substring(0, 4);
      const month = day.substring(4, 6);
      const monthKey = `${year}-${month}`; // "2025-11"

      const currentCn = parseFloat(curr.raw.cn) || 0;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          ...curr,
          pd: monthKey,
          cn: currentCn,
        };
        delete acc[monthKey].raw;
      } else {
        acc[monthKey].cn += currentCn;
      }

      return acc;
    }, {});

    // İstersen yine veritabanına kaydedebilirsin
    if (consumptions.length > 0) {
      await Consumption.insertMany(consumptions, { ordered: false }).catch(() => {});
    }

    res.json({
      monthlyLabels: Object.keys(grouped_by_month), // ["2025-01", "2025-02", ...]
      monthlyValues: Object.values(grouped_by_month).map(item => item.cn),
    });
  } catch (err) {
    console.error("Monthly error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});


router.get("/reactive/:serno", authenticate, async (req, res) => {
  try {
    const serno = req.params.serno;
    if (!serno) return res.status(400).json({ error: "Serno eksik" });

    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(start, false),
      EndDate: formatDate(today, true),
      IncludeLoadProfiles: false,
      OwnerType: 2,
      WithoutMultiplier: false,
      MergeResult: true,
    };

    const response = await client.proxyService("GetOwnerConsumptions", payload);

    const consumptions = (response.MergedConsumptions || []).map((c) => ({
      ownerSerno: serno,
      pd: c.Pd,
      cn: parseFloat(c.Cn) || 0,
      ri: parseFloat(c.Ri) || 0,
      rc: parseFloat(c.Rc) || 0,
      raw: c,
    }));

    // 🔹 Günlük grupla
    const grouped = consumptions.reduce((acc, curr) => {
      const day = curr.raw.pd.toString();
      const key = `${day.substring(0, 4)}-${day.substring(4, 6)}-${day.substring(6, 8)}`;

      if (!acc[key]) {
        acc[key] = { cn: curr.raw.cn, ri: curr.raw.ri, rc: curr.raw.rc };
      } else {
        acc[key].cn += curr.raw.cn;
        acc[key].ri += curr.raw.ri;
        acc[key].rc += curr.raw.rc;
      }

      return acc;
    }, {});

    const labels = Object.keys(grouped);
    const cnValues = labels.map((k) => grouped[k].cn);
    const riValues = labels.map((k) => grouped[k].ri);
    const rcValues = labels.map((k) => grouped[k].rc);

    res.json({
      labels,
      cn: cnValues,
      ri: riValues,
      rc: rcValues,
    });
  } catch (err) {
    console.error("Reactive error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

module.exports = router;