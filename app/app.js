// Plan check: reads plans.json (dated), asks a few questions, shows a plan and a rough monthly cost.
const $ = (id) => document.getElementById(id);
let data = null;

let adjusted = []; // fields we had to correct, shown to the user (no silent fixes)

function read() {
  adjusted = [];
  const num = (id) => {
    const v = parseFloat($(id).value);
    if (Number.isFinite(v) && v >= 0) return v;
    adjusted.push(`${$(id).previousElementSibling.textContent} -> 0`);
    return 0;
  };
  const projects = Math.round(num("projects"));
  if (projects < 1) { adjusted.pop(); adjusted.push("Number of projects -> 1"); }
  return {
    use: $("use").value,
    projects: Math.max(1, projects),
    mau: num("mau"), dbGb: num("dbGb"), storageGb: num("storageGb"), egressGb: num("egressGb"),
    restore: $("restore").value, compute: $("compute").value,
    alwaysOn: $("alwaysOn").checked, sso: $("sso").checked, compliance: $("compliance").checked,
    backupDays: $("backup14").checked ? 14 : 0,
  };
}

const usd = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

function render() {
  if (!data) return;
  const a = read();
  const rec = PlanCalc.recommend(a, data);
  const c = PlanCalc.cost(rec.level, a, data);
  const label = data.plans[rec.level].label;
  const top = rec.reasons.filter((r) => r.plan === rec.level);
  let html = "";
  if (adjusted.length) html += `<div class="warn">Some answers were empty, negative or not a number, so the estimate used these instead:<br>${adjusted.join("<br>")}</div>`;
  html += `<p class="plan">${label}</p>`;
  html += `<p class="price">${c.total === null ? "Custom" : usd(c.total) + " / month (rough)"}</p>`;
  if (c.lines.length) html += "<table>" + c.lines.map((l) => `<tr><td>${l.name}</td><td>${usd(l.usd)}</td></tr>`).join("") + "</table>";
  if (c.note) html += `<p class="foot">${c.note}</p>`;
  html += top.length ? "<p><b>Why this plan</b></p><ul>" + top.map((r) => `<li>${r.why}</li>`).join("") + "</ul>"
                     : "<p>Everything you entered fits in the Free quota.</p>";
  if (rec.level === "free") html += `<p class="foot">Free: no automatic backups, and a project pauses after 1 week without activity.</p>`;
  $("result").innerHTML = html;
}

async function init() {
  try {
    const res = await fetch("plans.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
  } catch (e) {
    $("banner").innerHTML = `<div class="warn err">Could not load plans.json (${e.message}). Open this page through a local web server, not as a file.</div>`;
    return;
  }
  if (PlanCalc.isStale(data.asOf, new Date())) {
    $("banner").innerHTML = `<div class="warn">The price data is from ${data.asOf}. It may be out of date: check the pricing page and update plans.json.</div>`;
  }
  $("foot").textContent = `Price data as of ${data.asOf} (${data.source}). Rough estimate only: tax, currency and many add-ons are not included.`;
  $("form").addEventListener("input", render);
  $("form").addEventListener("submit", (e) => e.preventDefault());
  render();
}
init();
