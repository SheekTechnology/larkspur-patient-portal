# Larkspur Patient Portal

React front end for the **Larkspur Patient Portal** Knack app. Knack owns the data,
the user accounts, and the access rules. This repo is UI only.

## Architecture

- **Backend: Knack.** App id and API base are in `src/knack/config.ts`.
- **Auth: Knack OAuth 2.0** (authorization code + PKCE), entirely client-side.
  Tokens live in `sessionStorage`. See `src/knack/oauth.ts`.
- **Frontend:** React 18 + Vite + TypeScript + Tailwind.

## Roles and routes

| Knack profile | Route | View |
|---|---|---|
| `profile_4` Patients | `/patient` | `src/views/PatientView.tsx` |
| `profile_5` Providers | `/provider` | `src/views/ProviderView.tsx` |
| `profile_8` Clinic Admin | `/admin` | `src/views/AdminView.tsx` |
| `all_users` | `/welcome` | `src/routes/Misc.tsx` |

One purpose-built view per role. Do not build a single view with role conditionals.

## Messaging

Patients send messages to the clinic from the patient view. Each message records the
patient twice, on purpose:

- **`Owned By`** is stamped by Knack from the bearer token. It points at the Accounts
  record and is what Data Access Control uses to scope reads, so a patient sees only
  their own messages without any filter in the frontend.
- **`Patient`** (`field_104`) is an explicit connection to the Patients table, written on
  create. This is what the clinic sees, and what any future report or filter would use.

The connection is written with `user.roleRecordIds['profile_4']`, the Patients role
record id. `session.user.id` is the account id and would link nothing.

Patients can create and read their own messages and cannot see anyone else's. Providers
can read all of them. Clinic Admin has full control and sees them in the admin view.

## Rules that matter

**Never filter records by the logged-in user.** Knack's Data Access Control scopes every
API response server-side. A client-side filter is redundant and hides real permission
problems. The one exception is `ProviderView`, which filters appointments by the
provider's connection field, because appointments are owned by the patient and DAC cannot
scope them two ways. That filter is a display convenience, not a security boundary, and
it is commented as such.

**Account id and role record id are different.** `session.user.id` is the Accounts record.
Connection fields pointing at a user role table need the role record id, resolved at login
into `user.roleRecordIds[profileKey]`. Using the wrong one returns an empty list with no
error.

**Read `_raw`, never the formatted value.** Formatted values are HTML. Helpers are in
`src/knack/format.ts`.

**Send only changed fields on update.** A partial update leaves everything else untouched,
so a wrong write format cannot blank a field the user did not edit.

**Never add a private Knack REST API key.** The OAuth flow uses PKCE and needs no secret.
A private key in frontend code is readable by every visitor and bypasses all access rules.

## Field write formats, tested

Reads return structures; writes do not always take the same shape. Verified against live
fields on 9 September 2026. Wrong shapes return **HTTP 200 and store nothing**.

| Type | Write as |
|---|---|
| `phone` | plain string, e.g. `"5551234567"` — object shapes blank the field |
| `date_time` | `{ date, hours, minutes, am_pm }` — the `time` key is ignored and the time becomes midnight |
| `name` | `{ first, last }` |
| `email` | `{ email, label }` |
| `address` | `{ street, city, state, zip }` |
| `link` | `{ url, label }` |
| `currency` | `"50.75"` |
| `connection` | `[{ id }]` — also accepts a bare id, an array of ids, or a bare object |

## Commands

```bash
npm run dev      # https://localhost:5173
npm run build    # typecheck + production build
```

The dev server runs over HTTPS with a self-signed certificate, because Knack only accepts
`https` OAuth redirect URIs. The browser warns once; accept it.

## Deploying

Push to `main`. Cloudflare rebuilds and publishes automatically.

Registered redirect URIs, which must match exactly:

- `https://larkspur-patient-portal.ranasha.workers.dev/auth/callback`
- `https://localhost:5173/auth/callback`

Changing the app's address means re-registering it with Knack, which signs out everyone
with an active session.

`wrangler.jsonc` tells Cloudflare where the build output is and to serve the app for
addresses it does not recognise. Without that second setting, `/auth/callback` returns 404
and sign-in breaks.
