const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware");

const router = express.Router();

function parseIntParam(val, fallback) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

// GET /events — paginated event log scoped to the requesting user's repos
router.get("/", authMiddleware, async (req, res) => {
  const page = parseIntParam(req.query.page, 1);
  const limit = Math.min(parseIntParam(req.query.limit, 25), 100);
  const { status, repoFullName } = req.query;

  const userRepos = await db.repo.findMany({ where: { userId: req.userId }, select: { fullName: true } });
  const userRepoNames = userRepos.map((r) => r.fullName);

  const where = { repoFullName: { in: userRepoNames } };
  if (status) where.status = status;
  if (repoFullName) where.repoFullName = repoFullName;

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        deliveryId: true,
        repoFullName: true,
        eventType: true,
        action: true,
        senderLogin: true,
        title: true,
        status: true,
        attempts: true,
        lastError: true,
        receivedAt: true,
        processedAt: true,
      },
    }),
    db.event.count({ where }),
  ]);

  res.json({ events, total, page, limit });
});

// GET /actions — paginated action log scoped to the requesting user's repos
router.get("/actions", authMiddleware, async (req, res) => {
  const page = parseIntParam(req.query.page, 1);
  const limit = Math.min(parseIntParam(req.query.limit, 25), 100);
  const { status, repoFullName } = req.query;

  const userRepos = await db.repo.findMany({ where: { userId: req.userId }, select: { fullName: true } });
  const userRepoNames = userRepos.map((r) => r.fullName);

  const where = { repoFullName: { in: userRepoNames } };
  if (status) where.status = status;
  if (repoFullName) where.repoFullName = repoFullName;

  const [actions, total] = await Promise.all([
    db.actionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        eventId: true,
        ruleId: true,
        repoFullName: true,
        actionType: true,
        status: true,
        detail: true,
        idempotencyKey: true,
        createdAt: true,
        event: {
          select: { eventType: true, title: true, senderLogin: true },
        },
      },
    }),
    db.actionLog.count({ where }),
  ]);

  res.json({ actions, total, page, limit });
});

// GET /events/stats — summary counts for the dashboard stat cards
router.get("/stats", authMiddleware, async (req, res) => {
  const userRepos = await db.repo.findMany({ where: { userId: req.userId }, select: { fullName: true } });
  const userRepoNames = userRepos.map((r) => r.fullName);

  const repoFilter = { repoFullName: { in: userRepoNames } };

  const [totalEvents, failedEvents, totalActions, failedActions, activeRules] = await Promise.all([
    db.event.count({ where: repoFilter }),
    db.event.count({ where: { ...repoFilter, status: "failed" } }),
    db.actionLog.count({ where: repoFilter }),
    db.actionLog.count({ where: { ...repoFilter, status: "failed" } }),
    db.rule.count({ where: { userId: req.userId, enabled: true } }),
  ]);

  res.json({ totalEvents, failedEvents, totalActions, failedActions, activeRules });
});

module.exports = router;
