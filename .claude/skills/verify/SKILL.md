---
name: verify
description: Build and drive CartaYa (Express + React/Vite, SQLite) to observe a change at runtime.
---

# Verifying CartaYa

Single Node process serving both the API and the built React SPA. No
separate frontend dev server needed for verification — build once,
run the Express server, drive it with a real browser.

## Build + launch (isolated instance, doesn't touch the real dev DB)

```bash
npm --prefix web run build   # only if web/src changed
VERIFY_DIR=$(mktemp -d)
CARTAYA_DATA_DIR="$VERIFY_DIR" PORT=3901 nohup node server/index.js > /tmp/verify-server.log 2>&1 & disown
sleep 1.5; cat /tmp/verify-server.log   # confirms "CartaYa escuchando en http://localhost:3901"
```

- `CARTAYA_DATA_DIR` isolates the SQLite file so you don't pollute
  the real dev database (`data/cartaya.db`) with test orders/tables.
- With `NODE_ENV` unset (not `production`), the admin password
  defaults to `cartaya-dev` and dev seed data is inserted on first
  boot: one category "Bebidas", one plato "Café con leche" (id 1),
  one mesa "Mesa 1" with **fixed token `mesa-desarrollo-token`** — use
  that instead of hunting for a real token.
- Cleanup: `taskkill //F //PID <pid>` (find it via
  `netstat -ano | grep LISTENING | grep 3901`) then `rm -rf "$VERIFY_DIR"`.

## Surfaces to drive

- Customer table menu: `http://localhost:3901/mesa/mesa-desarrollo-token`
  — add to cart, note field, confirm → shows "Pedido nº N".
- Admin catalog: `http://localhost:3901/admin` — session-gated,
  password `cartaya-dev`.
- Kitchen panel: `http://localhost:3901/cocina` — same session
  mechanism as `/admin` (same cookie), Activos/Histórico tabs.

Use the `browser-automation` skill. Session cookie is `HttpOnly` so
`document.cookie` won't show it — to submit the login form via
`--eval`, set the password input's `.value` and dispatch an `input`
event before `form.requestSubmit()`; don't try to read/set the cookie
directly. Same-origin `fetch()` inside `page.evaluate` sends the
cookie automatically, which is the easiest way to probe the API as an
authenticated session without re-deriving a cookie string.

## Gotchas hit during verification

- **SSE + compression**: `server/app.js` excludes
  `/api/admin/pedidos/eventos` from `compression()` using
  `req.originalUrl`, not `req.path` — at the point compression's
  filter runs (first `res.write`, with the SSE connection already
  open), Express has stripped `req.path` down to the tail segment
  from descending into the nested `/api/admin/pedidos` routers, and
  never restores it because the SSE handler never calls `next()`. If
  you ever touch that filter, re-verify by watching a real SSE
  stream (e.g. curl `--no-buffer` or the browser fetch), not just the
  HTTP status.
- **Real-time cross-connection test**: open the kitchen panel in one
  `--session`, then place an order from a *separate* one-shot browser
  call against `/mesa/...` — confirms the SSE event actually crosses
  connections, not just "the page that made the request re-rendered."
- **Reconnect/resync**: navigate the panel session to `about:blank`
  and back to `/cocina` to force a real SSE disconnect+reconnect and
  confirm the initial-load fetch resyncs orders created while
  "offline" — this is the actual risk called out in the change's
  design doc.
