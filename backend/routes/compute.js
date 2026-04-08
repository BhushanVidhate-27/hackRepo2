const express = require("express");
const router = express.Router();
const { computeWall } = require("../controllers/heatController");

router.post("/compute", computeWall);

module.exports = router;