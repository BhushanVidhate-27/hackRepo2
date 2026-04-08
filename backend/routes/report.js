const express = require("express");

const router = express.Router();

router.post("/report/json", (req, res) => {
  const payload = req.body ?? null;
  const filename = `thermal-report-${new Date().toISOString().slice(0, 10)}.json`;

  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename=\"${filename}\"`);
  res.status(200).send(JSON.stringify(payload, null, 2));
});

module.exports = router;

