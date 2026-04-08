const { computeWallService } = require("../services/heatService");

const computeWall = (req, res) => {
  try {
    const result = computeWallService(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { computeWall };