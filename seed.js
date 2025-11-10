require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashed = await bcrypt.hash("admin123", 10);

    const admin = await User.findOne({ email: "admin@egewatt.com" });
    if (admin) {
      admin.password = hashed;
      admin.role = "admin";
      await admin.save();
      console.log("🔄 Admin şifresi güncellendi:", admin.email);
    } else {
      await User.create({
        username: "admin",
        email: "admin@egewatt.com",
        password: hashed,
        role: "admin",
      });
      console.log("✅ Admin user oluşturuldu: admin@egewatt.com / admin123");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();
