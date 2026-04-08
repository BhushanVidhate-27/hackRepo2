const express = require("express");
const router = express.Router();
const materials = require("../config/materials.config");

router.get("/materials", (req, res) => {
  res.json(materials);
});

module.exports = router;
