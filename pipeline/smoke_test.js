/* Test de fumée : exécute app.js avec un DOM minimal sur toutes les routes. */
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..", "site");
const dataSrc = fs.readFileSync(path.join(site, "data.js"), "utf8");
const appSrc = fs.readFileSync(path.join(site, "assets", "app.js"), "utf8");

const routes = [
  "#/",
  "#/votes",
  "#/votes?q=immigration",
  "#/groupes",
  "#/methode",
  "#/sujet/pouvoir-achat",
  "#/sujet/sante",
  "#/sujet/ecole",
  "#/sujet/logement",
  "#/sujet/travail",
  "#/sujet/environnement",
  "#/sujet/alimentation",
  "#/sujet/solidarite",
  "#/sujet/immigration",
  "#/sujet/finances",
  "#/sujet/inconnu",
  "#/sujet/finances?v=2025-125",
  "#/route-inconnue",
];

let failures = 0;

for (const route of routes) {
  const app = {
    innerHTML: "",
    focus() {},
    querySelectorAll: () => [],
    addEventListener: () => {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  };
  global.window = {
    location: { hash: route },
    addEventListener: () => {},
    scrollTo: () => {},
    SENAT_DATA: undefined,
  };
  global.document = {
    getElementById: (id) => (id === "app" ? app : null),
    querySelectorAll: () => [],
    title: "Sénat·Vote — test",
  };
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

  try {
    // eslint-disable-next-line no-eval
    eval(dataSrc);
    // eslint-disable-next-line no-eval
    eval(appSrc);
  } catch (err) {
    failures++;
    console.log("ÉCHEC " + route + " → exception : " + err.message);
    continue;
  }

  const html = app.innerHTML;
  const problems = [];
  if (!html || html.length < 120) problems.push("contenu trop court (" + html.length + " octets)");
  for (const needle of ["undefined", "NaN", "[object Object]", ">null<", "null %", "Infinity"]) {
    if (html.includes(needle)) problems.push("contient « " + needle + " »");
  }
  if (problems.length) {
    failures++;
    console.log("ÉCHEC " + route + " → " + problems.join(" ; "));
  } else {
    console.log("ok    " + route.padEnd(30) + html.length + " octets");
  }
}

console.log(failures ? "\n" + failures + " échec(s)" : "\nToutes les routes passent le test de fumée.");
process.exit(failures ? 1 : 0);
