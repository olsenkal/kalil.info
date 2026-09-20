# kalil.info

Personal site for Kalil Olsen: a blog, how-tos, reviews, homelab notes, project case studies, and a low-key image gallery. Built with Hugo, hosted on GitHub Pages, served at [kalil.info](https://kalil.info) behind Cloudflare.

This document describes the site as it stands, how it's put together, why key decisions were made, and how to work on it.

- **Repo:** [olsenkal/kalil.info](https://github.com/olsenkal/kalil.info) (public; required for Pages on a free account)
- **Live:** https://kalil.info (`www` redirects to the apex)
- **Generator:** Hugo extended v0.166.0, custom theme (no third-party theme)
- **Deploy:** push to `main`, GitHub Actions builds and publishes in about a minute

---

## 1. Status

| Area | State |
| --- | --- |
| Site design and templates | Done |
| Domain, HTTPS, Cloudflare | Done and verified |
| CI/CD | Done, deploys on every push to `main` |
| **Real content** | **Not started.** Everything is placeholder text marked `TODO` (see section 10) |

The live site currently shows placeholder content. Filling it in is the next job.

---

## 2. Goals and scope

The site is a personal brand hub, not just a blog. Requested content areas: personal blog, how-tos, photography (later demoted to a general gallery), portfolio, homelab projects, reviews, professional experience, and personal/hobby sections.

Design decisions that follow from that:

- **One content stream, many facets.** Blog, how-to, review, homelab, and life posts are all in a single `posts` section, separated by categories and tags. This avoids five separate sections that all need upkeep.
- **Distinct sections only where the layout genuinely differs:** Projects (case studies), Homelab (a hub), Gallery (images), plus About, Now, Uses, Résumé, Contact.
- **Photography is de-emphasized.** It's a footer-linked Gallery for any kind of image (photos, rack builds, screenshots), not a headline feature.
- **Visual direction:** clean and editorial: whitespace, serif headings, light and dark mode.

---

## 3. Architecture

```
Markdown + Hugo templates
        |
        |  git push to main
        v
GitHub Actions  ->  hugo --gc --minify  ->  GitHub Pages
                                                  |
                                Cloudflare (proxy, SSL Full strict)
                                                  |
                                             kalil.info
```

- **Hugo** builds the static site. No Node toolchain, no runtime, one binary (installed locally via Homebrew; CI installs the same pinned version).
- **GitHub Pages** hosts it. The Pages source is "GitHub Actions" (not the legacy `gh-pages` branch).
- **Cloudflare** is the DNS provider and, now, a reverse proxy in front of Pages.

---

## 4. Repository layout

```
hugo.toml                  Site config, params, menus
archetypes/
  default.md               Template for `hugo new content posts/...`
  projects.md              Case-study template for projects
assets/
  css/main.css             All styling (one file, CSS variables)
  js/theme.js              Dark mode toggle
  js/lightbox.js           Gallery lightbox (loaded only on gallery pages)
content/
  _index.md                Homepage (optional intro text)
  about.md  now.md  uses.md  resume.md  contact.md  homelab.md
  posts/                   Blog / how-to / review / homelab / life
  projects/                Case studies
  gallery/<collection>/    Image collections (page bundles)
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
static/
  CNAME                    Custom domain marker (kalil.info)
  .nojekyll                Prevents Pages from mangling underscore paths
  favicon.svg              Monogram, adapts to dark mode
  og-default.png           Default share-card image (placeholder)
.github/workflows/pages.yml    Build and deploy workflow
```

---

## 5. Design system

**Direction:** "Clean and editorial" (chosen from three mockups).

**Typography:** Georgia (serif) for headings and the wordmark; system sans-serif for body. No webfonts, so nothing to load or license.

**Color tokens** (all defined as CSS variables in `assets/css/main.css`):

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#faf9f6` | `#141412` |
| `--fg` | `#1c1c1a` | `#ecebe6` |
| `--muted` | `#6b6a65` | `#a09f98` |
| `--line` | `#e6e3dc` | `#2b2a27` |
| `--card` | `#f2f0ea` | `#1e1d1a` |
| `--accent` (rust) | `#9a3f1d` | `#e08a62` |
| `--accent2` (teal) | `#1d6b73` | `#5fbdc4` |

Rust is the primary accent (links, monogram). Teal is the second accent (section-heading rules, card top edges, category labels, tag hover, callouts).

**Dark mode:** follows the system setting by default. A header toggle overrides it and stores the choice in `localStorage`. A small inline script in `<head>` sets the theme before first paint to avoid a flash. The CSS uses `prefers-color-scheme` plus a `data-theme` attribute so an explicit choice always wins.

**Monogram:** an outlined, sharp-cornered square with a serif "K" and a teal underline (selected from about 30 variations across several rounds). It appears in the header and homepage hero (as inline SVG using the theme variables) and as the favicon (`static/favicon.svg`, which has its own dark-mode media query).

**Responsive:** single-column reading width (46rem). Card grids reflow automatically. Below about 34rem the header nav drops to its own row beneath the name and toggle.

---

## 6. Features

- **Homepage:** hero (monogram, headline "Hi, I'm Kalil.", one-line subline), **Start here** cards (defined in `hugo.toml`), latest writing (5), featured projects (3).
- **Writing:** one stream with categories (`how-to`, `homelab`, `review`, `life`) and free-form tags. Shows date, an "Updated" date when `lastmod` differs, reading time, and category. Paginated at 10.
- **Homelab hub (`/homelab/`):** hand-written overview sections, then automatically lists (a) projects marked `homelab: true` under "Builds" and (b) all posts in the `homelab` category under "Write-ups".
- **Projects as case studies:** front matter drives a facts block (role, dates, stack, repo, write-up link) and an "Outcome" callout; body follows Problem, Approach, Result.
- **Gallery:** each collection is a folder of images. Hugo generates thumbnails and web-sized WebP automatically. A lightbox opens images in place: arrows, keyboard (left, right, Escape), swipe, click-outside-to-close, scroll lock. Falls back to plain image links without JavaScript or on modified clicks.
- **Contact page:** an "Open to" card list (from front matter), email, and social links. Email and socials are blank until set in `hugo.toml`.
- **Also included:** About, Now, Uses, and Résumé pages; tag and category index pages; RSS (site and per section); sitemap; `robots.txt`; 404 page; canonical URLs; Open Graph and Twitter card tags; skip-to-content link; syntax-highlighted code blocks.

**Navigation:** header has Writing, Homelab, Projects, About, Contact. Footer has Now, Uses, Gallery, Résumé, Tags, RSS, plus social links when set.

---

## 7. Hosting, domain, and Cloudflare

### GitHub
- Repo `olsenkal/kalil.info`, public.
- Pages source: **GitHub Actions**. Custom domain: `kalil.info`. **Enforce HTTPS: on.** The certificate is issued by GitHub and renews automatically.
- Workflow (`.github/workflows/pages.yml`): installs the pinned Hugo extended version, runs `hugo --gc --minify`, uploads `public/`, and deploys with `actions/deploy-pages`. Triggers on push to `main` and manually.

### DNS (Cloudflare)
- Apex `kalil.info`: four `A` records to GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and four `AAAA` records (`2606:50c0:8000::153` through `8003::153`).
- `www`: `CNAME` to `olsenkal.github.io`.
- Email records (MX, SPF, DKIM, DMARC) are separate and must be left alone.
- Source for the IPs: GitHub's "Managing a custom domain for your GitHub Pages site" documentation.

### Cloudflare proxy
- Records are **proxied** (orange cloud).
- SSL/TLS mode: **Full (strict)**.
- Cloudflare cache can serve a stale page after a deploy; use Caching, then Purge Everything if an update doesn't appear.

### Setup order that worked (and why)
1. Records had to be **DNS only** (grey cloud) first. GitHub verifies the domain and issues its certificate by seeing its own IPs; a proxy hides them.
2. Set the custom domain in Pages, wait for the certificate (`approved`), enable Enforce HTTPS.
3. Then switch the records to proxied and set SSL mode to **Full (strict)**.

### Problems hit, and fixes (for future reference)
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
```bash
hugo new content posts/my-post/index.md
```
Front matter: `title`, `date`, `description`, `categories` (one of `how-to`, `homelab`, `review`, `life`), `tags`, and `draft: true` until ready. Put images in the same folder as `index.md`. Set `lastmod` when revising a how-to to show an "Updated" date. Any post with `categories: [homelab]` appears on the Homelab page automatically.

### New project (case study)
```bash
hugo new content projects/my-project.md
```
Fill in `role`, `when`, `stack`, `outcome`, optional `repo` and `writeup`, and the Problem, Approach, Result sections. Set `homelab: true` to also list it on the Homelab page.

### New gallery collection
Create `content/gallery/<name>/index.md` with a `title`, `date`, `description`, and optional `cover:` filename, then drop images into the same folder. Thumbnails and web sizes are generated at build time. Add per-image alt text via a `resources` list in the front matter (the default alt is the collection title).

### Site-wide settings (`hugo.toml`)
- `params.tagline` / `params.subtagline`: homepage headline and line under it
- `params.email`, `params.socials.*`: contact hub (blank values are hidden)
- `params.startHere`: homepage "Start here" cards
- `params.ogImage`: default share-card image
- `menus.main` / `menus.footer`: navigation

---

## 9. Decision log

| Decision | Rationale |
| --- | --- |
| Hugo over Jekyll or plain HTML | Single binary, no Ruby or Node toolchain, fast, built-in taxonomies, RSS, and image processing. System Ruby on macOS is old and awkward for Jekyll |
| Custom theme | Full control, no dependency on a third-party theme's maintenance |
| One `posts` stream with taxonomies | Blog, how-to, review, homelab, and life share a layout; facets are cheaper to maintain than sections |
| GitHub Actions deploy, not `gh-pages` branch | Official, current method; keeps built output out of the repo |
| `CNAME` in `static/` | Ensures it lands in the published root on every build |
| Apex domain with A/AAAA records | CNAME at the apex conflicts with other records (mail) |
| Gallery instead of a Photography section | Photography is an infrequent hobby; a generic gallery covers photos, builds, and screenshots |
| Lightbox in about 60 lines of vanilla JS using `<dialog>` | No dependencies; native focus handling and Escape support |
| Cloudflare proxy on, Full (strict) | Adds firewall and analytics; strict mode is required to avoid a redirect loop with GitHub's HTTPS enforcement |
| Repo public | GitHub Pages on a free plan requires it. Don't commit anything private |

---

## 10. Outstanding work

**Placeholder content that is live right now (all marked `TODO`):**
- [ ] Homepage tagline and subline (`hugo.toml`)
- [ ] `content/about.md`, `resume.md` (add `static/resume.pdf` and uncomment the link), `now.md`, `uses.md`, `homelab.md`, `contact.md`
- [ ] Sample post `posts/hello-world` and `posts/example-homelab-writeup`: replace or delete
- [ ] Sample project `projects/example-homelab.md`: replace or delete
- [ ] Sample gallery collection `gallery/sample-collection`: gradient placeholder images; replace or delete
- [ ] `params.email` and `params.socials.*` in `hugo.toml`
- [ ] `params.startHere` cards: point at the best real pages
- [ ] `static/og-default.png`: currently a plain placeholder; replace with a 1200x630 image

**Small technical items:**
- [ ] The Actions workflow logs Node 20 deprecation notices. Bump action versions when convenient.
- [ ] The favicon uses Georgia via SVG text; it may render differently where that font is missing. Converting the "K" to a path would make it exact everywhere.

**Ideas, in rough priority order:**
1. `./new-post` helper script to scaffold and publish in one step
2. Case-study writing pass and a real Homelab hub (hardware, network diagram, services)
3. Reviews with a consistent format (verdict, pros and cons, time used)
4. Client-side search once there are 30 or more posts
5. Newsletter signup (needs an outside service)
6. `/colophon` or `/bookshelf` page; testimonials on About or Résumé
7. A browser-based editor (for example Sveltia CMS) if a WordPress-style admin is wanted

---

## 11. Build history

1. Scaffolded the Hugo site: custom theme, sections, RSS, dark mode, deploy workflow, `CNAME`
2. Demoted photography to a footer-linked Gallery
3. Added the "Start here" section, Homelab hub, case-study project pages, and Contact page
4. Created the GitHub repo, enabled Pages via Actions, pushed
5. Connected `kalil.info`: DNS, certificate, Enforce HTTPS, then Cloudflare proxy with Full (strict)
6. Added the monogram hero, teal accent, in-page lightbox, simplified headline, and mobile header fix

---

## 12. Notes for future maintenance

- Deploys are triggered by pushes to `main`. `public/` and `resources/` are git-ignored build output.
- Hugo is pinned to `0.166.0` in the workflow. Upgrade locally and in `pages.yml` together, and check `hugo` for deprecation warnings when doing so.
- After a deploy, if the live page looks stale, purge the Cloudflare cache and hard-refresh.
- `draft: true` content is excluded from production builds; `hugo server -D` includes it.
