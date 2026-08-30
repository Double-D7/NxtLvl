# Show Team — App Store Submission Checklist

Work top to bottom. Nothing here needs code changes — it's all account setup and clicking through App Store Connect on the Mac.

## 1. Accounts & tools
- [ ] Apple Developer Program membership active ($99/yr) — https://developer.apple.com/programs/
- [ ] Xcode installed from the Mac App Store (needed to build & upload)
- [ ] Decide the wrapper: **PWABuilder** (fastest — wraps the live site) or **Capacitor** (more control). PWABuilder is the recommended start.

## 2. Wrap the PWA into an iOS app
- [ ] Go to https://www.pwabuilder.com, enter https://showteam.app
- [ ] Generate the iOS package (it reads manifest.webmanifest — start_url is already `./?app=1` so it launches the app, not the marketing page)
- [ ] Open the generated Xcode project, set the Bundle ID (e.g. `app.showteam.ios`)
- [ ] Archive & upload to App Store Connect from Xcode

## 3. App Store Connect — create the app record
- [ ] New App → Platform: iOS, Name: **Show Team**, primary language, Bundle ID, SKU
- [ ] Paste all fields from `App-Store-Listing.md`
- [ ] Upload the 6 screenshots from `screenshots/ios-6.7-inch/` in numbered order
- [ ] Upload a 1024×1024 App Icon (no alpha, no rounded corners — Apple rounds it)
- [ ] Category: Primary = Lifestyle (or Productivity), Secondary = Utilities
- [ ] Age rating questionnaire → likely 4+
- [ ] Price: Free, or your chosen tier

## 4. The two rejection landmines — do these BEFORE submitting
- [ ] **Demo account**: create `demo@showteam.app` with real sample data, set a password, put both in App Review Notes. (Apps with a login get auto-rejected without one.)
- [ ] **Account deletion**: confirmed present at More → Account → Delete Account. ✔ already built.
- [ ] **Privacy**: fill out the App Privacy questionnaire (data collected: email + the livestock data the user enters, tied to their account for sync). Privacy policy URL is live at showteam.app/privacy.html.
- [ ] **Guideline 4.2 (minimum functionality)**: the screenshots + description already show this is a full-featured app, not just a website wrapper — you're well clear of this.

## 5. Submit
- [ ] Select the uploaded build
- [ ] Set "Automatically release" or "Manually release"
- [ ] Submit for Review

## 6. Google Play (parallel track — different assets)
- [ ] Google Play Console account ($25 one-time)
- [ ] Short description (80 char), full description (reuse the iOS one)
- [ ] Feature graphic 1024×500
- [ ] Android screenshots (can reuse these, Play is flexible on size)
- [ ] Wrap with PWABuilder's Android/TWA package
- [ ] Data safety form + same privacy policy URL

---

### Notes
- Web push notifications don't fire inside the iOS WKWebView wrapper — that's an Apple limitation, not a bug. In-app reminders still work.
- One 6.7" screenshot set covers both required iPhone sizes; Apple scales them down.
- Keep the marketing text in `App-Store-Listing.md` as your single source of truth — update it there, then paste.
