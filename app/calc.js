// Pure calculation, no DOM: used by the page and by test.js.
// Answers: which plan fits, and a rough monthly cost, from plans.json (dated, hand-maintained).
(function (root) {
  function recommend(a, data) {
    const P = data.plans;
    const reasons = []; // why we moved up
    let level = "free";
    const need = (to, why) => {
      const order = ["free", "pro", "team", "enterprise"];
      if (order.indexOf(to) > order.indexOf(level)) level = to;
      reasons.push({ plan: to, why });
    };
    if (a.sso) need("team", "SSO for the dashboard is listed from Team");
    if (a.compliance) need("team", "SOC2 / ISO 27001 is listed from Team");
    if (a.backupDays > 7) need("team", "14 days of daily backups is Team");
    if (a.restore === "daily" || a.restore === "pitr") need("pro", "Free has no automatic backups");
    if (a.alwaysOn) need("pro", "Free projects pause after 1 week of inactivity");
    if (a.projects > P.free.maxActiveProjects) need("pro", "Free allows 2 active projects");
    if (a.dbGb > P.free.dbGb) need("pro", "database is over the Free 0.5 GB");
    if (a.storageGb > P.free.storageGb) need("pro", "files are over the Free 1 GB");
    if (a.egressGb > P.free.egressGb) need("pro", "traffic is over the Free 5 GB");
    if (a.mau > P.free.mau) need("pro", "users are over the Free 50,000 MAU");
    if (a.use === "customer") need("pro", "a customer-facing app should not pause or lack backups");
    if (a.use === "enterprise") need("enterprise", "you asked for custom terms");
    return { level, reasons };
  }

  function cost(level, a, data) {
    if (level === "free") return { total: 0, lines: [{ name: "Free plan", usd: 0 }], note: "Over-quota projects slow down or go read-only (spend cap)" };
    if (level === "enterprise") return { total: null, lines: [], note: "Custom: contact sales" };
    const p = data.plans[level];
    const per = data.compute[a.compute];
    const lines = [{ name: p.label + " plan", usd: p.base }];
    const computeTotal = a.projects * per;
    lines.push({ name: "Compute x" + a.projects + " (" + a.compute + ")", usd: computeTotal });
    lines.push({ name: "Compute included in plan", usd: -Math.min(p.computeCredit, computeTotal) });
    const over = (n, free, rate, name) => { const x = Math.max(0, n - free); if (x > 0) lines.push({ name: name + " over quota", usd: round(x * rate) }); };
    over(a.dbGb, p.dbGb * a.projects, p.over.dbGb, "Database disk");
    over(a.storageGb, p.storageGb, p.over.storageGb, "File storage");
    over(a.egressGb, p.egressGb, p.over.egressGb, "Egress");
    over(a.mau, p.mau, p.over.mau, "MAU");
    if (a.restore === "pitr") lines.push({ name: "PITR add-on (7 days)", usd: data.pitrPer7Days });
    const total = round(lines.reduce((s, l) => s + l.usd, 0));
    return { total, lines, note: "" };
  }

  function round(n) { return Math.round(n * 100) / 100; }

  function isStale(asOf, now) {
    const days = (new Date(now) - new Date(asOf)) / 86400000;
    return days > 45;
  }

  const api = { recommend, cost, isStale };
  if (typeof module !== "undefined") module.exports = api; else root.PlanCalc = api;
})(this);
