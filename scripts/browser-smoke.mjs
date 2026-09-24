/* Browser smoke test for the public site, driven over the Chrome DevTools Protocol so it needs no
   test framework. Read-only: it never signs in or writes anything, so it can also run against
   the live site after a deploy.

     pnpm test:browser                          # http://localhost:3100 (pnpm build && pnpm start -p 3100)
     pnpm test:browser https://nmadhukumar.com

   Set CHROME_PATH if Chrome is not in the usual place. Exits 1 if any check fails. */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3100").replace(/\/$/, "");
const CHROME =
  process.env.CHROME_PATH ??
  {
    win32: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  }[process.platform] ??
  "google-chrome";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, mobile: false },
  { name: "phone", width: 390, height: 844, mobile: true },
  // A short screen is where a dialog pinned to its section instead of the screen got cut off.
  { name: "phone-landscape", width: 844, height: 390, mobile: true },
];
// Each opener is a list of elements; the first one that yields a dialog is used.
const DIALOGS = [
  { path: "/", name: "Impact", opener: ".impact button[aria-expanded]:not([disabled])" },
  { path: "/", name: "Work", opener: 'button[aria-label^="Preview "]' },
  { path: "/room", name: "Drawing Room", opener: ".mood-card.is-viewable" },
];
const MISSING_PAGE = "/this-page-does-not-exist";
/* Expected 404s, not errors: a thumbnail that fails falls back to the card's cover, and the
   missing page is meant to answer 404. */
const BENIGN = [/\/api\/(linkedin|instagram)-thumb/, new RegExp(`${MISSING_PAGE}$`)];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
function check(ok, label, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `: ${detail}`}`);
  if (!ok) failures.push(label);
}

const profile = mkdtempSync(join(tmpdir(), "browser-smoke-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "about:blank",
]);

async function connect() {
  const portFile = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100 && !existsSync(portFile); i += 1) await sleep(100);
  const [port] = readFileSync(portFile, "utf8").split("\n");
  const { webSocketDebuggerUrl } = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) =>
    r.json(),
  );
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  return socket;
}

const socket = await connect();
let nextId = 0;
const pending = new Map();
const listeners = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  } else for (const listen of listeners) listen(message);
};
function send(method, params = {}, sessionId) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) =>
    pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result))),
  );
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);
const run = async (expression) =>
  (await page("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result
    .value;

let errors = [];
listeners.push(({ method, params, sessionId: from }) => {
  if (from !== sessionId) return;
  const text =
    method === "Runtime.exceptionThrown"
      ? (params.exceptionDetails.exception?.description ?? params.exceptionDetails.text)
      : method === "Log.entryAdded" && params.entry.level === "error"
        ? `${params.entry.text} ${params.entry.url ?? ""}`
        : method === "Runtime.consoleAPICalled" && params.type === "error"
          ? params.args.map((a) => a.value ?? a.description).join(" ")
          : null;
  if (text && !BENIGN.some((pattern) => pattern.test(text))) errors.push(text.trim());
});
await Promise.all(["Page.enable", "Runtime.enable", "Log.enable"].map((m) => page(m)));

async function open(path) {
  errors = [];
  await page("Page.navigate", { url: BASE + path });
  for (let i = 0; i < 50 && (await run("document.readyState")) !== "complete"; i += 1) {
    await sleep(200);
  }
  await sleep(1500);
}

async function pressEscape() {
  const key = { key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 };
  await page("Input.dispatchKeyEvent", { type: "keyDown", ...key });
  await page("Input.dispatchKeyEvent", { type: "keyUp", ...key });
}

const status = async (path) => (await fetch(BASE + path, { redirect: "manual" })).status;
check((await status("/")) === 200, "/ answers 200");
check((await status("/room")) === 200, "/room answers 200");
check((await status("/resume")) === 200, "/resume answers 200");
check((await status(MISSING_PAGE)) === 404, "an unknown page answers 404");
const studio = await fetch(`${BASE}/studio`, { redirect: "manual" });
check(
  [302, 303, 307, 308].includes(studio.status) &&
    /\/login|studio\./.test(studio.headers.get("location") ?? ""),
  "/studio sends a signed-out visitor to sign in",
  `${studio.status} ${studio.headers.get("location")}`,
);

for (const viewport of VIEWPORTS) {
  await page("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
    mobile: viewport.mobile,
  });
  await page("Emulation.setTouchEmulationEnabled", { enabled: viewport.mobile, maxTouchPoints: 5 });

  for (const path of ["/", "/room", "/resume", MISSING_PAGE]) {
    await open(path);
    const layout = await run(
      "({ title: document.title, overflow: document.documentElement.scrollWidth - innerWidth })",
    );
    const label = `${viewport.name} ${path}`;
    check(Boolean(layout.title), `${label} has a title`);
    check(layout.overflow <= 1, `${label} has no sideways scroll`, `${layout.overflow}px too wide`);
    check(errors.length === 0, `${label} logs no errors`, errors.slice(0, 3).join(" | "));
  }

  for (const dialog of DIALOGS) {
    await open(dialog.path);
    const label = `${viewport.name} ${dialog.name} dialog`;
    const opened = await run(`(async () => {
      for (const opener of document.querySelectorAll(${JSON.stringify(dialog.opener)})) {
        opener.scrollIntoView({ block: "center" });
        opener.focus();
        opener.click();
        await new Promise((r) => setTimeout(r, 700));
        const box = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (!box) continue;
        opener.dataset.smokeOpener = "";
        const r = box.getBoundingClientRect();
        const close = [...box.querySelectorAll("button")].find((b) => /close/i.test(b.getAttribute("aria-label") ?? b.textContent));
        const c = close?.getBoundingClientRect();
        const inView = (b) => b && b.top >= -1 && b.left >= -1 && b.bottom <= innerHeight + 1 && b.right <= innerWidth + 1;
        return { inView: inView(r), closeInView: inView(c) };
      }
      return null;
    })()`);
    check(opened !== null, `${label} opens`);
    if (!opened) continue;
    check(opened.inView, `${label} fits on screen`);
    check(opened.closeInView, `${label} close button is on screen`);
    await pressEscape();
    await sleep(500);
    const after = await run(`({
      closed: !document.querySelector('[role="dialog"][aria-modal="true"]'),
      focusBack: document.activeElement?.hasAttribute("data-smoke-opener") ?? false,
    })`);
    check(after.closed, `${label} closes on Escape`);
    check(after.focusBack, `${label} returns focus to its opener`);
  }
}

socket.close();
chrome.kill();
await sleep(300);
rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
console.log(failures.length ? `\n${failures.length} check(s) failed.` : "\nAll checks passed.");
process.exit(failures.length ? 1 : 0);
