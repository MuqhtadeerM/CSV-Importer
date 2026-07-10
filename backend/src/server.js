require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Simple health check so we can confirm the server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "GrowEasy backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
