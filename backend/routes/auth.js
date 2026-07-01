const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const logger = require("../lib/logger");
const { createState, consumeState } = require("../lib/oauthState");

const router = express.Router();

router.get("/github/login", (req, res) => {
  const state = createState();
  const params = new URLSearchParams({
    client_id: config.GITHUB_APP_CLIENT_ID,
    redirect_uri: `${config.APP_URL}/auth/github/callback`,
    scope: "read:user",
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || !consumeState(state)) {
    return res.status(400).send("Invalid or expired login attempt. Please try signing in again.");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: config.GITHUB_APP_CLIENT_ID,
        client_secret: config.GITHUB_APP_CLIENT_SECRET,
        code,
        redirect_uri: `${config.APP_URL}/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      logger.error({ tokenData }, "github oauth token exchange failed");
      return res.status(400).send("GitHub sign-in failed. Please try again.");
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "github-automation-bot" },
    });
    const ghUser = await userRes.json();

    const user = await db.user.upsert({
      where: { githubId: BigInt(ghUser.id) },
      update: { login: ghUser.login, name: ghUser.name, avatarUrl: ghUser.avatar_url },
      create: {
        githubId: BigInt(ghUser.id),
        login: ghUser.login,
        name: ghUser.name,
        avatarUrl: ghUser.avatar_url,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: "7d" });
    res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    logger.error({ err }, "github oauth callback error");
    res.status(500).send("Something went wrong during sign-in.");
  }
});

router.get("/me", require("../middleware"), async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
  });
});

module.exports = router;
