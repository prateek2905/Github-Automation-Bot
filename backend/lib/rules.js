function getFieldValue(payload, eventType, field) {
  const item = eventType === "pull_request" ? payload.pull_request : payload.issue;
  switch (field) {
    case "title":
      return item?.title || "";
    case "body":
      return item?.body || "";
    case "author":
      return payload.sender?.login || "";
    case "label":
      return (item?.labels || []).map((l) => l.name).join(",");
    default:
      return "";
  }
}

// only "opened" issues/PRs are matched — matching on every edit/label/comment
// webhook would re-trigger the same rule repeatedly for one issue
function matchRule(rule, event) {
  if (rule.eventType !== event.eventType) return false;
  if (event.eventType === "push") return true;
  if (event.action !== "opened") return false;

  const value = getFieldValue(event.payload, event.eventType, rule.matchField);
  const target = rule.matchValue || "";

  switch (rule.matchType) {
    case "contains":
      return value.toLowerCase().includes(target.toLowerCase());
    case "equals":
      return value.toLowerCase() === target.toLowerCase();
    case "regex":
      try {
        return new RegExp(target, "i").test(value);
      } catch (err) {
        return false;
      }
    default:
      return false;
  }
}

module.exports = { matchRule, getFieldValue };
