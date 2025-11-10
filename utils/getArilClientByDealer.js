const Dealer = require("../models/Dealer");
const ArilClient = require("../arilClient");

async function getArilClientByDealer(dealerCode) {
  const dealer = await Dealer.findOne({ dealerCode });
  if (!dealer) {
    throw new Error(`❌ Bayi bulunamadı: ${dealerCode}`);
  }

  return new ArilClient({
    baseUrl: dealer.arilApiUrl,
    userCode: dealer.arilUser,
    password: dealer.arilPassword,
  });
}

module.exports = getArilClientByDealer;
