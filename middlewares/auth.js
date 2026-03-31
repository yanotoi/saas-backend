const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware para rutas protegidas
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("Token requerido");

  const token = authHeader.split(" ")[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // agregamos info del usuario al request
    next();
  } catch (err) {
    return res.status(401).send("Token inválido");
  }
}

module.exports = authMiddleware;