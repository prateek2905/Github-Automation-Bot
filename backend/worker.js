const db = require("./db");
const logger = require("./lib/logger");
const { matchRule } = require("./lib/rules");
const { addLabel, postComment, syncInstallation } = require("./lib/github");
const { postSlack } = require("./lib/slack");

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 5;
const INSTALLATION_EVENTS = ["installation", "installation_repositories"];

function backoffMs(attempts) {
  return Math.min(60_000, 2 ** attempts * 1000);
}

function buildSlackMessage(event, rule, repo) {
  const payload = event.payload;
  const item = event.eventType === "pull_request" ? payload.pull_request : payload.issue;
  const title = item?.title || event.title || "(no title)";
  const url = item?.html_url || payload.repository?.html_url || "";
  return `*${rule.name}* matched on ${repo.fullName}\n${event.eventType} — "${title}"\n${url}`.trim();
}

// idempotencyKey is checked before running, so a retried event never repeats
// an action that already succeeded (e.g. a label already added stays added)
async function ensureAction(eventId, ruleId, repoFullName, actionType, idempotencyKey, fn) {
  const existing = await db.actionLog.findUnique({ where: { idempotencyKey } });
  if (existing && existing.status === "success") return true;

  try {
    await fn();
    await db.actionLog.upsert({
      where: { idempotencyKey },
      update: { status: "success", detail: null },
      create: { eventId, ruleId, repoFullName, actionType, status: "success", idempotencyKey },
    });
    return true;
  } catch (err) {
    logger.error({ err, actionType, idempotencyKey }, "action failed");
    await db.actionLog.upsert({
      where: { idempotencyKey },
      update: { status: "failed", detail: String(err.message || err) },
      create: {
        eventId,
        ruleId,
        repoFullName,
        actionType,
        status: "failed",
        detail: String(err.message || err),
        idempotencyKey,
      },
    });
    return false;
  }
}

async function processInstallationEvent(event) {
  const payload = event.payload;
  try {
    if (event.eventType === "installation" && payload.action === "deleted") {
      await db.installation.deleteMany({ where: { githubInstallationId: BigInt(payload.installation.id) } });
      return true;
    }
    const existing = await db.installation.findUnique({
      where: { githubInstallationId: BigInt(payload.installation.id) },
    });
    if (existing) await syncInstallation(payload.installation.id, existing.userId);
    return true;
  } catch (err) {
    logger.error({ err }, "failed to sync installation");
    return false;
  }
}

async function processRuleEvent(event) {
  const payload = event.payload;
  if (!payload.repository) return true;

  const repo = await db.repo.findUnique({
    where: { githubRepoId: BigInt(payload.repository.id) },
    include: { installation: true },
  });
  if (!repo || !repo.active) return true;

  const rules = await db.rule.findMany({
    where: {
      enabled: true,
      eventType: event.eventType,
      userId: repo.userId,
      OR: [{ repoId: repo.id }, { repoId: null }],
    },
  });

  const [owner, repoName] = repo.fullName.split("/");
  const issueNumber = payload.issue?.number || payload.pull_request?.number;
  const ghInstallationId = Number(repo.installation.githubInstallationId);

  let allOk = true;
  for (const rule of rules) {
    if (!matchRule(rule, event)) continue;

    if (rule.addLabel && rule.labelName && issueNumber) {
      const ok = await ensureAction(
        event.id,
        rule.id,
        repo.fullName,
        "label",
        `${event.id}:${rule.id}:label`,
        () => addLabel(ghInstallationId, owner, repoName, issueNumber, rule.labelName)
      );
      allOk = allOk && ok;
    }

    if (rule.comment && rule.commentBody && issueNumber) {
      const ok = await ensureAction(
        event.id,
        rule.id,
        repo.fullName,
        "comment",
        `${event.id}:${rule.id}:comment`,
        () => postComment(ghInstallationId, owner, repoName, issueNumber, rule.commentBody)
      );
      allOk = allOk && ok;
    }

    if (rule.slackNotify) {
      const ok = await ensureAction(
        event.id,
        rule.id,
        repo.fullName,
        "slack",
        `${event.id}:${rule.id}:slack`,
        () => postSlack(buildSlackMessage(event, rule, repo))
      );
      allOk = allOk && ok;
    }
  }

  return allOk;
}

async function processEvent(event) {
  await db.event.update({ where: { id: event.id }, data: { status: "processing" } });

  let ok;
  try {
    ok = INSTALLATION_EVENTS.includes(event.eventType)
      ? await processInstallationEvent(event)
      : await processRuleEvent(event);
  } catch (err) {
    logger.error({ err, eventId: event.id }, "unexpected error processing event");
    ok = false;
  }

  if (ok) {
    await db.event.update({ where: { id: event.id }, data: { status: "done", processedAt: new Date() } });
    return;
  }

  const attempts = event.attempts + 1;
  await db.event.update({
    where: { id: event.id },
    data: {
      status: "failed",
      attempts,
      nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
      lastError: "one or more actions failed — see action log for detail",
    },
  });
}

async function tick() {
  const batch = await db.event.findMany({
    where: {
      status: { in: ["received", "failed"] },
      nextAttemptAt: { lte: new Date() },
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { receivedAt: "asc" },
    take: 10,
  });

  for (const event of batch) {
    await processEvent(event);
  }
}

function start() {
  // a crash mid-processing leaves events stuck at "processing" forever unless
  // we reset them back to "received" on the next boot
  db.event
    .updateMany({ where: { status: "processing" }, data: { status: "received" } })
    .catch((err) => logger.error({ err }, "failed to reset stuck events on boot"));

  setInterval(() => {
    tick().catch((err) => logger.error({ err }, "worker tick failed"));
  }, POLL_INTERVAL_MS);

  logger.info("worker started");
}

module.exports = { start };
