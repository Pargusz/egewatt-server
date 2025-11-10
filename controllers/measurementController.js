const moment = require("moment");
const Measurement = require("../models/Measurement");

// Bugün sorgulandığında aslında DÜNÜN verisi dönecek
exports.getDailyData = async (req, res) => {
  try {
    const { subscriptions } = req.body;

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ error: "Abone listesi eksik" });
    }

    const yesterdayStart = moment().subtract(1, "day").startOf("day").toDate();
    const yesterdayEnd = moment().subtract(1, "day").endOf("day").toDate();

    const data = await Measurement.find({
      ownerSerno: { $in: subscriptions.map(Number) },
      timestamp: { $gte: yesterdayStart, $lte: yesterdayEnd },
    });

    res.json(data);
  } catch (err) {
    console.error("getDailyData error:", err.message);
    res.status(500).json({ error: "Günlük veri alınamadı" });
  }
};

// Bu ay sorgulandığında GEÇEN AYIN verisi dönecek
exports.getMonthlyData = async (req, res) => {
  try {
    const { subscriptions } = req.body;

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ error: "Abone listesi eksik" });
    }

    const lastMonthStart = moment().subtract(1, "month").startOf("month").toDate();
    const lastMonthEnd = moment().subtract(1, "month").endOf("month").toDate();

    const data = await Measurement.find({
      ownerSerno: { $in: subscriptions.map(Number) },
      timestamp: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    res.json(data);
  } catch (err) {
    console.error("getMonthlyData error:", err.message);
    res.status(500).json({ error: "Aylık veri alınamadı" });
  }
};