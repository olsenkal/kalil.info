# kalil.info

Personal site for Kalil Olsen: a blog, how-tos, reviews, homelab notes, project case studies, music, and a low-key image gallery. Built with Hugo, hosted on GitHub Pages, served at [kalil.info](https://kalil.info) behind Cloudflare.

This document describes the site as it stands, how it's put together, why key decisions were made, and how to work on it.

- **Repo:** [olsenkal/kalil.info](https://github.com/olsenkal/kalil.info) (public; required for Pages on a free account)
- **Live:** https://kalil.info (`www` redirects to the apex)
- **Generator:** Hugo extended v0.166.0, custom theme (no third-party theme)
- **Deploy:** push to `main`, GitHub Actions builds and publishes in about a minute

---

## 1. Status

| Area | State |
| --- | --- |
| Site design, templates, structure | Done (overhaul phase 1 complete) |
| Domain, HTTPS, Cloudflare proxy | Done and verified |
| CI/CD | Done, deploys on every push to `main` |
| Image privacy guards | Done (see section 8) |
| Cloudflare hardening (headers, CSP, analytics) | Guide written, dashboard steps pending (`docs/cloudflare.md`) |
| **Real content** | **Not started.** Everything is placeholder text marked `TODO` (see section 10) |

The structure is final. Only content is TODO.

---

## 2. Goals and scope

The site is a personal brand hub for a mixed audience: recruiters and clients, peers in tech, and friends and family. Content areas: blog, how-tos, reviews, homelab, project case studies, professional experience, music, and personal life.

Design decisions that follow from that:

- **One content stream, many facets.** Everything written lives in one `writing` section, separated by categories and tags. This avoids several sections that all need upkeep.
- **Distinct sections only where the layout genuinely differs:** Projects (case studies), Homelab (a hub), Gallery (images), plus About, Now, Uses, Resume, Music, Contact.
- **Photography is de-emphasized.** It's a footer-linked Gallery for any kind of image (photos, rack builds, screenshots).
- **Visual direction:** clean and editorial: whitespace, serif headings, light and dark mode.

---

## 3. Architecture

```
Markdown + Hugo templates
        |
        |  git push to main
        v
GitHub Actions  ->  EXIF check -> hugo --gc --minify  ->  GitHub Pages
                                                              |
                                            Cloudflare (proxy, SSL Full strict)
                                                              |
                                                         kalil.info
```

- **Hugo** builds the static site. No Node toolchain, no runtime, one binary (installed locally via Homebrew; CI installs the same pinned version).
- **GitHub Pages** hosts it. The Pages source is "GitHub Actions" (not the legacy `gh-pages` branch).
- **Cloudflare** is the DNS provider and a reverse proxy in front of Pages.

---

## 4. Repository layout

```
hugo.toml                  Site config, params, menus
archetypes/                Templates for `hugo new content --kind <kind>`
  default.md  howto.md  homelab.md  review.md  life.md  research.md  projects.md
assets/
  css/main.css             Base styling (CSS variables)
  css/ext-*.css            Feature stylesheets, auto-appended after main.css
                           (ext-home.css, ext-content-model.css)
  js/theme.js              Dark mode toggle
  js/lightbox.js           Gallery lightbox (loaded only on gallery pages)
content/
  _index.md                Homepage (optional intro text)
  about.md  now.md  uses.md  resume.md  contact.md  homelab.md  music.md
  writing/                 Blog / how-to / review / homelab / life / research / work
  projects/                Case studies
  gallery/<collection>/    Image collections (page bundles)
docs/
  cloudflare.md            Dashboard guide: headers, CSP, analytics, cache purge
layouts/
  baseof.html              Page shell, theme script, scripts block
  home.html  page.html  section.html  taxonomy.html  term.html  404.html
  homelab/page.html        Homelab hub
  contact/page.html        Contact page
  projects/{page,section}.html   Case-study page and card grid
  gallery/{page,section}.html    Gallery collection and index
  _partials/               head, header, footer, monogram, socials,
                           post-meta, post-item, project-card,
                           album-card, pagination
scripts/
  strip-exif.sh            Strip (or --check for) image metadata
  og/                      Source and script that regenerate the share image
.githooks/pre-commit       Strips EXIF from staged images
static/
  CNAME                    Custom domain marker (kalil.info)
  .nojekyll                Prevents Pages from mangling underscore paths
  favicon.svg              Monogram as SVG paths, adapts to dark mode
  og-default.png           Default share-card image (1200x630)
.github/workflows/pages.yml    Check, build, deploy, optional cache purge
```

---

## 5. Design system

**Direction:** "Clean and editorial" (chosen from three mockups).

**Typography:** Georgia (serif) for headings and the wordmark; system sans-serif for body; a system monospace stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) for metadata (dates, tags, status badges, spec tables). No webfonts, so nothing to load or license.

**Color tokens** (CSS variables in `assets/css/main.css`):

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#faf9f6` | `#141412` |
| `--fg` | `#1c1c1a` | `#ecebe6` |
| `--muted` | `#6b6a65` | `#a09f98` |
| `--line` | `#e6e3dc` | `#2b2a27` |
| `--card` | `#f2f0ea` | `#1e1d1a` |
| `--accent` (rust) | `#9a3f1d` | `#e08a62` |
| `--accent2` (teal) | `#1d6b73` | `#5fbdc4` |

Rust is the primary accent (links, monogram). Teal is the second accent (section-heading rules, card top edges, category labels, tag hover, callouts, "running" badges).

**CSS structure:** `head.html` concatenates `main.css` with every `assets/css/ext-*.css` (alphabetical), then minifies and fingerprints the bundle. Add a feature stylesheet by creating a new `ext-<name>.css`; no template change needed.

**Dark mode:** follows the system setting by default. A header toggle overrides it and stores the choice in `localStorage`. A small inline script in `<head>` sets the theme before first paint to avoid a flash. The CSS uses `prefers-color-scheme` plus a `data-theme` attribute so an explicit choice always wins.

**Monogram:** an outlined, sharp-cornered square with a serif "K" and a teal underline (selected from about 30 variations). It appears in the header and homepage hero (inline SVG using the theme variables; the K is `<text>`, so it can vary slightly by font) and as the favicon (`static/favicon.svg`, where the K is an SVG path extracted from Georgia Bold so it renders identically everywhere, with its own dark-mode media query).

**Share card:** `static/og-default.png` (monogram, name, teal rule, domain; no tagline). Regenerate with the source and script in `scripts/og/`.

**Responsive:** single-column reading width (46rem). Card grids reflow automatically. Below about 34rem the header nav drops to its own row beneath the name and toggle.

---

## 6. Features

- **Header nav:** Writing, Projects, Homelab, Resume, About. **Footer:** Now, Uses, Gallery, Music, Contact, Tags, RSS, plus social links when set.
- **Homepage:** hero (monogram, headline, one-line subline); a **Now snippet** (the `summary` front matter from `now.md`, hidden when absent); three **audience doors** defined in `params.startHere`:
  - **Work** (recruiters, clients): Resume
  - **Build** (peers): Projects, Homelab
  - **Life** (friends and family): life posts, Gallery, Music
  A door link with `ifPage` renders only when that page exists, so it can never 404. The homepage also shows latest writing (5) and featured projects (3).
- **Writing:** one stream at `/writing/`. Fixed categories, exactly one per post: `how-to`, `homelab`, `review`, `life`, `research`, `work`. Tags are free-form. Shows date, an "Updated" date when `lastmod` differs, reading time, and category. Paginated at 10.
- **Post front matter that renders:** `status` (badge), `tested_versions` (mono text), and for reviews `verdict`, `time_used`, `pros`, `cons` (shown as a callout; `pros`/`cons` accept a list or a string).
- **Homelab hub (`/homelab/`):** hand-written overview sections, then automatically lists projects marked `homelab: true` under "Builds" and all posts in the `homelab` category under "Write-ups".
- **Projects as case studies:** front matter drives a facts block (role, dates, status, stack, repo, write-up link) and an "Outcome" callout; the body follows Problem, Approach, Result. `status` is a badge on the card and in the facts block.
- **Gallery:** each collection is a folder of images. Hugo generates thumbnails and web-sized WebP. **Only the processed WebP renditions are published**; original files stay in the repo and are not copied to the site (`publishResources: false`, cascaded from `content/gallery/_index.md`). Hugo's WebP output carries no EXIF or GPS. A lightbox opens images in place (arrows, keyboard, swipe, click-outside-to-close, scroll lock), falling back to plain image links without JavaScript.
- **Contact page:** an "Open to" card list (from front matter), email, and social links. Email and socials are blank until set in `hugo.toml`.
- **Also:** About, Now, Uses, Resume, and Music pages; tag and category index pages; RSS (site and per section); sitemap; `robots.txt`; 404 page; canonical URLs; Open Graph and Twitter card tags; skip-to-content link; syntax-highlighted code blocks.

---

## 7. Hosting, domain, and Cloudflare

### GitHub
- Repo `olsenkal/kalil.info`, public.
- Pages source: **GitHub Actions**. Custom domain: `kalil.info`. **Enforce HTTPS: on.** The certificate is issued by GitHub and renews automatically.
- Workflow (`.github/workflows/pages.yml`), triggered on push to `main` and manually:
  1. **build job:** installs the pinned Hugo extended version, **fails the build if any committed image under `content/` has GPS tags** (`scripts/strip-exif.sh --check`, using `libimage-exiftool-perl`), runs `hugo --gc --minify`, uploads `public/`.
  2. **deploy job:** `actions/deploy-pages`.
  3. **purge-cache job (optional):** purges the Cloudflare cache after deploy. It skips cleanly unless the repo secrets `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` are both set (token scoped to Cache Purge on this zone only).
- Action versions: checkout v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5. Note: upload-pages-artifact v4+ skips dotfiles, so `static/.nojekyll` is not in the artifact; that's harmless for Actions-based deploys.

### DNS (Cloudflare)
- Apex `kalil.info`: four `A` records to GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and four `AAAA` records (`2606:50c0:8000::153` through `8003::153`).
- `www`: `CNAME` to `olsenkal.github.io`.
- Email records (MX, SPF, DKIM, DMARC) are separate and must be left alone.
- Source for the IPs: GitHub's "Managing a custom domain for your GitHub Pages site" documentation.

### Cloudflare proxy
- Records are **proxied** (orange cloud). SSL/TLS mode: **Full (strict)**.
- Cloudflare cache can serve a stale page after a deploy. Set up the purge job above, or use Caching, then Purge Everything.

### Hardening guide
`docs/cloudflare.md` is a step-by-step guide for the dashboard work that must be done by hand: verify the domain in GitHub account settings, enable Cloudflare Web Analytics, add security response headers (HSTS, `nosniff`, Referrer-Policy, Permissions-Policy), a Content-Security-Policy (report-only first), and the cache-purge token and secrets.

The CSP is tied to a hash of the inline theme script in `<head>`. **Recompute the hash whenever that script or Hugo's minification changes**; the guide has a one-liner. The built HTML also has three inline `style=` attributes on code blocks (from `noClasses = true` in the highlight config), which the policy has to allow unless the highlighter is switched to a stylesheet.

### Setup order that worked (and why)
1. Records had to be **DNS only** (grey cloud) first. GitHub verifies the domain and issues its certificate by seeing its own IPs; a proxy hides them.
2. Set the custom domain in Pages, wait for the certificate (`approved`), enable Enforce HTTPS.
3. Then switch the records to proxied and set SSL mode to **Full (strict)**.

### Problems hit, and fixes
| Problem | Cause | Fix |
| --- | --- | --- |
| Could not add root A records | A stray proxied root `CNAME` (a misplaced DKIM entry) already existed; a name can't hold a CNAME and A records | Deleted the stray CNAME. Verified the real DKIM records live on the `dkimN._domainkey` subdomains and were unaffected |
| Site showed Cloudflare IPs after DNS change | Proxied records | Set to DNS only during setup |
| Local `dig` showed old IPs | Local resolver cache | Queried Cloudflare's authoritative nameserver and 1.1.1.1 to confirm the real state |
| GitHub 404 on the domain | Custom domain not yet set on the repo | Set `cname` via the Pages API |
| No certificate for ~20 minutes | GitHub hadn't validated DNS yet | Removed and re-added the custom domain to restart the check |
| **Infinite redirect loop after enabling proxy** | SSL mode was "Automatic", so Cloudflare fetched from GitHub over HTTP and GitHub redirected to HTTPS | Set SSL/TLS to **Full (strict)** |
| Push rejected | `gh` token lacked the `workflow` scope | `gh auth refresh -s workflow` |

### If HTTPS ever breaks
GitHub renews its certificate through the domain, and a proxy can interfere. Set the records to DNS only for a few minutes, let it renew, then re-enable the proxy.

---

## 8. Working on the site

### One-time local setup
```bash
brew install exiftool                       # image metadata tool
git config core.hooksPath .githooks         # enable the pre-commit EXIF stripper
```

### Local development
```bash
cd "Personal Website"
hugo server -D          # preview at http://localhost:1313, includes drafts
hugo --gc --minify      # production build into public/
```

### Publishing
```bash
git add -A && git commit -m "Add post" && git push
```
The workflow deploys automatically. Check progress with `gh run list`.

### New post
Each post type has an archetype:
```bash
hugo new content --kind howto    writing/my-post/index.md
hugo new content --kind homelab  writing/my-post/index.md
hugo new content --kind review   writing/my-post/index.md
hugo new content --kind life     writing/my-post/index.md
hugo new content --kind research writing/my-post/index.md
```
Categories are a fixed list, one per post: `how-to`, `homelab`, `review`, `life`, `research`, `work`. Tags are free-form (review them quarterly). Posts start as `draft: true`. Put images in the same folder as `index.md`. **Set `lastmod` whenever you revise a how-to** so the "Updated" date shows. Any post with `categories: [homelab]` appears on the Homelab page automatically.

Title conventions: how-to "How to set up X on Y"; homelab "Build: X" or "Incident: X"; life updates "Update: Month Year"; reviews "Review: X".

### New project (case study)
```bash
hugo new content --kind projects projects/my-project.md
```
Fill in `role`, `when`, `status` (running / retired / in progress), `stack`, `outcome`, optional `repo` and `writeup`, and the Problem, Approach, Result sections. Set `homelab: true` to also list it on the Homelab page.

### New gallery collection
Create `content/gallery/<name>/index.md` with a `title`, `date`, `description`, and optional `cover:` filename, then drop images into the same folder. Thumbnails and web sizes are generated at build time. Add per-image alt text via a `resources` list in the front matter (the default alt is the collection title).

### Images: privacy rules
The repo is public, so **original images committed to the repo are publicly downloadable from GitHub** even though the site only serves processed WebP.

- Keep source images to about 2000px on the long edge (keeps the repo well under the GitHub Pages 1 GB limit).
- The pre-commit hook strips metadata from staged images. To do it by hand: `scripts/strip-exif.sh` (or `--check` to list any files with GPS tags; exits nonzero if found).
- CI fails the build if a committed image has GPS tags.

### Pre-publish checklist
- [ ] No real IPs, hostnames, internal domains, VLAN addressing, MACs, or serial numbers
- [ ] EXIF stripped (hook and CI enforce GPS)
- [ ] No employer customer names or internal details
- [ ] No phone number or home address, including in the resume PDF
- [ ] Consent for photos of other people
- [ ] Drafts contain nothing private (the repo is public)
- [ ] Employer's outside-publishing and social media policy checked before posting anything in the `work` category or naming the employer beyond the resume

### Site-wide settings (`hugo.toml`)
- `params.tagline` / `params.subtagline`: homepage headline and line under it
- `params.email`, `params.socials.*`: contact hub (blank values are hidden)
- `params.startHere`: the three audience doors on the homepage
- `params.ogImage`: default share-card image
- `menus.main` / `menus.footer`: navigation

---

## 9. Decision log

| Decision | Rationale |
| --- | --- |
| Hugo over Jekyll or plain HTML | Single binary, no Ruby or Node toolchain, fast, built-in taxonomies, RSS, and image processing |
| Custom theme | Full control, no dependency on a third-party theme's maintenance |
| One `writing` stream with taxonomies | Blog, how-to, review, homelab, life, and research share a layout; facets are cheaper to maintain than sections |
| `/writing/` instead of `/posts/` | Matches the nav label. Done before any real content existed, since changing it later breaks links |
| Fixed category list, one per post | Predictable structure; tags stay free-form for detail |
| Header: Writing, Projects, Homelab, Resume, About | Recruiters reach the resume in one click; Contact and Music live in the footer. The page is spelled "Resume", no accent |
| Audience doors on the homepage | Three visitor types (work, peers, friends and family) each get an obvious starting point |
| `ext-*.css` bundling | Feature areas add their own stylesheet without editing `main.css` |
| GitHub Actions deploy, not `gh-pages` branch | Official, current method; keeps built output out of the repo |
| `CNAME` in `static/` | Ensures it lands in the published root on every build |
| Apex domain with A/AAAA records | CNAME at the apex conflicts with other records (mail) |
| Gallery instead of a Photography section | Photography is an infrequent hobby; a generic gallery covers photos, builds, and screenshots |
| `publishResources: false` on gallery | Without it, original (possibly GPS-tagged) images shipped in the built site next to the WebP files |
| EXIF stripped at commit and checked in CI | The repo is public; the originals in git are the exposure, not the built site |
| Lightbox in about 60 lines of vanilla JS using `<dialog>` | No dependencies; native focus handling and Escape support |
| Cloudflare proxy on, Full (strict) | Adds firewall and analytics; strict mode is required to avoid a redirect loop with GitHub's HTTPS enforcement |
| Cloudflare Web Analytics now, self-hosted Umami later | Cloudflare needs no script or cookie changes; Umami stays as an optional homelab project |
| Repo public | GitHub Pages on a free plan requires it. Don't commit anything private |

---

## 10. Outstanding work

**Kalil (content and accounts):**
- [ ] Homepage tagline and subline (`hugo.toml`; marked with a TODO comment). Then regenerate the share image if the tagline should appear on it
- [ ] `now.md`: fill in `summary` (shown on the homepage) and the page body
- [ ] `resume.md` (add `static/resume.pdf` and uncomment the link; add the consulting site link), `about.md` (bio and photo), `homelab.md`, `music.md`, `uses.md`, `contact.md`
- [ ] `params.email` and `params.socials.*` in `hugo.toml`
- [ ] Replace or delete the sample content: `writing/hello-world`, `writing/example-homelab-writeup`, `projects/example-homelab.md`, `gallery/sample-collection`
- [ ] Cloudflare and GitHub dashboard steps in `docs/cloudflare.md`: domain verification, Web Analytics, security headers, CSP, cache-purge secrets

**Technical, optional:**
- [ ] Switch the code highlighter to a stylesheet (`noClasses = false`) to drop the inline `style=` attributes and simplify the CSP
- [ ] Convert the `<text>` K in `monogram.html` to the same path used in the favicon, so the on-page monogram never varies by font
- [ ] Confirm the first CI run with the new action versions and the GPS check

**Backlog and later phases:**
1. `./new-post` helper script (wraps `hugo new content --kind`)
2. Homelab hub with a sanitized network diagram; 2 to 3 more case studies; first real gallery collection
3. Lighthouse audit (target 90+ performance and accessibility)
4. Pagefind search at 30+ posts, using the standalone binary to keep the no-Node decision
5. Optional Giscus comments on posts; newsletter (needs an outside service); `/colophon`; browser editor (Sveltia CMS)

**Maintenance cadence:** update Now monthly; publish at least one post monthly; review tags quarterly; upgrade Hugo quarterly (locally and in `pages.yml` together); re-verify how-tos and update `lastmod` every 6 months; update the resume on role or certification changes.

---

## 11. Build history

1. Scaffolded the Hugo site: custom theme, sections, RSS, dark mode, deploy workflow, `CNAME`
2. Demoted photography to a footer-linked Gallery
3. Added the Start here section, Homelab hub, case-study project pages, and Contact page
4. Created the GitHub repo, enabled Pages via Actions, pushed
5. Connected `kalil.info`: DNS, certificate, Enforce HTTPS, then Cloudflare proxy with Full (strict)
6. Added the monogram hero, teal accent, in-page lightbox, simplified headline, and mobile header fix
7. **Overhaul phase 1 (structure and safety):**
   - Renamed `posts` to `writing`; new nav; `ext-*.css` bundling
   - Six categories with archetypes; status badges and review callout; monospace metadata
   - Homepage audience doors and Now snippet; scaffolds for Resume, About, Homelab, Music, Uses
   - Image privacy: originals no longer published, EXIF strip script and pre-commit hook, CI GPS check
   - Favicon K as a path, branded share image, Cloudflare hardening guide, action version bump, optional cache-purge job

---

## 12. Notes for future maintenance

- Deploys are triggered by pushes to `main`. `public/` and `resources/` are git-ignored build output.
- Hugo is pinned to `0.166.0` in the workflow. Upgrade locally and in `pages.yml` together, and check `hugo` for deprecation warnings when doing so.
- After a deploy, if the live page looks stale, purge the Cloudflare cache and hard-refresh.
- `draft: true` content is excluded from production builds; `hugo server -D` includes it.
- If you change the inline theme script in `<head>`, recompute the CSP hash (see `docs/cloudflare.md`).
