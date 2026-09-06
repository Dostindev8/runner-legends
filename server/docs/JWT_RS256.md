# JWT RS256 (optional) — progression server

## Behavior

`AuthModule` selects the signing algorithm from env:

| Env | Algorithm |
|---|---|
| `JWT_PRIVATE_KEY` **and** `JWT_PUBLIC_KEY` both set | **RS256** (asymmetric) |
| Otherwise | **HS256** with `JWT_SECRET` (default / existing deploys) |

Keys may be pasted as single-line PEMs with literal `\n` escapes; the loader expands them.

## HttpOnly cookies (client future EXTEND)

Mega prompt v3.0 prefers access tokens in **HttpOnly / Secure / SameSite** cookies, never `localStorage`. The progression API still returns `accessToken` in JSON for current clients. When the client is ready:

1. Set the token on `Set-Cookie` from login/register.
2. Send `credentials: 'include'` on API calls.
3. Keep Bearer header support during migration.

Do not remove HS256 until every environment has rotated to RS256 keypairs.
