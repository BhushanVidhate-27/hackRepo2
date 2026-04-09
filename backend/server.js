const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const computeRoute   = require("./routes/compute.js");
const materialsRoute = require("./routes/materials.js");
const reportRoute = require("./routes/report.js");
const stateRoute = require("./routes/state.js");

const port = Number(process.env.PORT) || 8080;

// Reflect request Origin — avoids CORS callback edge cases that surface as HTTP 500.
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", computeRoute);
app.use("/api", materialsRoute);
app.use("/api", reportRoute);
app.use("/api", stateRoute);

app.get("/", (req, res)=>{
    res.send("backend running");
});

app.use((err, req, res, next) => {
  const status = typeof err?.status === "number" ? err.status : 500;
  if (res.headersSent) return next(err);
  res.status(status).json({ error: err?.message || "Internal Server Error" });
});

const server = app.listen(port, ()=>{
    console.log(`app working on ${port}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the other process or set PORT to a free port.`);
    process.exit(1);
  }
  throw err;
});

module.exports = app;
