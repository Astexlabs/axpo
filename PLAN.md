# Auth System Overhaul: Clerk + Convex + Expo

## Context

The app uses Clerk for auth and Convex for backend, but has several gaps: no `isLoaded` checks cause flash redirects, the client manually syncs users to Convex on mount (violating the spec), custom Clerk fields (e.g. username) aren't handled, sign-in doesn't support MFA or passkeys, error handling is raw, and there are zero tests. This plan addresses all of these per the spec.

**Key user decisions:**
- **Convex sync removal:** JWT-only approach — remove the `users` table entirely. A new `device_tokens` table stores push tokens.
- **Passkeys:** Android only (the only platform in `app.json`).
- **Tests:** Jest + React Native Testing Library.

---

## Phase 0: Dependencies & Config

### 0.1 Install test dependencies
**File:** `package.json`

Add to `devDependencies`:
- `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`

Add script: `"test": "jest"`

### 0.2 Create Jest config
**New file:** `jest.config.js`
- Preset: `jest-expo`
- `transformIgnorePatterns` for RN/Expo/Clerk/Convex modules
- `moduleNameMapper`: `@/` -> `<rootDir>/`

### 0.3 Update `app.json` for passkey intent filters
**File:** `app.json`

Add `intentFilters` under `expo.android` for the Clerk passkey callback URL (`https://<clerk-frontend-api>/.../passkeys`). The exact domain is configured in Clerk Dashboard.

---

## Phase 1: Error Handling Utility

### 1.1 Create `lib/auth-errors.ts`
**New file.** Maps Clerk error codes to user-friendly strings:
- `form_identifier_not_found` → "No account found with that email."
- `form_password_incorrect` → "Incorrect password."
- `form_identifier_exists` → "An account with this email already exists."
- `form_code_incorrect` → "Invalid verification code."
- `form_code_expired` → "Code expired. Request a new one."
- `too_many_requests` → "Too many attempts. Please wait."
- `passkey_registration_cancelled` / `passkey_authentication_cancelled` → clear messages
- Fallback: Clerk's `longMessage` → `message` → generic string

Uses `isClerkAPIResponseError` from `@clerk/clerk-expo` for type checking.

---

## Phase 2: Convex Schema Migration

### 2.1 Replace `users` table with `device_tokens`
**File:** `convex/schema.ts`

```ts
device_tokens: defineTable({
  clerkUserId: v.string(),
  pushToken: v.string(),
})
  .index('by_clerk_user_id', ['clerkUserId'])
  .index('by_push_token', ['pushToken']),
```

### 2.2 Delete `convex/users.ts`
Remove entirely — `current`, `upsert`, `savePushToken` all gone.

### 2.3 Create `convex/deviceTokens.ts`
**New file.** Contains:
- `upsertToken` mutation: auth-gated, creates/finds token by clerkUserId + pushToken
- `removeToken` mutation: deletes a token for the current user
- `getTokensForUser` query: returns tokens for a given user ID

### 2.4 Update `hooks/use-push-notifications.ts`
Change `api.users.savePushToken` → `api.deviceTokens.upsertToken`. Same hook structure, different API path.

---

## Phase 3: Auth State Loading Guards

### 3.1 `app/index.tsx`
Add `isLoaded` from `useAuth()`. Return `ActivityIndicator` when `!isLoaded`. Only redirect once loaded.

### 3.2 `app/(auth)/_layout.tsx`
Same `isLoaded` check. Show loading spinner until Clerk is ready.

### 3.3 `app/(tabs)/_layout.tsx`
- Add `isLoaded` check with loading spinner
- **Remove** `useMutation(api.users.upsert)` import and call
- **Remove** the `useEffect` that calls `upsertUser()`
- **Remove** `import { useMutation } from 'convex/react'` and `import { api }`

---

## Phase 4: Update Tab Screens

### 4.1 `app/(tabs)/index.tsx`
- Remove `useQuery(api.users.current)` and the "Convex Sync Status" card
- Use only `useUser()` from Clerk for display name (firstName → username → email)
- Remove `convex/react` and `api` imports

### 4.2 `app/(tabs)/settings.tsx`
- Add `useRouter()`, after `signOut()` call `router.replace('/(auth)/sign-in')`
- Add "Create passkey" button using `user.createPasskey()` from `useUser()`
- Add `accessibilityLabel` / `accessibilityRole` to all interactive elements
- Use `getAuthErrorMessage` for passkey errors

---

## Phase 5: Sign-In Overhaul

### 5.1 Rewrite `app/(auth)/sign-in.tsx`

**New state machine:**
1. **Default:** Email + password inputs, "Sign in" button, "Sign in with passkey" button, "Forgot password" link
2. **MFA (`needs_second_factor`):** TOTP/code input, submit calls `attemptSecondFactor`

**Flow:**
- `signIn.create({ identifier, password })` → branch on `status`:
  - `'complete'` → `setActive` + navigate
  - `'needs_first_factor'` → `attemptFirstFactor({ strategy: 'password', password })` → re-check
  - `'needs_second_factor'` → show MFA input
- Passkey: `signIn.authenticateWithPasskey()` → `setActive` on complete, catch and show fallback
- Errors: inline `<Text>` using `getAuthErrorMessage()` instead of `Alert.alert`
- All inputs/buttons get `accessibilityLabel`

### 5.2 Create `app/(auth)/forgot-password.tsx`
**New file.** Three-step flow:
1. **Request:** email input → `signIn.create({ strategy: 'reset_password_email_code', identifier })`
2. **Code:** 6-digit input → `signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code })`
3. **New password:** password + confirm → `signIn.resetPassword({ password })` → `setActive` → navigate

### 5.3 Update `app/(auth)/_layout.tsx`
Add `<Stack.Screen name="forgot-password" />` to the Stack.

---

## Phase 6: Sign-Up Overhaul

### 6.1 Rewrite `app/(auth)/sign-up.tsx`

**New state machine:** `'initial'` → `'missingFields'` → `'verification'` → `'passkeyOffer'` → done

**Flow:**
1. `signUp.create({ emailAddress, password })` → check `status`:
   - `'missing_requirements'` → check `signUp.missingFields`:
     - If non-verification fields (e.g. `username`): show dynamic inputs, call `signUp.update(fields)`
     - If verification needed: call `prepareEmailAddressVerification`, go to verification step
   - `'complete'` → `setActive` → navigate
2. **Verification step:** 6-digit code input + "Resend code" button with 60s cooldown timer
3. **Passkey offer:** After verification completes, offer "Create passkey" or "Skip" before navigating
4. Errors: inline text via `getAuthErrorMessage()`
5. All inputs/buttons get `accessibilityLabel`

---

## Phase 7: Tests

### 7.1 Test helpers
**New file:** `__tests__/helpers/mock-clerk.ts`
- `mockUseAuth(overrides)`, `mockUseSignIn(overrides)`, `mockUseSignUp(overrides)`
- `createClerkAPIResponseError(code, message)` for testing error mapping

### 7.2 Test files

| Test File | Covers |
|-----------|--------|
| `__tests__/lib/auth-errors.test.ts` | Error code mapping, fallback behavior |
| `__tests__/app/index.test.tsx` | `isLoaded` loading state, redirect logic |
| `__tests__/app/(auth)/_layout.test.tsx` | Auth guard: loading, redirect, Stack render |
| `__tests__/app/(tabs)/_layout.test.tsx` | Tab guard: loading, redirect, **no upsert call** |
| `__tests__/app/(auth)/sign-in.test.tsx` | Success, MFA, passkey, error display, forgot-password link |
| `__tests__/app/(auth)/sign-up.test.tsx` | Success, custom fields, resend code cooldown, passkey offer, error display |
| `__tests__/app/(auth)/forgot-password.test.tsx` | All 3 steps, error handling |
| `__tests__/app/(tabs)/settings.test.tsx` | Sign-out with redirect, passkey creation |

All tests mock `@clerk/clerk-expo` hooks and `expo-router` navigation.

---

## Files Summary

| Action | File |
|--------|------|
| **Modify** | `package.json` (deps + test script) |
| **Modify** | `app.json` (passkey intent filters) |
| **Modify** | `convex/schema.ts` (users → device_tokens) |
| **Delete** | `convex/users.ts` |
| **Create** | `convex/deviceTokens.ts` |
| **Modify** | `hooks/use-push-notifications.ts` (new API path) |
| **Modify** | `app/index.tsx` (isLoaded) |
| **Modify** | `app/(auth)/_layout.tsx` (isLoaded + forgot-password screen) |
| **Modify** | `app/(auth)/sign-in.tsx` (full rewrite) |
| **Modify** | `app/(auth)/sign-up.tsx` (full rewrite) |
| **Create** | `app/(auth)/forgot-password.tsx` |
| **Modify** | `app/(tabs)/_layout.tsx` (remove sync, isLoaded) |
| **Modify** | `app/(tabs)/index.tsx` (remove Convex query) |
| **Modify** | `app/(tabs)/settings.tsx` (sign-out redirect, passkey, a11y) |
| **Create** | `lib/auth-errors.ts` |
| **Create** | `jest.config.js` |
| **Create** | `__tests__/helpers/mock-clerk.ts` |
| **Create** | 8 test files (see Phase 7) |

---

## Verification

1. **Type check:** `npx tsc --noEmit` — no type errors
2. **Convex:** `npx convex dev` — schema deploys, `device_tokens` table created, `users` table gone
3. **Tests:** `pnpm test` — all suites pass
4. **Manual (dev build):**
   - Open app → loading spinner → redirects to sign-in
   - Sign up → custom fields if required → verify email → resend works → passkey offer → tabs
   - Sign out → sign-in screen
   - Sign in with password → tabs
   - Sign in with passkey → tabs
   - Forgot password → reset flow completes
   - No `users.upsert` calls in Convex logs
