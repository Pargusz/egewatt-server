const mongoose = require("mongoose");

const DealerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dealerCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    arilApiUrl: {
      type: String,
      required: false,
      trim: true,
    },
    arilUser: {
      type: String,
      required: false,
      trim: true,
    },
    arilPassword: {
      type: String,
      required: false,
      trim: true,
    },
    // 🔹 İlişkili User kaydı (dealer rolünde)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// 🔒 API yanıtlarında gizlenecek alanlar
DealerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.arilPassword; // Aril bilgisi gizlensin
  delete obj.password; // Bayinin portal şifresi zaten User'da hash'li
  return obj;
};

module.exports = mongoose.model("Dealer", DealerSchema);
