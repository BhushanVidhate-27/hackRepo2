const validateHeatInput = (req, res, next) => {
  const { layers, boundary, area } = req.body;

  if (!layers || !Array.isArray(layers) || layers.length === 0) {
    return res.status(400).json({ error: "Layers must be a non-empty array" });
  }

  for (let layer of layers) {
    if (typeof layer.thickness !== "number" || layer.thickness <= 0) {
      return res.status(400).json({ error: "Invalid layer thickness" });
    }

    if (!layer.k && !layer.material) {
      return res.status(400).json({ error: "Material or k required" });
    }
  }

  if (!boundary) {
    return res.status(400).json({ error: "Boundary conditions missing" });
  }

  const { T_left, T_inf, h } = boundary;

  if (T_left == null || T_inf == null || h == null) {
    return res.status(400).json({ error: "Boundary values missing" });
  }

  if (typeof T_left !== "number" || typeof T_inf !== "number") {
    return res.status(400).json({ error: "Invalid temperature values" });
  }

  if (typeof h !== "number" || h <= 0) {
    return res.status(400).json({ error: "Invalid convection coefficient" });
  }

  if (area && (typeof area !== "number" || area <= 0)) {
    return res.status(400).json({ error: "Invalid area" });
  }

  next();
};

module.exports = { validateHeatInput };
