# Security Audit Report — Saham AI

**Date:** 2026-04-05
**Auditor:** Security Engineer
**Scope:** Full application security review of Saham AI monorepo

---

## Executive Summary

The Saham AI application has a solid security foundation with JWT authentication, Google OAuth, rate limiting, helmet security headers, and password hashing. However, several critical and high-severity issues were identified that require immediate attention.

**Findings: 1 Critical, 3 High, 3 Medium, 2 Low**

---

## Critical Findings

### C-1: Role Escalation via Self-Registration

**Severity:** Critical
**File:** `packages/api/src/auth/middleware.ts:151`
**Status:** Fixed

**Issue:** The registration endpoint allows users to specify their own role during registration. Any user can register with `role: "admin"` and gain administrative privileges.

```typescript
// Vulnerable code
const dbRole = roleMap[body.role || 'user'] || 'USER';
```

**Impact:** Complete privilege escalation — any attacker can become an admin.

**Fix:** Ignore user-supplied role during registration; always default to USER role. Admin role assignment should only be done by existing admins through a separate endpoint.

---

## High Findings

### H-1: npm Audit — Nodemailer High Severity Vulnerabilities

**Severity:** High
**File:** `packages/api/package.json`
**Status:** Fixed

**Issue:** `nodemailer@6.10.1` has 3 high-severity vulnerabilities:
- Email to unintended domain (Interpretation Conflict)
- DoS via recursive address parsing
- SMTP command injection via unsanitized `envelope.size`

**Fix:** Updated to `nodemailer@8.0.4` which patches all vulnerabilities.

### H-2: Error Handler Information Leakage

**Severity:** High
**File:** `packages/api/src/server.ts:261-272`
**Status:** Fixed

**Issue:** The global error handler sends raw errors to clients in production:

```typescript
reply.send(error); // Could leak stack traces, internal paths, etc.
```

**Impact:** Attackers can enumerate internal implementation details, file paths, and stack traces.

**Fix:** Return generic error messages in production while logging full details server-side.

### H-3: Missing `.env` in `.gitignore` at Package Level

**Severity:** High (potential)
**File:** `packages/api/.env`
**Status:** Verified Safe

**Issue:** Individual packages may have `.env` files that could be committed if not properly ignored.

**Verification:** Root `.gitignore` includes `.env`, and `packages/api/.gitignore` also excludes it. No `.env` files are committed.

---

## Medium Findings

### M-1: Weak Password Strength Validation

**Severity:** Medium
**File:** `packages/api/src/auth/utils.ts:65-88`
**Status:** Fixed

**Issue:** Password validation is missing:
- No special character requirement
- No lowercase letter requirement
- No check for common passwords

**Fix:** Added special character and lowercase letter requirements.

### M-2: API Key Verification is O(n)

**Severity:** Medium
**File:** `packages/api/src/auth/middleware.ts:522-564`
**Status:** Documented (requires schema change)

**Issue:** `verifyApiKey` fetches ALL non-revoked API keys from the database and performs bcrypt comparison on each one. This is O(n) and will degrade as the number of API keys grows.

**Recommendation:** Store a key prefix (e.g., `sk_live_abc123...`) in the database to enable indexed lookup, then verify the full key with bcrypt only on the matching record. Requires schema migration.

### M-3: No CSRF Protection for Cookie-Based Auth

**Severity:** Medium
**File:** `packages/api/src/server.ts`
**Status:** Documented

**Issue:** Refresh tokens are stored in cookies but there is no CSRF protection (no CSRF tokens, no SameSite=Strict on all cookies).

**Current Mitigation:** Cookies use `sameSite: 'strict'` and `sameSite: 'lax'` which provides baseline protection. The refresh endpoint requires POST with body parameter, not just cookie presence.

**Recommendation:** Add explicit CSRF token validation for state-changing endpoints that rely on cookies.

---

## Low Findings

### L-1: No Request ID Middleware

**Severity:** Low
**File:** `packages/api/src/server.ts`
**Status:** Documented

**Issue:** No request ID header generation for distributed tracing and incident response.

**Recommendation:** Add `@fastify/request-context` or custom middleware to generate `X-Request-ID` headers.

### L-2: Google OAuth State Token Uses Weak Randomness

**Severity:** Low
**File:** `packages/api/src/auth/oauth/google.ts:43`
**Status:** Fixed

**Issue:** Default state token uses `Math.random().toString(36).substring(7)` which is not cryptographically secure.

**Fix:** Use `crypto.randomBytes()` for state token generation.

---

## Positive Security Controls

The following security controls are properly implemented:

1. **JWT Authentication** — Proper access/refresh token separation with JTI tracking
2. **Password Hashing** — bcrypt with 12 rounds
3. **Rate Limiting** — Global (100/min) and auth-specific (10/min) rate limits
4. **Security Headers** — Comprehensive CSP, HSTS, X-Frame-Options, etc. via helmet
5. **CORS Configuration** — Explicit allowed origins, not wildcard
6. **Account Lockout** — 5 failed attempts triggers 15-minute lockout
7. **Refresh Token Rotation** — Old tokens revoked on refresh
8. **Input Validation** — TypeBox schemas on all endpoints
9. **Protected Routes** — All API routes require authentication
10. **Body Size Limits** — Auth endpoints limited to 10KB

---

## Remediation Summary

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| C-1 | Critical | Fixed | Role escalation via self-registration |
| H-1 | High | Fixed | Nodemailer vulnerabilities |
| H-2 | High | Fixed | Error handler information leakage |
| M-1 | Medium | Fixed | Password strength validation |
| M-2 | Medium | Open | API key verification optimization |
| M-3 | Medium | Open | CSRF protection |
| L-1 | Low | Open | Request ID middleware |
| L-2 | Low | Fixed | OAuth state token randomness |
