const mongoose = require("mongoose");
const { Schema } = mongoose;

const ConsumptionSchema = new Schema(
  {
    ownerSerno: {
      type: Number,
      index: true,
      required: true,
    },

    // ARİL’den gelen temel değerler
    pd: { type: Number, required: true }, // tarih (yyyyMMddHHmmss)
    cn: { type: Number, default: null },  // aktif tüketim (kWh)
    ri: { type: Number, default: null },  // endüktif (kVArh)
    rc: { type: Number, default: null },  // kapasitif (kVArh)

    // opsiyonel diğer alanlar
    gn: { type: Number, default: null },
    rio: { type: Number, default: null },
    rco: { type: Number, default: null },
    ml: { type: Number, default: null },

    // orijinal ARİL cevabı
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true } // createdAt + updatedAt otomatik
);

module.exports = mongoose.model("Consumption", ConsumptionSchema);