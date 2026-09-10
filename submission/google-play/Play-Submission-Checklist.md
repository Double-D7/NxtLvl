# Show Team — Google Play Submission Checklist

Work top to bottom. Like the iOS side, most of this is Console setup, not code.

## 1. Accounts & tools
- [ ] Google Play Developer account ($25 one-time) — https://play.google.com/console/signup
- [ ] Decide the wrapper: **PWABuilder** generates an Android (TWA) package that
      wraps https://showteam.app. This is the recommended path.

## 2. Build the Android package
- [ ] Go to https://www.pwabuilder.com, enter https://showteam.app
- [ ] Generate the **Android** package (Trusted Web Activity)
- [ ] Set the package name (e.g. `app.showteam.twa`)
- [ ] PWABuilder outputs a signed `.aab` (Android App Bundle) — that's what you upload
- [ ] Save the signing key / `assetlinks.json` info PWABuilder gives you (needed so
      the app opens without a browser address bar)

## 3. Create the app in Play Console
- [ ] Create app → name **Show Team**, default language, App, Free
- [ ] Paste fields from `Play-Store-Listing.md`
- [ ] Upload graphics from `graphics/` (icon 512×512, feature graphic 1024×500)
- [ ] Upload the 6 screenshots from `screenshots/phone/` in numbered order
- [ ] Category: Lifestyle; add contact email + website

## 4. Required Console sections
- [ ] **Privacy policy**: https://showteam.app/privacy.html
- [ ] **Data safety form**: email + user-entered livestock data, used for app
      function + sync, encrypted in transit, deletable in-app and at showteam.app
- [ ] **Content rating** questionnaire → expect Everyone
- [ ] **Target audience**: not directed at children under 13 (it's a family/4-H
      tool used by parents & older youth) — confirm this matches your intent
- [ ] **Ads**: declare No ads (unless you add them)
- [ ] **App access**: provide the demo account (`demo@showteam.app` + password) so
      the reviewer can get past login — same account as the iOS review

## 5. Release
- [ ] Upload the `.aab` to Production (or Internal testing first — recommended)
- [ ] Complete the release, roll out
- [ ] First review typically takes a few days

---

### Notes
- Google Play is more flexible on screenshot sizing than Apple; the padded
  1440×2796 set here satisfies the "no more than 2:1" rule.
- Internal testing track lets you install on your own phone before going public —
  worth doing one round to confirm the TWA opens full-screen (no address bar).
- Same privacy policy and demo account serve both stores.
