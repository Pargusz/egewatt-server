const axios = require("axios");

const token = "EAATNWZCiYEUMBP5YaGJZCKiKWRHtkymhFDjNtjg7rgZA5bh5O1E5QtivOQTh0npaDZCh6rWHoaeS0YV8ZCbPTHZBoCq4quxfUw85FzAzBEg0l6L8RnfQztCBwZCABdoaK95f9R1oRXZCgxHahZBz8OekOUlZBtZAcStsihRc3PXwmogQs8pocJcZBqVQGjSf6FNOycsVzAR8devsRWJgus9LUUdVUy0kRnZAd5vnxkvCTFBgTa2gvmGX8mVHZAcQmTjAJoZC4oeYZBmw2Nz6xer8cOh9ohiq";
const phoneNumberId = "879402988586322"; // bir sonraki adımda bulacağız
const to = "+905530894570"; // kendi numaran

(async () => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Mesaj gönderildi:", response.data);
  } catch (error) {
    console.error("❌ Hata:", error.response?.data || error.message);
  }
})();
