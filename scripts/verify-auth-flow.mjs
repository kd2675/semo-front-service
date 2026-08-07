import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildLoginPath, sanitizeAuthNextPath } from "../app/lib/authRouting.ts";

assert.equal(sanitizeAuthNextPath("/clubs/1/more/finance?month=7"), "/clubs/1/more/finance?month=7");
assert.equal(sanitizeAuthNextPath("https://attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("//attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("/auth/callback"), "/");
assert.equal(buildLoginPath("/clubs/1/more/finance?month=7", true), "/login?next=%2Fclubs%2F1%2Fmore%2Ffinance%3Fmonth%3D7&expired=1");

const callbackSource = await readFile(new URL("../app/auth/callback/page.tsx", import.meta.url), "utf8");
const loginSource = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const gateSource = await readFile(new URL("../app/components/AuthGate.tsx", import.meta.url), "utf8");
const authSource = await readFile(new URL("../app/lib/auth.ts", import.meta.url), "utf8");

assert.match(callbackSource, /ensureAccessToken\(\)/);
assert.doesNotMatch(callbackSource, /get\("token"\)|setAccessToken\(/);
assert.doesNotMatch(loginSource, /get\("token"\)|window\.location\.href/);
assert.match(loginSource, /window\.location\.replace/);
assert.match(loginSource, /await signup\(/);
assert.match(gateSource, /buildLoginPath/);
assert.match(authSource, /explicitlySignedOut/);
assert.match(authSource, /requestGeneration !== authGeneration/);

console.log("Semo authentication routing checks passed.");
