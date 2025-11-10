function requireRole(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Önce giriş yapmalısınız." });
    }

    const userRole = req.user.role?.toLowerCase();

    // Superadmin her şeye erişebilir
    if (userRole === "superadmin") {
      return next();
    }

    // Tek rol gönderildiyse array'e çevir
    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles.map((r) => r.toLowerCase())
      : [requiredRoles.toLowerCase()];

    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    next();
  };
}

module.exports = { requireRole };
