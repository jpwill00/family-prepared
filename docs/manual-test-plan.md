# Manual Test Plan — Sprint 2 Gate 2

## Environment

- Browser: Chrome (latest) or Firefox (latest)
- `pnpm build && pnpm preview` (tests PWA/SW)
- WiFi can be toggled off via OS network settings or Chrome DevTools → Network → Offline

---

## 1. First-run onboarding

| Step | Expected |
|------|----------|
| Clear site data (DevTools → Application → Storage → Clear site data) | — |
| Navigate to `/` | Redirects to `/onboarding` |
| Click **"Start fresh"** | Wizard: name prompt appears |
| Enter plan name and continue | `seed-library.zip` fetched; library seeded; redirected to `/plan/household` |
| Click **"Import ZIP backup"** | File picker opens; select a valid ZIP | Plan loads; redirected to household page |
| Click **"Connect GitHub repository"** | "Coming soon" message or Sprint 3 stub shown |

---

## 2. Household page

| Step | Expected |
|------|----------|
| Click **Add member** | Dialog opens |
| Fill name, DOB, dietary notes, medical notes; click **Add** | Member card appears in list |
| Click pencil icon on member | Edit dialog pre-populated |
| Change name; click **Save** | Card updates in place |
| Click trash icon | Confirm dialog; on confirm, member removed |

---

## 3. Communication plan

| Step | Expected |
|------|----------|
| Navigate to `/plan/communication` | PACE tiers shown |
| Expand **Primary** tier; click **Add contact** | Dialog opens |
| Fill name, role, channel, value; click **Add** | Contact row appears |
| Edit contact → change channel; save | Row reflects change |
| Delete contact | Row removed immediately |
| Add a protocol note to a tier | Note persists after page reload |

---

## 4. Logistics page

| Step | Expected |
|------|----------|
| Navigate to `/plan/logistics` | Three sections: safe rooms, meeting points, evacuation routes |
| Add a safe room with notes | Row appears with notes in muted text |
| Add a meeting-point (primary and alternate) | Badges show correct colour (green = primary, amber = alternate) |
| Add an evacuation route | Row expands; empty-state map card shown |
| Click **Add GeoJSON route** on a route | Dialog opens with link to geojson.io |
| Paste valid LineString GeoJSON and save | Leaflet map renders the route over OSM tiles |
| Clear GeoJSON (save empty textarea) | Map card reverts to "No route drawn" |

---

## 5. Inventory page

| Step | Expected |
|------|----------|
| Navigate to `/plan/inventory` | Home supplies, medications, go-bag sections |
| Update water gallons and food days; save | Values persist after reload |
| Add medication with all fields | Medication row appears |
| Add go-bag item | Checklist row appears unchecked |
| Check and uncheck go-bag item | Checkbox state persists |

---

## 6. Library browsing

| Step | Expected |
|------|----------|
| Navigate to `/library` | Grid of content-area cards (10 areas after seed) |
| Click a card | Area article list |
| Click an article | Article renders: title from frontmatter, body as HTML |
| Articles with `last_reviewed` metadata | Date badge shown |

---

## 7. Custom content

| Step | Expected |
|------|----------|
| Navigate to `/custom` | "No custom content yet" or list of areas |
| Click **New area** | Dialog: name + content type |
| Create area; click into it | Empty article list |
| Click **New article** | Dialog: article title |
| Create article | Editor page opens; left pane = textarea, right pane = live preview |
| Type Markdown text | Right pane updates (≤500 ms debounce) |
| Navigate away and back | Content preserved (auto-saved) |
| Click **Fork from library** (when library version exists) | Library content copied to editor |
| Click **Delete** | Confirm dialog; on confirm, article removed; back to area |

---

## 8. ZIP export + reimport round-trip

| Step | Expected |
|------|----------|
| Settings → **Export ZIP backup** | File downloads; name matches plan name + date |
| Clear all data (Settings → Reset) | Onboarding shown |
| Import ZIP | Plan restored to same state |

---

## 9. PDF export

| Step | Expected |
|------|----------|
| Settings → **Export PDF binder** | Button shows "Generating PDF…" then download starts |
| Open downloaded file | PDF opens with ≥5 pages: cover, household, PACE, logistics, inventory |
| Cover page | Plan name, generation date, household member names |
| Inventory page | Go-bag checklist with checkbox state |

---

## 10. Offline behavior

| Step | Expected |
|------|----------|
| Load app fully (wait for SW to install) | — |
| DevTools → Network → set to **Offline** | Amber banner appears at top: "You're offline — your plan is saved locally" |
| Navigate between plan pages | All pages load from cache; no network errors |
| Edit household member while offline | Save succeeds; data in IndexedDB |
| Set network back to **Online** | Amber banner disappears |

---

## 11. PWA install

| Step | Expected |
|------|----------|
| Open app in Chrome (fresh profile, not yet installed) | After a few seconds, install prompt card appears bottom-right |
| Click **Dismiss** | Card disappears; does not reappear on reload (localStorage flag set) |
| Clear localStorage; reload | Prompt reappears |
| Click **Install** | Browser install dialog appears; accept it |
| Launch from desktop/dock | App opens in standalone window without browser chrome |

---

## 12. Lighthouse scores

Run in Chrome DevTools (incognito, production build served via `pnpm preview`):

| Category | Target | Notes |
|----------|--------|-------|
| Performance | ≥ 90 | Code-split routes, lazy PDF import |
| Accessibility | ≥ 90 | All icon buttons have `aria-label` |
| Best Practices | ≥ 90 | HTTPS in prod; OSM tiles over HTTPS |
| PWA | Pass | Manifest, icons, SW, offline fallback |
