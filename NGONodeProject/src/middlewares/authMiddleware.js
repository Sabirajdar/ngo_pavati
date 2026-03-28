const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/");
  }

  try {
    const user = jwt.verify(token, "11$$$66&&&&4444");
    req.user = user;
     res.set("Cache-Control", "no-store");
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.redirect("/");
  }
}

module.exports = authenticateToken;