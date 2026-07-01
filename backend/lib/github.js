const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const config = require("../config");
const db = require("../db");

function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: config.GITHUB_APP_ID, privateKey: config.GITHUB_APP_PRIVATE_KEY },
  });
}

// installation tokens are valid for 1 hour; cache clients so we don't mint a
// fresh token on every GitHub API call
const installationClients = new Map();

async function getInstallationOctokit(installationId) {
  const cached = installationClients.get(installationId);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.client;
  }
  const client = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: config.GITHUB_APP_ID, privateKey: config.GITHUB_APP_PRIVATE_KEY, installationId },
  });
  const auth = await client.auth({ type: "installation" });
  installationClients.set(installationId, { client, expiresAt: new Date(auth.expiresAt).getTime() });
  return client;
}

async function listInstallationRepos(installationId) {
  const octokit = await getInstallationOctokit(installationId);
  return octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation);
}

async function addLabel(installationId, owner, repo, issueNumber, label) {
  const octokit = await getInstallationOctokit(installationId);
  return octokit.rest.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: [label] });
}

async function postComment(installationId, owner, repo, issueNumber, body) {
  const octokit = await getInstallationOctokit(installationId);
  return octokit.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

// runs after a user completes the App install flow (and again from installation
// webhook events) so our Repo table always matches what's actually installed
async function syncInstallation(githubInstallationId, userId) {
  const appOctokit = getAppOctokit();
  const { data: info } = await appOctokit.rest.apps.getInstallation({ installation_id: githubInstallationId });

  const installation = await db.installation.upsert({
    where: { githubInstallationId: BigInt(githubInstallationId) },
    update: { accountLogin: info.account.login, userId },
    create: { githubInstallationId: BigInt(githubInstallationId), accountLogin: info.account.login, userId },
  });

  const repos = await listInstallationRepos(githubInstallationId);
  for (const repo of repos) {
    await db.repo.upsert({
      where: { githubRepoId: BigInt(repo.id) },
      update: { fullName: repo.full_name, installationId: installation.id, userId },
      create: {
        githubRepoId: BigInt(repo.id),
        fullName: repo.full_name,
        installationId: installation.id,
        userId,
      },
    });
  }

  return installation;
}

module.exports = {
  getAppOctokit,
  getInstallationOctokit,
  listInstallationRepos,
  addLabel,
  postComment,
  syncInstallation,
};
