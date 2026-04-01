const express = require("express");

const app = express();

app.get("/", (req, res) => {
  console.log("REQUEST OK");
  res.send("API OK 🚀");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});