const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const authMiddleware = require("../middleware");

const router = express.Router();

// the install URL carries a short-lived signed state so the setup callback
// knows which user this installation belongs to, without needing a session
// cookie shared with github.com
router.get("/install-url", authMiddleware, (req, res) => {
  const state = jwt.sign({ userId: req.userId }, config.JWT_SECRET, { expiresIn: "10m" });
  res.json({ url: `https://github.com/apps/${config.GITHUB_APP_SLUG}/installations/new?state=${state}` });
});

router.get("/", authMiddleware, async (req, res) => {
  const repos = await db.repo.findMany({
    where: { userId: req.userId },
    include: { installation: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    repos.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      active: r.active,
      installedAccount: r.installation.accountLogin,
      createdAt: r.createdAt,
    }))
  );
});

router.post("/:id/toggle", authMiddleware, async (req, res) => {
  const repo = await db.repo.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!repo) return res.status(404).json({ message: "Repo not found" });
  const updated = await db.repo.update({ where: { id: repo.id }, data: { active: !repo.active } });
  res.json({ id: updated.id, active: updated.active });
});

module.exports = router;
