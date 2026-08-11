import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { isSemoAccountRole, normalizeRole } from "../app/lib/authPolicy.ts";
import { buildLoginPath, sanitizeAuthNextPath } from "../app/lib/authRouting.ts";

assert.equal(sanitizeAuthNextPath("/clubs/1/more/finance?month=7"), "/clubs/1/more/finance?month=7");
assert.equal(sanitizeAuthNextPath("https://attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("//attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("/auth/callback"), "/");
assert.equal(buildLoginPath("/clubs/1/more/finance?month=7", true), "/login?next=%2Fclubs%2F1%2Fmore%2Ffinance%3Fmonth%3D7&expired=1");
assert.equal(normalizeRole(" role_admin "), "ADMIN");
assert.equal(isSemoAccountRole("USER"), true);
assert.equal(isSemoAccountRole("ROLE_USER"), true);
assert.equal(isSemoAccountRole("ADMIN"), true);
assert.equal(isSemoAccountRole("ROLE_ADMIN"), true);
assert.equal(isSemoAccountRole("MANAGER"), false);
assert.equal(isSemoAccountRole("GATEWAY"), false);
assert.equal(isSemoAccountRole(undefined), false);

const callbackSource = await readFile(new URL("../app/auth/callback/page.tsx", import.meta.url), "utf8");
const loginSource = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8");
const gateSource = await readFile(new URL("../app/components/AuthGate.tsx", import.meta.url), "utf8");
const authSource = await readFile(new URL("../app/lib/auth.ts", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../app/lib/api.ts", import.meta.url), "utf8");

assert.match(callbackSource, /ensureAccessToken\(\)/);
assert.doesNotMatch(callbackSource, /get\("token"\)|setAccessToken\(/);
assert.doesNotMatch(loginSource, /get\("token"\)|window\.location\.href/);
assert.match(loginSource, /window\.location\.replace/);
assert.match(loginSource, /AUTH_API_BASE/);
assert.match(loginSource, /await signup\(/);
assert.match(gateSource, /buildLoginPath/);
assert.match(authSource, /explicitlySignedOut/);
assert.match(authSource, /requestGeneration !== authGeneration/);
assert.match(authSource, /postAuthJson/);
assert.match(apiSource, /NEXT_PUBLIC_API_MODE \?\? "direct"/);
assert.match(apiSource, /NEXT_PUBLIC_SEMO_API_URL/);
assert.match(apiSource, /NEXT_PUBLIC_AUTH_API_URL/);
assert.match(apiSource, /headers\.Authorization/);
assert.match(apiSource, /headers\["X-User-Name"\]/);
assert.match(apiSource, /headers\["X-User-Key"\]/);
assert.match(apiSource, /headers\["X-User-Role"\]/);

console.log("Semo authentication routing checks passed.");
