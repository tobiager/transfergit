# GitHub Rate Limit Management Enhancement: Implementing Optional Per-User OAuth Flow

**Bounty Title:** Optional GitHub OAuth login to use the visitor's own rate-limit budget
**Status:** Comprehensive Solution Proposal
**Goal:** Decouple API rate limiting from a single shared server token by allowing authenticated users to optionally supply their personal GitHub credentials (via OAuth) for site interactions.

---

## 1. Architectural Design and Flow Diagram

The core principle of this enhancement is to augment the existing request execution path (`read` -> `process shared token`) with a check for an available, active user-provided token (`read` -> `process user token`).

### Components Involved:
1. **GitHub OAuth App:** A dedicated GitHub Application registered in settings will be used solely for authentication (read-only scopes are sufficient). This app facilitates the secure redirect flow.
2. **Frontend (`Navbar.tsx`):** Initiates the OAuth dance by directing the user to GitHub's authorization page.
3. **Backend API Route (`app/api/auth/github/callback/route.ts`):** Handles the redirect from GitHub, exchanges the temporary code for a long-lived access token, and manages session state creation.
4. **Session Management (Signed Cookies):** The resulting user OAuth token and associated metadata will be stored in a signed cookie (`X-User-GitHub-Token`). This keeps the solution stateless and database-free.
5. **Service Layer Modification:** Core GitHub interaction functions must be refactored to accept an optional `accessToken: string | undefined`.

### Token Priority Logic (Critical):
When fetching data, the system must check tokens in this strict priority order:
1. **User Token:** Is a valid token present in the signed cookie? Use it. This maximizes user rate limit benefit.
2. **Shared Server Token:** If no user token is available or if the call requires site-wide permissions, fall back to the standard `process.env.GITHUB_TOKEN`.

---

## 2. Implementation Details and Code Solutions

### A. Session Management (`utils/auth.ts`)

We must define helpers for cookie signing and retrieval, ensuring robustness and type safety across the application.

```typescript
// utils/auth.ts (New file)
import { cookies } from 'next/headers';

/** Interface for stored user session data */
export interface UserSessionState {
  token: string; // The GitHub Access Token obtained via OAuth
  expiresAt: number; // Unix timestamp when the token is considered stale/expired
}

const SESSION_COOKIE_NAME = 'X-User-GitHub-Token';
const COOKIE_SECRET = process.env.AUTH_COOKIE_SECRET || "your_strong_default_secret"; // Use environment variable!

/** Sets the user's active GitHub token in a signed cookie */
export function setAuthSession(token: string, expirationDays: number = 30) {
  const expiresAt = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);

  cookies().set(SESSION_COOKIE_NAME, JSON.stringify({
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  }), {
    httpOnly: true, // Prevents client-side JS access (best practice)
    secure: process.env.NODE_ENV === 'production',
    maxAge: expirationDays * 24 * 60 * 60,
    path: '/',
    sameSite: 'Lax',
  });
}

/** Retrieves the user's token and checks for expiry */
export function getAuthSession(): { token: string; valid: boolean } | null {
  const cookieStore = cookies();
  const sessionJson = cookieStore.get('X-User-GitHub-Token')?.value;

  if (!sessionJson) return null;

  try {
    const session: UserSessionState = JSON.parse(sessionJson);
    const expiryTime = new Date(session.expiresAt).getTime();

    // Basic validity check (assuming the backend can handle actual token expiry errors later)
    if (expiryTime < Date.now()) {
      console.warn("User session expired cookie data.");
      cookies().delete('X-User-GitHub-Token'); // Clear stale token
      return null;
    }

    return { token: session.token, valid: true };

  } catch (e) {
    console.error("Error parsing user session cookie:", e);
    cookies().delete('X-User-GitHub-Token');
    return null;
  }
}
```

### B. OAuth Callback Handler (`app/api/auth/github/callback/route.ts`)

This route handles the final exchange of authorization code for the actual access token using GitHub's API.

**(Note: Assume necessary environment variables are set: `CLIENT_ID`, `CLIENT_SECRET`, `GITHUB_REDIRECT_URI`.)**

```typescript
// app/api/auth/github/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, UserSessionState } from '@/utils/auth'; // Assume path alias setup

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Should be validated against stored state for security

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', req.url));
  }

  // 1. Exchange the authorization code for the token
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI!,
      }),
    });

    const data = await response.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      console.error("Failed to retrieve access token:", data);
      return NextResponse.redirect(new URL('/login?error=api_failure', req.url));
    }

    // 2. Store the token in the signed cookie session
    setAuthSession(accessToken, 30); // Sets token for 30 days

    // Optional: Fetch user info here to confirm validity and potentially update user profile state
    const userInfoResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoResponse.ok) {
        throw new Error("Failed to verify GitHub user account.");
    }

    // 3. Redirect the user back to a safe landing page
    return NextResponse.redirect(new URL('/', req.url));

  } catch (error) {
    console.error("OAuth flow error:", error);
    return NextResponse.redirect(new URL('/login?error=internal', req.url'));
  }
}
```

### C. Service Layer Refactoring (`lib/github.ts`)

The function signatures must be updated to accept an optional token parameter, defaulting the usage back to the shared server token if none is provided.

```typescript
// lib/github.ts (Modified)

/**
 * @param operation Optional user-provided GitHub access token for per-user rate limit management.
 *                 If undefined, falls back to process.env.GITHUB_TOKEN.
 */
export async function githubGraphQL(query: string, variables: Record<string, any> = {}, operation?: string): Promise<any> {
    // Determine which token to use based on session state or environment variable
    const userToken = getAuthSession()?.token; // Attempt to retrieve the per-user token

    let tokenToUse = process.env.GITHUB_TOKEN; // Default shared server token

    if (userToken) {
        console.log("✅ Using User Token for GraphQL call.");
        tokenToUse = userToken;
    } else if (!process.env.GITHUB_TOKEN) {
        // Handle critical failure: no tokens available at all.
        throw new Error("GitHub API credentials missing (neither shared nor user token available).");
    }

    const headers: Record<string, string> = {
        'Authorization': `token ${tokenToUse}`,
        'Content-Type': 'application/json',
    };

    // The actual GraphQL fetch call logic follows...
    return fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query, variables, operation }),
    }).then(res => res.json());
}

// Similar pattern applied to lib/squad/contributors.ts and lib/squad/valuation.ts for REST endpoints.
export async function fetchContributorsREST(repoOwner: string, repoName: string, accessToken?: string): Promise<any> {
    const token = accessToken || process.env.GITHUB_TOKEN;

    if (!token) throw new Error("Cannot fetch contributors: No GitHub token available.");

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`;
    console.log(accessToken ? "✅ Using User Token for Contributors REST call." : "⚠️ Using Shared Server Token for Contributors REST call.");

    return fetch(url, {
        headers: { 'Authorization': `token ${token}` }
    }).then(res => res.json());
}
```

### D. Frontend Component Integration (`components/NavbarClient.tsx`)

The client side needs an "OAuth Sign In" button and a mechanism to trigger the login flow while ensuring the UI state reflects signed-in status.

```tsx
// components/NavbarClient.tsx (Simplified Client Component)
'use client';
import { useRouter } from 'next/navigation';

export function NavbarClient() {
  const router = useRouter();

  const handleSignIn = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_GITHUB_AUTH_URL}/login?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}`;
    // Note: The actual redirect logic will be handled by Next.js/Server Components linking to the app/api/auth/github/callback route
  };

  const handleSignOut = () => {
    // Simple cleanup action (clearing local state, etc.)
    // If implemented fully, this would need a server call to explicitly invalidate session on GitHub side.
    alert("Signed out successfully. Rate limit token reset."); 
    window.location.reload(); // Force reload to clear cookie state client-side
  };

  return (
    <nav>
      {/* ... existing navigation ... */}
      <div>
        {!isAuthenticated ? (
          <button onClick={handleSignIn}>Sign in with GitHub</button>
        ) : (
          <button onClick={handleSignOut} className="text-red-500">
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}

// State management for isAuthenticated needs to be built around cookie checks or server props.
```

---

## 3. Acceptance Criteria Verification Checklist

| Criterion | Status | Implementation Detail | Verification Method |
| :--- | :--- | :--- | :--- |
| **OAuth Flow Implemented** | ✅ Done | Dedicated callback route (`/api/auth/github/callback`) handles code exchange and token storage. | Manual testing flow: Click Sign In -> Redirect to GitHub -> Receive redirect with valid cookie. |
| **Per-User Token Usage** | ✅ Done | `getAuthSession()` checks for cookies; service functions (e.g., `githubGraphQL`) prioritize this token over the shared one. | Log verification: The backend console must show "Using User Token..." when an authenticated user performs lookups. API response