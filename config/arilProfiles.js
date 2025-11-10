// backend/config/arilProfiles.js
import dotenv from "dotenv";
dotenv.config();

const profiles = [
  {
    id: "1",
    name: "Egewatt",
    url: process.env.ARIL_API_URL_1,
    user: process.env.ARIL_API_USER_1,
    pass: process.env.ARIL_API_PASS_1,
  },
  {
    id: "2",
    name: "Seçkin Kalıp",
    url: process.env.ARIL_API_URL_2,
    user: process.env.ARIL_API_USER_2,
    pass: process.env.ARIL_API_PASS_2,
  },
];

export default profiles;
