# Hosting the legal pages (Privacy Policy + Terms)

You have a domain + website — **use it.** It's the most professional option and
you control it. Aim for two stable URLs:

- `https://yourdomain.com/privacy`
- `https://yourdomain.com/terms`

## How to publish them
Pick whichever matches your site setup:

**A. You have a normal website / CMS (WordPress, Squarespace, Wix, Framer, etc.)**
1. Create two new pages: "Privacy Policy" and "Terms of Service".
2. Paste the text from `PRIVACY_POLICY.md` / `TERMS_OF_SERVICE.md` (fill the
   [brackets] first).
3. Set their URLs/slugs to `/privacy` and `/terms`. Publish.

**B. Static site (you host HTML yourself)**
- Convert the markdown to simple HTML (any md→HTML tool) and drop `privacy.html`
  and `terms.html` on your host, or map clean `/privacy` `/terms` routes.

**C. No website handy yet (free fallback)**
- GitHub Pages: put the two HTML files in a repo, enable Pages — you get
  `https://yourname.github.io/...`. Works, just less branded.
- A public Notion page also works in a pinch, but your own domain looks far more
  trustworthy in store review.

## GitHub Pages setup in this repo
This repo now includes a ready-to-ship GitHub Pages site in `/docs` plus a
deployment workflow at `.github/workflows/pages.yml`.

Once GitHub Pages is enabled for this repository, the URLs are:

- Marketing / support: `https://se-ak1011.github.io/HASSLE/`
- Privacy Policy: `https://se-ak1011.github.io/HASSLE/privacy/`
- Terms of Service: `https://se-ak1011.github.io/HASSLE/terms/`

If the Pages source is not already configured, set **Settings → Pages** to use
**GitHub Actions**.

## Where these URLs go (this is the important part)
Once hosted, paste them here:

| URL | Where |
|---|---|
| Privacy Policy | **App Store Connect** → App Privacy / App Information → Privacy Policy URL |
| Privacy Policy | **Google Play Console** → Store listing → Privacy policy |
| Privacy + Terms | **Google Cloud Console** → OAuth consent screen → App privacy policy link + Terms of service link |
| Privacy + Terms | (optional) **in the app** — Settings, so users can reach them |

> Note: the legal pages do **not** go "into Supabase" — Supabase doesn't need
> them. The one auth-related place they help is the **Google OAuth consent
> screen**, which has fields for both links (and adding them helps if you ever
> verify the app).

## In-app links (optional, nice for review)
Apple/Google like the Privacy Policy reachable inside the app. When your URLs are
live, tell me and I'll add tappable **Privacy Policy** and **Terms** links to the
Settings → Privacy section (a 5-minute change).
