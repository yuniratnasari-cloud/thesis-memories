# System Design

## Status and decision labels

This document describes the approved Thesis Memories MVP product direction and
the storage design set by the Project Manager (PM). Items marked **PENDING PM
APPROVAL** are not implementation requirements until decided.

### Locked product and technical decisions

- Product name: **Thesis Memories**.
- Core concept: academic milestones.
- Priority: MVP.
- Diary entries and photos are stored locally.
- Both raw photos and final rendered photos are stored locally.
- The four visual themes are exactly **Minimalist**, **Cute**, **Masculine**,
  and **Dreamy**. Do not replace or add themes.
- Theme selection changes the rendered photostrip only; the application shell
  and capture flow keep a consistent visual design.
- IndexedDB stores photo Blobs and diary data/metadata.
- `localStorage` is limited to lightweight preferences, such as the last-used
  theme and interface settings. Photos must not be stored as Base64 in
  `localStorage`.

### Proposed technical assumptions

These are implementation details inferred to complete the storage design and
remain subject to PM approval:

- Use one IndexedDB database with `photos` and `diaryEntries` object stores.
- A diary entry owns four raw photo records and one final photostrip record;
  photos are not shared by multiple entries.
- A confirmed four-shot session stores the original photo Blobs and final
  rendered photostrip and references all five records from the diary entry.
- Export/backup is a user-initiated local operation. The archive format,
  metadata format, and import conflict policy are **PENDING PM APPROVAL**.
- No framework, state library, or additional dependency is selected here.

### Current implementation defaults

The MVP uses configurable defaults for decisions that remain pending PM
approval:

- The required milestone list is Bimbingan, Revisi, Ngerjain Skripsi, Seminar
  Proposal, Seminar Hasil, Sidang Skripsi, Yudisium, Wisuda, and Lainnya.
  Lainnya requires a custom name.
- Minimalist is the default theme. The last selected theme is kept in
  `localStorage`.
- A new entry starts with today's local date. Titles are required and limited
  to 80 characters.
- A session captures four photos, each after a three-second countdown.
  Individual retakes and a complete session restart are available. The final
  entry cannot be saved until all four captures are present.
- Natural camera effects are enabled by default and adjustable. Original
  photo Blobs stay unchanged; selected effects are applied while rendering the
  final photostrip. A simple decoration editor adds, removes, positions, and
  resizes theme-specific ornaments outside the photo frames.
- Diary, four original photos, and rendered photostrip are saved in one
  IndexedDB transaction. Entry deletion removes all five owned photo records
  in one transaction.
- IDs use `crypto.randomUUID()` where available, with a local fallback.
- No backup/archive format or restore conflict policy has been selected, so
  export and restore are not implemented.

## Intended MVP journey

1. **Start a photobooth memory:** The user begins a new entry.
2. **Select an academic milestone:** The user chooses one of the nine
   approved categories. Lainnya allows a custom name.
3. **Select a theme:** The user chooses one of the four locked themes:
   Minimalist, Cute, Masculine, or Dreamy. Whether a default is preselected is
   **PENDING PM APPROVAL**.
4. **Request camera access:** Following a clear user action, the application
   asks the browser for camera access and displays a live preview when
   permitted. Permission denial, missing hardware, unsupported APIs, and
   device errors must be handled without bypassing browser controls.
5. **Countdown and capture:** A visible three-second countdown precedes each
   of four still captures. It can be cancelled.
6. **Preview and retake:** All four original captures are previewed. Each can
   be retaken independently, or the complete session can be restarted.
7. **Decorate and save:** Users adjust optional appearance effects, preview
   the original/effected strip, add and position theme-specific ornaments,
   then confirm saving. The app renders a 720 × 2400 photostrip and saves the
   four originals, final Blob, and diary metadata atomically in IndexedDB.
8. **Open, render, and export:** The user can reopen an entry, render its saved
   final photo and metadata, and export/backup a local copy. Export format,
   dimensions, and restore behavior are **PENDING PM APPROVAL**.

## Visual themes

The theme set is locked and must remain exactly:

1. **Minimalist**
2. **Cute**
3. **Masculine**
4. **Dreamy**

The four themes have distinct palettes, frames, typography, and decorations in
the rendered photostrip; the page layout remains unchanged. A theme preference
in `localStorage` is a lightweight preference; each diary entry records its
theme so that the saved strip is identifiable.

## Proposed modular frontend architecture

The modules below are a proposed organization for the existing client-side Vite
project; they do not authorize a framework or dependency:

- **Application shell / flow controller:** screens and transitions through
  milestone selection, theme selection, capture, preview, diary, and export.
- **Milestone and theme UI:** presents approved milestone values and the four
  locked themes.
- **Camera adapter:** requests browser camera access, exposes preview/error
  state, and stops media tracks when capture ends.
- **Capture controller:** coordinates countdown, raw capture, preview, retake,
  and confirmation.
- **Diary repository:** reads and writes diary records and photo Blobs in
  IndexedDB with explicit transaction and error handling.
- **Photo renderer:** creates the themed final photo from the raw capture and
  selected milestone/theme.
- **Backup/export service:** produces a user-initiated local export and
  validates restoration input. Archive format and conflict behavior remain
  pending.
- **Preference service:** reads/writes lightweight interface preferences and
  last-used theme in `localStorage`; it does not store photos or diary records.
- **Shared UI:** accessible controls, progress/status announcements, and
  recoverable error messages.

## Local data model and relationships

### IndexedDB object stores

The following schema is a proposed, consistent shape for the PM-approved
IndexedDB storage decision:

**`photos`** — one record per stored image:

| Field | Purpose |
|---|---|
| `id` | Unique photo ID; primary key |
| `blob` | Photo bytes as a `Blob`, not Base64 |
| `photoType` | `raw` or `final` |
| `photoIndex` | Zero-based capture order for raw photos |
| `mimeType` | MIME type corresponding to the Blob |
| `size` | Blob byte size |
| `createdAt` | Creation timestamp |

**`diaryEntries`** — one record per diary memory:

| Field | Purpose |
|---|---|
| `id` | Unique diary ID; primary key |
| `title` | Entry title |
| `date` | Diary/milestone date |
| `milestone` | Selected category or custom name for Lainnya |
| `milestoneCategory` | One of the nine approved milestone categories |
| `theme` | Exactly one of Minimalist, Cute, Masculine, or Dreamy |
| `photoIds` | Ordered references to the entry's four raw records in `photos` |
| `finalPhotoId` | Reference to the entry's final record in `photos` |
| `effects` | Per-photo natural appearance effect settings |
| `decorations` | Photostrip ornament, position, and size metadata |

Dates use the local calendar value; titles are required and limited to 80
characters. The milestone categories are Bimbingan, Revisi, Ngerjain Skripsi,
Seminar Proposal, Seminar Hasil, Sidang Skripsi, Yudisium, Wisuda, and Lainnya.
`settings` is not needed in IndexedDB for the currently scoped lightweight
preferences; `localStorage` is used instead.

### Write, read, and deletion integrity

- Save four original photos, the final photostrip, and diary entry using one
  IndexedDB transaction spanning both stores. Report transaction failure; do
  not report success or expose a completed diary entry if the transaction
  aborts.
- Opening an entry resolves all five photo references. A missing or unreadable
  referenced photo must produce a clear recoverable error, not a false complete
  render.
- Each photo belongs to exactly one diary entry. Deleting a diary entry deletes
  its four raw photos, final photostrip, and diary record in a single
  transaction across both stores.
- If an entry or its photo records cannot be deleted atomically, roll back and
  report failure. Do not leave a partially deleted entry.
- Validate references when loading, importing, or restoring data. If legacy,
  corrupt, or manually modified records contain unreferenced photos, identify
  them for safe cleanup; automatic orphan cleanup policy is **PENDING PM
  APPROVAL**.
- Exported copies are independent of IndexedDB. Deleting an in-app entry cannot
  revoke a file the user previously exported.

## Backup, restore, and browser boundaries

Export/backup should allow the user to save a local copy of diary metadata and
both photo types. Restore should validate the archive and references and write
restored records transactionally. Archive format, encryption/password option,
duplicate-ID handling, merge/replace behavior, and whether export includes all
entries or a selection are **PENDING PM APPROVAL**.

The approved local-storage direction does not itself approve a backend,
account, authentication, cloud synchronization, or remote photo upload. No
photo upload is assumed.

Browser storage is not a permanent backup: browser cleanup, profile loss,
device failure, storage eviction, or quota exhaustion can make local data
unavailable. The product should explain this limitation and provide approved
export/backup functionality without promising permanent recovery.

## Current implementation status

The Vite frontend implements the responsive application shell, approved
milestone categories, four theme-specific photostrip renderers, four-shot
camera flow, per-photo retakes, a complete-session restart, live natural effects,
and a simple photostrip decoration editor. It saves four raw photo Blobs and a
final rendered photostrip with the diary entry in IndexedDB. Camera access is
requested only after the user activates the camera button. `localStorage` is
used only for the selected theme preference.

Backup/export and restore are not implemented because the archive format and
restore conflict policy remain pending. Build success does not verify camera
permissions, browser storage persistence, quota/error behavior, or cross-device
compatibility; those require browser testing.

## Decisions pending PM approval

- Backup archive format, encryption option, selection, and restore conflict
  behavior.
- Orphan-photo cleanup policy.
- Date representation and ID generation strategy.
- Supported browsers/devices, accessibility target, and MVP acceptance
  thresholds.
- Whether any backend, account, analytics, or remote service is in scope.
