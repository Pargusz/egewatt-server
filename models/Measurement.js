const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema({
  identifierValue: { type: String, required: true }, // abone numarası
  value: { type: Number, required: true },           // ölçüm değeri
  unit: { type: String, default: "kWh" },            // birim
  timestamp: { type: Date, required: true },         // ölçüm zamanı
  source: { type: String },                          // hangi cihazdan geldi

  // 🔽 Yeni alanlar (otomatik uyarı sistemi için)
  type: {
    type: String,
    enum: ["enduktif", "kapasitif", "aktif"],        // ölçüm tipi
    default: "aktif",
  },
  limit: {
    type: Number,                                    // bu ölçüm için izin verilen limit (örnek: endüktif 15, kapasitif 10)
    default: null,
  },
});

module.exports = mongoose.model("Measurement", measurementSchema);
