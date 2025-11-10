const axios = require("axios");
const https = require("https");

class ArilClient {
  constructor({ baseUrl, userCode, password }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.userCode = userCode;
    this.password = password;
    this.token = null;
    this.tokenObtainedAt = null;
    this.tokenTTLSeconds = 20 * 60; // 20 dakika
  }

  /**
   * Token geçerli mi kontrol et, gerekirse yenile
   */
  async ensureToken() {
    if (this.token && this.tokenObtainedAt) {
      const age = (Date.now() - this.tokenObtainedAt) / 1000;
      if (age < this.tokenTTLSeconds - 30) {
        return this.token;
      }
    }
    return this.obtainToken();
  }

  /**
   * Yeni token al
   */
  async obtainToken() {
    const url = `${this.baseUrl}/generate-token`;
    const payload = {
      UserCode: this.userCode,
      Password: this.password,
    };

    try {
      const resp = await axios.put(url, payload, {
        headers: { "Content-Type": "application/json" },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      if (resp.status === 200 || resp.status === 201) {
        const body = resp.data;
        // Token farklı key isimleriyle gelebilir
        const token =
          body?.token || body?.Token || body?.JwtToken || body?.jwt || body;
        if (!token) {
          throw new Error(
            "Token response format unexpected: " + JSON.stringify(body)
          );
        }
        this.token = token;
        this.tokenObtainedAt = Date.now();
        return token;
      }
      throw new Error(
        `Token request failed ${resp.status} ${JSON.stringify(resp.data)}`
      );
    } catch (err) {
      console.error("[ARIL] Token alma hatası:", err.message);
      throw err;
    }
  }

  /**
   * Genel servis çağrısı
   */
  async proxyService(serviceName, payload) {
    await this.ensureToken();
    const url = `${this.baseUrl}/proxy-aril/${serviceName}`;
    const headers = {
      "Content-Type": "application/json",
      "aril-service-token": this.token,
    };

    try {
      console.log(`[ARIL] POST ${serviceName} payload:`, payload);

      const resp = await axios.post(url, payload, {
        headers,
        timeout: 60000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      return resp.data;
    } catch (err) {
      // Token expired ise tekrar dene
      if (err.response && err.response.status === 401) {
        console.warn("[ARIL] Token expired, yeniden alınıyor...");
        await this.obtainToken();
        const retryResp = await axios.post(url, payload, {
          headers: {
            ...headers,
            "aril-service-token": this.token,
          },
          timeout: 60000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
        return retryResp.data;
      }

      console.error(
        `[ARIL] Servis çağrısı hatası (${serviceName}):`,
        err.message
      );
      throw err;
    }
  }
}

module.exports = ArilClient;

