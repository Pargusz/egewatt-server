const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    subscriptionSerno: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    identifierValue: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    meterSerial: {
      type: String,
      default: "",
      trim: true,
    },
    meterBrand: {
      type: String,
      default: "",
      trim: true,
    },
    multiplier: {
      type: Number,
      default: 1,
    },
    lastEndexDate: {
      type: Date,
      default: null,
    },
    raw: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // createdAt + updatedAt otomatik
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);