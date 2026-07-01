const express = require("express");
const { z } = require("zod");
const db = require("../db");
const authMiddleware = require("../middleware");

const router = express.Router();

const ruleSchema = z.object({
  name: z.string().min(1),
  eventType: z.enum(["issues", "pull_request", "push"]),
  matchField: z.enum(["title", "body", "author", "label"]),
  matchType: z.enum(["contains", "equals", "regex"]),
  matchValue: z.string(),
  addLabel: z.boolean().default(false),
  labelName: z.string().optional().nullable(),
  comment: z.boolean().default(false),
  commentBody: z.string().optional().nullable(),
  slackNotify: z.boolean().default(true),
  enabled: z.boolean().default(true),
  repoId: z.string().optional().nullable(),
});

router.get("/", authMiddleware, async (req, res) => {
  const { repoId } = req.query;
  const where = { userId: req.userId };
  if (repoId) where.repoId = repoId;

  const rules = await db.rule.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(rules);
});

router.post("/", authMiddleware, async (req, res) => {
  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid rule", errors: parsed.error.flatten() });

  const data = parsed.data;

  if (data.repoId) {
    const repo = await db.repo.findFirst({ where: { id: data.repoId, userId: req.userId } });
    if (!repo) return res.status(404).json({ message: "Repo not found" });
  }

  const rule = await db.rule.create({ data: { ...data, userId: req.userId } });
  res.status(201).json(rule);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const existing = await db.rule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ message: "Rule not found" });

  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid rule", errors: parsed.error.flatten() });

  const rule = await db.rule.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(rule);
});

router.patch("/:id/toggle", authMiddleware, async (req, res) => {
  const existing = await db.rule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ message: "Rule not found" });

  const rule = await db.rule.update({ where: { id: req.params.id }, data: { enabled: !existing.enabled } });
  res.json({ id: rule.id, enabled: rule.enabled });
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const existing = await db.rule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ message: "Rule not found" });

  await db.rule.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
