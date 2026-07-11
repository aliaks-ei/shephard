# Performance And PWA Verification

## Purpose

Use this checklist before and after performance-sensitive changes. Record results against the same
production build, data set, viewport, and device profile.

Do not run these commands unless the user explicitly authorizes verification.

## Measurement Setup

Use one release candidate and do not rebuild between comparisons:

1. Run `npm run build:production`.
2. Serve that output with `npx quasar serve dist/pwa --port 4173`.
3. Record the commit, build timestamp, test account, seeded data counts, browser version, OS,
   physical device model, network profile, and CPU-throttling profile.
4. Clear site data before each cold run. Keep site data for warm-cache and offline runs.
5. Run each Lighthouse and runtime scenario three times. Record all three results; use the median
   for Lighthouse and require every runtime trace to pass its gate.

For physical-device PWA checks, deploy the same `dist/pwa` output to an HTTPS staging URL. A
desktop localhost result is not a substitute for installed iOS or Android behavior.

No measurements have been recorded by this document.

## Existing Artifact Snapshot

The existing `dist/pwa` output inspected during the repository audit was not rebuilt and may be
stale. It is a directional reference only:

- entry JavaScript: about 157 KB uncompressed
- global CSS: about 236 KB uncompressed
- lazy `heic2any` chunk: about 1.3 MB uncompressed
- expense registration dialog chunk: about 66 KB uncompressed

A fresh baseline must replace these values before any measurement-gated optimization is approved.

## Bundle Baseline

1. Run `npm run build:analyze`.
2. Record raw, gzip, and served transfer sizes for:
   - initial JavaScript and CSS
   - Vue, Query, Supabase, VueUse, and Quasar-containing chunks
   - expense registration dialog
   - `heic2any`
   - fonts, icons, and Apple startup images
3. Record duplicated modules and route ownership from the analyzer.

## Network Baseline

Use an account with at least three active plans and one plan with at least 500 expenses.

- Home: request count, transferred bytes, and largest Supabase response.
- Plan overview: whether full expense rows are downloaded.
- Home to Activity: whether recent-expense requests reuse cache.
- Reconnect: requests triggered after changing from offline to online.

## Runtime Baseline

Capture Chrome Performance or Safari Web Inspector traces for:

- Activity scrolling with 200 expenses
- opening and dismissing the expense dialog
- switching plan tabs
- Home to Plan and Plan to Activity navigation
- JPEG and HEIC analysis, including memory and long tasks
- scrolling with the mobile glass navigation visible

Record long tasks over 50 ms, interaction latency, dropped frames, paint time, and peak memory.

For every trace, begin from an idle page, perform only the named interaction, then remain idle for
five seconds so post-interaction memory can settle. Save the trace and a screenshot of the final
state.

The runtime release gate passes only when all three runs satisfy:

- no uncaught errors, failed route renders, or input-blocking task of 200 ms or longer
- no more than two main-thread long tasks over 50 ms during one named interaction
- click/tap-to-next-paint latency at or below 200 ms for dialog open, tab switch, and navigation
- no sustained scroll interval below 50 FPS for more than one second
- post-interaction JavaScript heap returns to within 20% of the pre-interaction heap after the
  five-second idle period; JPEG/HEIC analysis may exceed this only when the retained object is
  identified and released after closing the dialog

If instrumentation cannot produce a reliable metric in Safari, record the trace as inconclusive
and repeat the same scenario on the physical device with Chrome tooling where possible. Do not
mark an inconclusive result as passed.

## Lighthouse Release Gate

Run Chrome DevTools Lighthouse against the production server in Navigation mode, first with the
Mobile profile and then with the Desktop profile. Select Performance, Accessibility, Best
Practices, and SEO. Use a clean browser profile with extensions disabled and preserve the generated
HTML report for every run.

The median of three runs must meet all of these thresholds:

- Mobile: Performance at least 80
- Desktop: Performance at least 90
- Both profiles: Accessibility at least 95, Best Practices at least 95, and SEO at least 90
- Both profiles: LCP at most 2.5 s, CLS at most 0.10, and TBT at most 200 ms
- No category score may regress by more than 5 points and no metric may regress by more than 10%
  from the fresh pre-remediation baseline

Lighthouse does not replace the authenticated, offline, installed-PWA, or physical-device checks.
If the tested route requires authentication, establish the session before starting Lighthouse and
record that setup with the report.

## Responsive And Accessibility Matrix

- widths: 320, 390, 768, and 1280 pixels
- platforms: iOS Safari, installed iOS PWA, Android Chrome, and desktop Chrome
- input: touch, keyboard, VoiceOver, and TalkBack
- themes: light, dark, reduced motion, and reduced transparency
- states: loading, empty, failed, denied, not found, offline, and reconnecting

For each supported platform, record pass/fail and evidence for keyboard or touch navigation, focus
visibility, text zoom, safe-area handling, orientation changes, and screen-reader labels. The
device gate requires at least:

- one currently supported iPhone running Safari and the installed PWA
- one mid-tier Android phone running Chrome and the installed PWA
- desktop Chrome with keyboard-only navigation
- responsive emulation at 320, 390, 768, and 1280 CSS pixels

The release is blocked by clipped primary actions, inaccessible controls, focus loss after dialogs,
unannounced loading/error states, horizontal page scrolling, or content hidden by safe areas or
mobile navigation.

## PWA Matrix

- install prompt appears once per session after the value gate
- iOS Add to Home Screen guidance is available only when relevant
- service worker update never reloads over unsaved work
- manifest icon, maskable icon, screenshots, shortcuts, orientation, and theme metadata are valid
- offline refresh serves the shell without serving cached authenticated Supabase responses
- reconnect restores query freshness

Exercise install and update behavior on a clean profile and again with an existing installation.
Before accepting an update, open and modify an entity form; the update must remain pending and must
not reload until the form/dialog blocker is closed and the user explicitly accepts. For offline
refresh, verify the app shell loads, authenticated Supabase responses are not replayed from the
service worker cache, writes remain disabled, and reconnect triggers fresh network requests.

## Release Evidence Checklist

Do not approve the release until the verification record contains:

- production build identifier and exact test environment
- bundle analyzer output and recorded transfer sizes
- three Mobile and three Desktop Lighthouse HTML reports
- runtime traces for every scenario above
- physical iPhone Safari/installed-PWA results
- physical Android Chrome/installed-PWA results
- network evidence for bounded expense pages, dashboard snapshots, offline refresh, and reconnect
- explicit pass/fail/inconclusive status for every gate, with an owner and follow-up for each
  failure or inconclusive result

## Decision Gates

Only implement an optimization when the corresponding evidence is recorded:

- HEIC worker/server conversion: first-use transfer, long task, or memory threshold fails.
- CSS removal/splitting: route coverage identifies unused rules and visual regression scope.
- font self-hosting/subsetting: transfer or LCP improves without layout shift.
- dialog consolidation/lazy loading: closed-dialog route cost is material and open latency is safe.
- glass reduction: target-device paint/FPS trace shows jank.
- View Transition narrowing: route interaction timing regresses.
- Brotli artifacts: deployment is confirmed to serve precompressed files correctly.
- splash trimming: retained assets cover supported iOS devices without launch regressions.
