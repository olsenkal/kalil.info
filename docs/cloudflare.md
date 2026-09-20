# Cloudflare and GitHub security setup for kalil.info

A checklist of dashboard steps to do yourself (nothing here can be done from the repo). Order matters little, but do them one at a time and verify each with the curl checks in section 6.

Accuracy note: the site facts (inline script hash, what the pages load) were measured from a local Hugo build. Cloudflare and GitHub dashboard labels change over time; anything marked **(unverified UI)** was written from documentation and memory, not from clicking through the live dashboard, so expect small wording differences.

Never paste real tokens, zone IDs, or account IDs into the repo (it is public). They belong only in Cloudflare and GitHub Secrets.

---

## 1. Verify the domain in GitHub (prevents domain takeover)

Why: without verification, someone else who points a GitHub Pages site at `kalil.info` during a DNS lapse could serve content on it. A verified domain is locked to your account.

1. GitHub: profile picture > **Settings** > **Pages** (left sidebar, "Code, planning, and automation") > **Add a domain**. **(unverified UI)**
2. Enter `kalil.info`. GitHub then shows a **TXT record** name and value for you to add. Copy them exactly from GitHub; they are specific to your account and are not reproduced here.
3. Cloudflare: **DNS** > **Records** > **Add record**: Type `TXT`, Name and Content as GitHub gave them. TXT records are not proxied; leave TTL on Auto.
4. Back in GitHub, click **Verify**. DNS can take a few minutes; retry if it says not found.
5. Keep the TXT record permanently. If you delete it, verification lapses.

Check from a terminal (substitute the name GitHub gave you):

    dig +short TXT <name-from-github>.kalil.info

This is separate from the existing repo-level custom domain (`static/CNAME`), which stays as is.

---

## 2. Cloudflare Web Analytics

1. Cloudflare dashboard > **Analytics & Logs** > **Web Analytics** > **Add a site** (or Add site). **(unverified UI)**
2. Choose `kalil.info`. Because the site is proxied (orange cloud) through Cloudflare, you can pick the automatic setup, where Cloudflare injects the beacon into HTML responses at the edge. **No change to the Hugo templates or repo is needed.**
3. Give it a few minutes, then view the page source of https://kalil.info and look for `static.cloudflareinsights.com/beacon.min.js`. If it is missing, check that the site is still proxied and that the Web Analytics setting is enabled for the hostname.
4. If you enforce a Content-Security-Policy (section 4), it must allow the beacon script and its reporting endpoint, or analytics silently stop working. The policy in section 4 already includes them.

Privacy note: Cloudflare Web Analytics does not use cookies and does not fingerprint visitors, per Cloudflare's documentation.

---

## 3. Security response headers (Transform Rule)

GitHub Pages does not let you set headers, so Cloudflare adds them at the edge.

Dashboard: **Rules** > **Transform Rules** > **Modify Response Header** > **Create rule**. **(unverified UI)**

- Rule name: `Security headers`
- When incoming requests match: **Custom filter expression**, `Hostname` `equals` `kalil.info` (expression editor: `(http.host eq "kalil.info")`). Do not apply it to all subdomains.
- Then: add one **Set static** entry per header below.

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### HSTS

Either use the Cloudflare setting **SSL/TLS > Edge Certificates > HTTP Strict Transport Security (HSTS)** or set the header in the Transform Rule. Use one, not both, so the values cannot disagree.

Recommended starting point:

    Strict-Transport-Security: max-age=300

- Start with a short `max-age` (300 = 5 minutes), confirm the site works over HTTPS everywhere, then raise it in steps (for example 86400, then 2592000, then 15552000 or more).
- Do **not** add `includeSubDomains` or `preload` until you are sure. `includeSubDomains` forces HTTPS on every subdomain of `kalil.info` for the max-age period, which can break any subdomain that is HTTP-only or has a certificate problem, for example tunnel hostnames or homelab services. `preload` is effectively permanent and hard to undo. If you use the Cloudflare HSTS setting, leave "Include subdomains" and "Preload" off.
- GitHub Pages may already send its own HSTS header; check the current response (section 6) before adding another.

---

## 4. Content-Security-Policy fitted to this site

### What the site actually loads (measured from a local build of 23 pages)

- Stylesheet: one same-origin file, `/css/bundle.min.<hash>.css`. No `@import`, no `url()`, no webfonts (Georgia and system fonts only).
- Scripts: same-origin `/js/theme.min.js` and `/js/lightbox.min.js` (gallery pages only), both `defer`, plus **one inline `<script>`** in `<head>` (the theme boot script) present on every page. No inline event handlers (`onclick=` etc.): none found.
- Images: same-origin only (gallery thumbnails are generated WebP; og image and favicon are same-origin). No `data:` URIs, iframes, forms, or third-party URLs found.
- Inline `<svg>` elements (monogram, icons) are markup, not a CSP issue.
- **Inline `style=` attributes: 3 occurrences on one page** (`/writing/hello-world/`), all from Hugo's syntax highlighter: one `<pre style="color:...;background-color:...">` and two `<span style="display:flex">`. Cause: `hugo.toml` has `markup.highlight.noClasses = true`, so every highlighted code block carries inline styles. Hugo also has `markup.goldmark.renderer.unsafe = true`, so raw HTML in Markdown could add more later.
- No `<style>` blocks.

### The inline-script hash

Value from the minified build output (`hugo --gc --minify`):

    'sha256-p0dTuQa+s03teJj7uBSVbGnSrucoYbl82pqs3gwbfBM='

How it was computed: take the text between `<script>` and `</script>` in the built `index.html` (exactly, no trailing newline), SHA-256 it, base64 it. All 22 pages that carry the inline script had byte-identical text.

Recompute after any change (run from the repo root, or point at the live site):

    hugo --gc --minify --destination /tmp/hugo-check >/dev/null && grep -o '<script>[^<]*</script>' /tmp/hugo-check/index.html | head -1 | sed 's#^<script>##;s#</script>$##' | tr -d '\n' | openssl dgst -sha256 -binary | openssl base64

Live-site variant (this hashes what the browser really receives, so it also catches edge rewriting):

    curl -s https://kalil.info/ | grep -o '<script>[^<]*</script>' | head -1 | sed 's#^<script>##;s#</script>$##' | tr -d '\n' | openssl dgst -sha256 -binary | openssl base64

The hash changes whenever the script text changes (`layouts/_partials/head.html`) **or Hugo's minification of it changes** (for example a Hugo upgrade). When that happens the policy blocks the script: the theme flashes to the wrong mode before first paint and the console shows a CSP violation. Update the hash in the Transform Rule after any such change. Cloudflare features that rewrite HTML (Auto Minify, Rocket Loader, Email Address Obfuscation) can also alter or add inline scripts; keep them off, or use the live-site hash check.

### The policy

    default-src 'self'; script-src 'self' 'sha256-p0dTuQa+s03teJj7uBSVbGnSrucoYbl82pqs3gwbfBM=' https://static.cloudflareinsights.com; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'

Notes on each part:

- `script-src`: self covers theme.js and lightbox.js; the hash covers the inline boot script; `static.cloudflareinsights.com` is the Web Analytics beacon script.
- `connect-src`: the beacon reports to `cloudflareinsights.com`. (Cloudflare's docs list this; if the console shows blocked requests to another Cloudflare Insights host, add that host. **unverified against a live beacon**.)
- `style-src 'self'` covers the stylesheet. `style-src-attr 'unsafe-inline'` allows only `style="..."` attributes (needed for code blocks, above) without allowing inline `<style>` blocks. Better fix: set `noClasses = false` in `hugo.toml` and generate a highlight stylesheet (`hugo gen chromastyles --style=dracula`), then drop `style-src-attr` and the site needs no inline styles at all. That is a repo change, not done here.
- `img-src ... data:` is harmless headroom (no `data:` images currently exist); remove it if you prefer strict.
- `frame-ancestors` only works as an HTTP header (ignored in `<meta>` CSPs), which is another reason to use the Transform Rule.

### Rollout: report-only first

1. Add a Transform Rule header (Set static): name `Content-Security-Policy-Report-Only`, value = the policy above. No reporting endpoint is configured, so violations appear only in the browser console (that is enough for a site this small).
2. Load the home page, a writing page, `/writing/hello-world/` (code block), a gallery page (lightbox), and toggle dark mode. Open DevTools > Console and look for "Content-Security-Policy" / "Refused to ..." messages. Toggle the theme, reload, and confirm there is no flash of the wrong theme.
3. Confirm Web Analytics is not blocked (no violations mentioning `cloudflareinsights`).
4. When clean, change the header name to `Content-Security-Policy` (same value). Re-run the checks. Remove the Report-Only header afterwards so the two do not both appear.

---

## 5. Cache purge from CI (API token and secrets)

Another change adds an optional deploy-workflow step that purges the Cloudflare cache after each deploy. It reads two GitHub secrets and skips itself when they are unset, so the site deploys fine without them.

### Create the token

1. Cloudflare dashboard > profile icon > **My Profile** > **API Tokens** > **Create Token**. **(unverified UI)**
2. Choose **Create Custom Token** and give it a name like `kalil.info cache purge`.
3. Permissions: **Zone** > **Cache Purge** > **Purge**. Nothing else.
4. Zone Resources: **Include** > **Specific zone** > `kalil.info`. Do not use "All zones".
5. Optionally set an expiry and client IP filtering (GitHub Actions runner IPs vary, so skip IP filtering).
6. Create it and copy the token once; Cloudflare will not show it again.

### Find the zone ID

Cloudflare dashboard > `kalil.info` > **Overview**: the **Zone ID** is on the right-hand side, under "API". **(unverified UI)**

### Add the GitHub secrets

GitHub repo `olsenkal/kalil.info` > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**:

- `CLOUDFLARE_ZONE_ID` = the zone ID
- `CLOUDFLARE_API_TOKEN` = the token

Test the token (run in your own terminal; do not save it in shell history files you commit):

    curl -s -H "Authorization: Bearer $TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify

A good token returns `"status":"active"`. (Scoped tokens can verify this way even without other permissions.)

To revoke: My Profile > API Tokens > the token > Roll or Delete, then update or delete the GitHub secret.

---

## 6. Verify each change (curl) and roll back

Headers (use `-I` for a HEAD request; if HEAD is treated differently, use `curl -s -D - -o /dev/null https://kalil.info/`):

    curl -sI https://kalil.info/ | grep -iE 'strict-transport|x-content-type|referrer-policy|permissions-policy|content-security|cf-cache-status|server'

Expected after section 3: the three `nosniff`, `strict-origin-when-cross-origin`, and `camera=(), microphone=(), geolocation=()` headers, and `strict-transport-security: max-age=300` (or your chosen value). Cloudflare edge caching may briefly serve old headers; Transform Rules run on responses at the edge, so they normally apply immediately, but if not, purge the cache (Caching > Configuration > Purge Everything).

Also check a non-HTML asset, a `www` redirect, and an HTTP request:

    curl -sI https://kalil.info/css/ | head -5
    curl -sI https://www.kalil.info/ | grep -iE '^(HTTP|location)'
    curl -sI http://kalil.info/ | grep -iE '^(HTTP|location)'

| Change | How to verify | Rollback |
| --- | --- | --- |
| Domain verification (1) | `dig +short TXT <name>`; GitHub Pages settings shows a "Verified" badge | Delete the domain from GitHub Pages > Verified domains, then remove the TXT record. Deleting the TXT record alone eventually un-verifies it |
| Web Analytics (2) | View source shows the beacon; data appears in the dashboard after some time | Web Analytics > site > Delete or disable automatic setup |
| Headers (3) | `curl -sI` grep above | Transform Rules > disable or delete the rule (immediate). If HSTS was set via SSL/TLS settings, set max-age to 0 (browsers that already saw a long max-age keep it until it expires, which is why you start short) |
| CSP report-only (4) | Console shows no "Refused to" messages; header present in curl | Delete the `Content-Security-Policy-Report-Only` header entry |
| CSP enforced (4) | Site renders, theme toggle works, gallery lightbox works, no console violations | Disable the rule, or rename back to `-Report-Only`. This restores the site instantly; nothing in the repo needs reverting |
| Cache purge (5) | Push a change; the workflow's purge step logs success; curl shows `cf-cache-status: MISS` or `EXPIRED` on the first request afterward | Delete the two GitHub secrets (the step then skips) and revoke the token |

Emergency: if the site looks broken and you are unsure why, disable the Transform Rule first. It is the only thing in this guide that changes what visitors receive from the site.
