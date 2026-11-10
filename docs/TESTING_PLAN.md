# Testing Plan

## Status

This is the MVP test plan and status record. It describes scenarios, expected
outcomes, and failure handling. The implementation is in progress; the checks
listed below are limited to those actually executed.

The current `package.json` contains `dev`, `build`, and `preview` scripts but
no test, lint, or type-check script. The application uses vanilla JavaScript
and has no automated functional test suite.

### Checks executed

- `npm.cmd run build` — passed.
- Local browser smoke test — the main screen rendered, theme selection updated,
  and navigation opened the empty diary state.
- Live preview was observed at 640 × 480 in the integrated browser; playback
  advanced and leaving the capture screen stopped the stream. A later four-shot
  run used a 1280 × 720 stream. Physical camera/device compatibility is not
  established by this integrated-browser test.
- IndexedDB test with synthetic Blobs verified four distinct originals, one
  final Blob, and deletion of a temporary entry and its photos.
- Browser flow completed four countdown captures, retook one photo, restarted
  the session, and confirmed restart cleared all four pending previews and
  stopped the camera.
- The exported preview was a 720 × 2400 PNG. SHA-256 hashes for photostrips
  rendered from the four themes were all distinct.
- The editor added an ornament and changed its position and size. Effects were
  enabled by default in the live preview, and original/effected preview
  controls switched state.
- A saved entry reopened after a page reload with four original photos and the
  final photostrip. Deleting it returned the diary to its empty state.
- Mobile viewport smoke test at 390 px showed no horizontal overflow.
- Camera denial, physical mobile devices, and browser compatibility remain
  untested.

## Functional test scenarios

| ID | Scenario | Expected result | Failure case / expected handling |
|---|---|---|---|
| F-01 | Start a new photobooth memory. | The user enters the flow and sees the next action. | Initialization failure is visible; no false success or created diary entry. |
| F-02 | Select an academic milestone. | The nine approved categories are available; Lainnya reveals a required custom name. | Missing/invalid milestone data is reported. |
| F-03 | Select each visual theme. | Minimalist, Cute, Masculine, and Dreamy are present; selected theme is clear and used for rendering. | No theme is silently replaced or added; unavailable theme state is reported. |
| F-04 | Begin camera use and grant browser permission. | A live preview appears after explicit action; no unrelated permission is requested. | Camera startup error is shown; no fake preview or success state. |
| F-05 | Deny camera permission or use a device without a camera. | The user receives clear explanation and an approved retry/exit path. | No permission bypass, repeated automatic prompt, crash, or loss of saved diary data. Non-camera entry behavior is pending PM approval. |
| F-06 | Run a complete capture session. | Four separate photos are taken with a three-second countdown before each capture; progress identifies each shot. | Capture failure is surfaced; no incomplete session can be saved. |
| F-07 | Retake one photo or restart the session. | Only the chosen original is replaced, or all pending captures are cleared for a restart. | Retake failure is visible and does not corrupt a saved entry. |
| F-08 | Confirm a complete session and save a diary entry. | Four original photo Blobs, one final photostrip Blob, and diary metadata are committed atomically. | IndexedDB transaction abort/error does not show success or leave a partial entry. |
| F-09 | Verify original photo storage. | `photos` contains four separately identified raw Blobs with index, MIME type, byte size, and creation time; the entry references all four. | Missing, wrong-type, empty, or inconsistent data is rejected/reported; no Base64 photo is written to `localStorage`. |
| F-10 | Verify final photo storage. | `photos` contains the rendered 720 × 2400 photostrip Blob with ID, `photoType: final`, MIME type, byte size, and creation time. | Render/storage failure does not mark the diary entry complete or leave a partial record. |
| F-11 | Open a saved diary entry after navigating away or reloading. | Metadata, four originals, and final photostrip resolve; the saved memory renders with its selected theme. | Missing, corrupt, or unreadable photo reference yields a clear error, not a false complete view. |
| F-12 | Verify diary-to-photo relationships. | Each new entry references exactly four original records and one final photostrip; each belongs to one entry. | Dangling references, mismatched type, or duplicate ownership are detected and handled; no unrelated entry is modified. |
| F-13 | Delete a diary entry. | In one transaction, the diary record and all five associated photo records are removed. | Transaction failure rolls back; report failure and do not leave partial deletion or claim success. |
| F-14 | Simulate IndexedDB unavailable, blocked, or transaction failure. | The user sees an actionable storage error; no save, delete, restore, or success status is falsely reported. | Application does not crash silently, corrupt unrelated entries, or discard an already saved entry. |
| F-15 | Simulate browser storage quota exhaustion. | The failed write is surfaced; existing saved entries remain readable and intact where browser behavior permits. | No false saved state; explain storage limitation and approved recovery/export guidance. |
| F-16 | Export/backup diary data. | User-initiated export contains diary metadata and both raw and final photo Blobs in the PM-approved format. | Export error/cancel is reported; source records remain unchanged and no false export success. |
| F-17 | Restore a valid backup. | Archive is validated and its entries and photo references are restored atomically and can be reopened. | Partial/failed restore is rolled back; existing data remains consistent. |
| F-18 | Restore malformed, incomplete, duplicate, or oversized backup data. | Invalid content is rejected or handled according to the approved conflict policy, with clear feedback. | No script/content execution, dangling photo references, partial restore, or silent overwrite. |
| F-19 | Store and reload lightweight preferences. | Last-used theme and approved UI preferences persist via `localStorage`; invalid/missing preference falls back safely. | Preferences failure does not prevent diary access; photos and diary data are never placed in `localStorage`. |
| F-20 | Use export then delete the in-app entry. | In-app entry and associated IndexedDB photos are removed; the user is informed that separately exported files remain outside app control. | Do not claim deletion removes external copies or backup files. |

Date/title rules, exact export format, and restore conflict behavior are pending
PM approval.

## Usability testing

- A first-time user can begin, choose an academic milestone and one of the four
  themes, respond to camera permission, capture, preview, retake, save, reopen,
  delete, and export without unexplained state changes.
- Camera denial, IndexedDB failure, quota exhaustion, backup failure, and
  invalid restore have understandable recovery paths and do not imply success.
- Users can distinguish local diary storage from an independently saved
  backup, and are told browser data can be lost.
- Users understand that deleting an in-app diary entry does not delete files
  already exported elsewhere.

Usability method, participant profile, and completion threshold are pending PM
approval.

## Accessibility testing

- Complete the journey using keyboard only; controls are reachable, ordered,
  operable, and show visible focus.
- Screen readers announce camera state, countdown, capture preview, save and
  delete outcomes, storage errors, and export/restore status.
- Theme choice, milestone selection, photo previews, and errors have meaningful
  names, labels, and instructions.
- Do not rely only on color, animation, or sound; check contrast, zoom/reflow,
  semantic structure, and reduced-motion behavior.

Accessibility target and formal conformance level are pending PM approval.

## Responsive and compatibility testing

- Exercise core flows at narrow mobile, tablet, and desktop sizes without
  clipping or overlap of camera controls, photo previews, diary, and export UI.
- Test browser camera permission and IndexedDB behavior on the approved
  browser/device matrix, including unsupported or unavailable cases.
- Verify rendered and exported photos remain legible at approved sizes and
  orientations.
- `getUserMedia` requires a secure context. On Windows, install and use the
  free `mkcert` tool for local HTTPS:
  1. In PowerShell, install mkcert with
     `winget install --id FiloSottile.mkcert --exact --source winget --accept-source-agreements --accept-package-agreements`.
     Open a new PowerShell window if `mkcert` is not found after installation.
  2. Run `mkcert -install` once. This adds mkcert's local certificate
     authority to the current Windows user's trusted root certificates.
  3. From the project root, run `New-Item -ItemType Directory -Force .\.certs`.
  4. Find the PC's Wi-Fi IPv4 address with `ipconfig` (the address is often
     like `192.168.x.x`; do not use the Default Gateway address). Set it in
     PowerShell, replacing the example with the PC's actual address:
     `$lanIp = '192.168.55.100'`.
  5. Generate a certificate containing localhost and the PC's LAN IP:
     `mkcert -cert-file .\.certs\localhost.pem -key-file .\.certs\localhost-key.pem localhost 127.0.0.1 ::1 $lanIp`.
  6. In the same PowerShell window, set the paths and start Vite:
     `$env:THESIS_HTTPS_CERT = (Resolve-Path .\.certs\localhost.pem).Path`
     `$env:THESIS_HTTPS_KEY = (Resolve-Path .\.certs\localhost-key.pem).Path`
     `npm.cmd run dev:https`
  7. On the PC, open `https://localhost:5173`. On a phone connected to the
     same Wi-Fi, open `https://<PC-LAN-IP>:5173`, replacing the placeholder
     with the IP used above. Allow Node.js/Vite through Windows Firewall only
     on a trusted Private network if Windows asks.
  8. The phone must trust mkcert's root CA for the connection to be considered
     secure. Run `mkcert -CAROOT` on the PC and transfer only `rootCA.pem` to
     the phone, then install it as a trusted CA using the device's OS settings.
     Do not transfer or share `rootCA-key.pem`; it gives the holder the ability
     to issue certificates trusted by this local CA. Phone OS/browser behavior
     varies, so verify the browser shows a trusted HTTPS connection before
     testing camera access.
- The certificate and private key are local development files and must never
  be committed or shared. They are generated under `.certs/`, which is
  git-ignored. If the PC's LAN IP changes, generate a new certificate for the
  new IP and update `$lanIp`. This HTTPS flow has not been validated on every
  Windows, phone, or browser configuration; do not treat successful
  compilation as proof that the camera works.

Exact breakpoints, device matrix, and supported browsers are pending PM
approval.

## Security and privacy testing

- Verify camera permission is requested only after an explicit action and
  denial does not bypass browser controls.
- Inspect network activity during capture and diary use: raw and final photos
  and diary data must not be transmitted under the approved local-only design.
- Enter markup-like title/milestone content and verify it renders as text,
  never executable markup.
- Validate stored and restored record shape, theme allowlist, photo types,
  MIME types, sizes, and references.
- Exercise IndexedDB transaction failure, quota exhaustion, export failure,
  malformed backup, and restore rollback; verify clear errors and no false
  success.
- Confirm photo Blobs are in IndexedDB and not Base64 in `localStorage`.
- Review dependency audit findings and approved GitHub/deployment controls
  before release. These checks have not been performed for this document.

## Proposed MVP release acceptance criteria

Subject to PM approval:

1. All applicable functional scenarios F-01 through F-19 pass on the approved
   browser/device matrix; F-20 is also verified as the in-app deletion/export
   behavior is implemented.
2. Raw and final photo Blobs and diary metadata are stored and related
   correctly; reopening works; delete removes the entry and both exclusively
   owned photos atomically.
3. IndexedDB, quota, export, and restore failures are exercised and do not
   produce false success or inconsistent partial records.
4. All four locked themes are present with no replacements or additions.
5. Usability, accessibility, responsive, compatibility, security, and privacy
   checks meet PM-approved criteria; blocking findings are fixed or explicitly
   accepted by the PM.
6. User-facing storage limitations and backup behavior accurately reflect the
   implemented browser behavior.
7. The production build completes using the existing build script and is
   smoke-tested under the approved release process.
8. A scenario is marked passed only after actual execution and recorded
   evidence. No test results are claimed by this plan.

## Decisions pending PM approval

- Milestone values and selection rules; diary title/date rules and limits.
- Countdown, capture count, cancellation, and non-camera fallback.
- Exact visual styling and default theme (theme names are locked).
- Backup format, encryption option, entry selection, restore conflicts, and
  size limits.
- Orphan-photo cleanup and deletion confirmation details.
- Supported browsers/devices, accessibility target, usability thresholds, and
  release-blocking process.
