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
    today.setDate(today.getDate() - 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 2);

    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(today, false),
      EndDate: formatDate(today, true),
      EndexDirection: 0,
      DefinitionType: 0
    };

    const yesterdayPayload = {
      OwnerSerno: serno,
      StartDate: formatDate(yesterday, false),
      EndDate: formatDate(yesterday, true),
      EndexDirection: 0,
      DefinitionType: 0
    };

    const response = await client.proxyService("GetCurrentEndexes", payload);
    const yesterdayResponse = await client.proxyService("GetCurrentEndexes", yesterdayPayload);

    const consumptions = (response.ResultList || []).map((c) => ({
      ownerSerno: serno,
      t1: c.T1Endex,
      t2: c.T2Endex,
      t3: c.T3Endex,
      t4: c.T4Endex,
      rc: c.ReactiveCapasitive,
      ri: c.ReactiveInductive,
      tsum: c.TSum,
    }));

    const biggest_tsum = Math.max(...consumptions.map(c => c.tsum || 0));

    

    const yesterdayConsumptions = (yesterdayResponse.ResultList || []).map((c) => ({
      ownerSerno: serno,
      t1: c.T1Endex,
      t2: c.T2Endex,
      t3: c.T3Endex,
      t4: c.T4Endex,
      rc: c.ReactiveCapasitive,
      ri: c.ReactiveInductive,
      tsum: c.TSum,
    }));

    const biggest_yesterday_tsum = Math.max(...yesterdayConsumptions.map(c => c.tsum || 0));
    console.log(`Günlük tüketim için en büyük tsum: ${biggest_tsum}, Dün için en büyük tsum: ${biggest_yesterday_tsum}, Arada fark: ${biggest_tsum - biggest_yesterday_tsum}`);



    /*const consumptions = (response.MergedConsumptions || []).map((c) => ({
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
    
    if (consumptions.length > 0) {
      await Consumption.insertMany(consumptions, { ordered: false }).catch(() => {});
    }*/

    res.json(consumptions);
  } catch (err) {
    console.error("Daily error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

// Aylık tüketim
router.get("/monthly/:serno", authenticate, async (req, res) => {
  try {
    const serno = req.params.serno;
    if (!serno) return res.status(400).json({ error: "Serno eksik" });

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(start, false),
      EndDate: formatDate(end, true),
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
      raw: c,
    }));

    if (consumptions.length > 0) {
      await Consumption.insertMany(consumptions, { ordered: false }).catch(() => {});
    }

    res.json(consumptions);
  } catch (err) {
    console.error("Monthly error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

// Reaktif tüketim
router.get("/reactive/:serno", authenticate, async (req, res) => {
  try {
    const serno = req.params.serno;
    if (!serno) return res.status(400).json({ error: "Serno eksik" });

    const today = new Date();
    const payload = {
      OwnerSerno: serno,
      StartDate: formatDate(today, false),
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
      ri: c.Ri,
      rc: c.Rc,
      raw: c,
    }));

    if (consumptions.length > 0) {
      await Consumption.insertMany(consumptions, { ordered: false }).catch(() => {});
    }

    res.json(consumptions);
  } catch (err) {
    console.error("Reactive error:", err.response?.data || err.message);
    res.status(500).json({ error: "Veri alınamadı" });
  }
});

module.exports = router;