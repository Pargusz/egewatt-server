const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Token bulunamadı" });
  }

  // "Bearer <token>" formatını parçala
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token geçersiz" });
  }

  try {
    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcı bilgilerini req.user içine koy
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      serno: decoded.serno,
      role: decoded.role, // 🔑 kritik: role bilgisini taşıyoruz
    };

    next();
  } catch (err) {
    console.error("[AUTH] Token doğrulama hatası:", err.message);
    return res
      .status(403)
      .json({ error: "Token geçersiz veya süresi dolmuş" });
  }
}

module.exports = { authenticate };
