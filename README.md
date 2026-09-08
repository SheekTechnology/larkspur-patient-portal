# Larkspur Patient Portal

A React single-page front-end for the **Larkspur Patient Portal** Knack app.
Knack owns the data model, authentication, and access control. This app is UI only.

## Architecture

- **Backend — Knack.** Data, users, and Data Access Control. No other database.
- **Frontend — this repo.** React + Vite + TypeScript + Tailwind, talking to the
  Knack Live-App API over OAuth 2.0 (Authorization Code + PKCE), entirely client-side.

## Roles

| Knack profile | Route | View |
|---|---|---|
| `profile_4` Patients | `/patient` | Own appointments, documents, details |
| `profile_5` Providers | `/provider` | Schedule and patient roster |
| `profile_8` Clinic Admin | `/admin` | Practice-wide overview |
| `all_users` | `/welcome` | Landing page for users with no role yet |

## Access control

Record visibility is enforced by **Knack Data Access Control**, server-side.

This app deliberately does **not** filter by the logged-in user's ID. Knack already
restricts every response to the records that user may see, so a client-side filter
would be redundant and would mask real permission problems.

## Local development

```bash
npm install
npm run dev     # https://localhost:5173
```

The dev server runs over **HTTPS** with a self-signed certificate, because Knack only
accepts `https` OAuth redirect URIs. Your browser will warn on first load — accept it.

## Configuration

`src/knack/config.ts` holds the app id, API base URL, and OAuth client id. None of
these are secrets: the flow uses PKCE and has no client secret. The private Knack REST
API key is never used here and must never be added.

## Registered redirect URIs

Both are registered against the OAuth client. Adding a domain means re-registering:

- `https://larkspur-patient-portal.pages.dev/auth/callback`
- `https://localhost:5173/auth/callback`

> Changing the app's public URL requires re-registering the redirect URI, which signs
> out everyone with an active session.
