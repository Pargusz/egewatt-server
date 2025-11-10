const nodeCron = require("node-cron");
const User = require("../models/User");
const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");

nodeCron.schedule("0 9 * * *", async () => {
  // Her sabah 09:00’da kontrol
  console.log("🔁 Abonelik yenileme kontrolü başlatıldı...");

  const users = await User.find({});
  const now = new Date();

  for (const user of users) {
    if (!user.createdAt || !user.phone) continue;

    const registered = new Date(user.createdAt);
    const diffMonths =
      (now.getFullYear() - registered.getFullYear()) * 12 +
      (now.getMonth() - registered.getMonth());

    if (diffMonths === 11) {
      await sendWhatsAppMessage(
        user.phone,
        `🕒 Merhaba ${user.username}, abonelik süreniz dolmak üzere.  
Yenileme işlemini tamamlamayı unutmayın.  
— Egewatt Destek Ekibi`
      );
      console.log(`📅 ${user.username} için yenileme hatırlatması gönderildi.`);
    }
  }
});
