// utils/sendWhatsAppMessage.js
const axios = require("axios");

const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID } = process.env;

async function sendWhatsAppMessage(to, message) {
  try {
    const formattedNumber = to.startsWith("+") ? to : `+${to}`;

    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📩 ${formattedNumber} numarasına mesaj gönderildi.`);
    return response.data;
  } catch (err) {
    console.error("❌ WhatsApp gönderim hatası:", err.response?.data || err.message);
  }
}

module.exports = sendWhatsAppMessage;
