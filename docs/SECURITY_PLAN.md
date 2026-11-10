# Security Plan

## Scope and locked decisions

This plan describes security and privacy requirements for the Thesis Memories
MVP. The following are locked:

- Academic milestones are central to the product; MVP is the priority.
- Diary data, raw photos, and final photos are stored locally.
- IndexedDB stores photo Blobs and diary data/metadata.
- `localStorage` is only for lightweight preferences such as last-used theme
  and interface settings. Photos must never be stored as Base64 in
  `localStorage`.
- The theme set is exactly Minimalist, Cute, Masculine, and Dreamy.

No backend, account, authentication, cloud synchronization, or server photo
upload is approved or assumed. The actual deployment model and any future
network services require separate approval.

## Camera and photo privacy

Required behavior:

- Explain the camera purpose and request permission through the browser only
  after an explicit user action. Do not bypass, repeatedly trigger, or
  misrepresent browser permission.
- Request camera capability only; do not request microphone access without
  separately approved need.
- Handle permission denial, missing camera, unsupported APIs, and capture
  errors with clear status and an appropriate retry/exit path.
- Process the raw capture and render the final photo locally in the MVP design.
  Store both photo types as Blobs in IndexedDB. No server upload is assumed.
- Stop active media tracks when capture ends or the user leaves that flow.
- Show the captured result for review before saving. Retake must not overwrite
  a previously saved entry.
- Do not place photo bytes, titles, milestone content, or other diary data in
  logs, URLs, analytics, or error messages.
- Do not claim that a photo was saved until the IndexedDB transaction commits.

An eventual feature that transmits photos or diary records would change this
privacy boundary and requires explicit PM approval, a data-flow review, and
updated user notice.

## IndexedDB design, integrity, and deletion

The approved storage technologies are IndexedDB for photo Blobs and diary
data/metadata, and `localStorage` only for lightweight preferences. The
proposed object stores are:

- **`photos`:** `id`, `blob`, `photoType` (`raw` or `final`), `mimeType`,
  `size`, and `createdAt`.
- **`diaryEntries`:** `id`, `title`, `date`, `milestone`, `theme`,
  `rawPhotoId`, and `finalPhotoId`.
- **`settings`:** not required in IndexedDB for the currently scoped
  preferences.

The photo references and schema fields are defined in
[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md). The design assumes each raw/final photo
pair belongs exclusively to one diary entry; sharing semantics would require
PM approval and a revised deletion model.

Required integrity controls:

- Commit the diary record and both associated photo records in one IndexedDB
  transaction spanning `diaryEntries` and `photos`; handle aborts explicitly.
- Delete a diary record and its associated raw/final photo records in one
  transaction. Do not partially delete or silently leave associated records.
- Resolve and validate photo references on read and restore. Missing, invalid,
  or corrupt records must be reported safely.
- Validate imported data and IDs before writing; perform restore writes
  transactionally so a failed restore does not leave a partial dataset.
- On storage failure or quota exhaustion, show a clear error and do not claim
  save/export/restore success. Preserve current data where possible.
- Review orphan-photo detection and cleanup behavior; automatic cleanup policy
  is pending PM approval.

## Browser storage limitations and quota

Local browser storage is not a security boundary or permanent backup:

- IndexedDB data is not automatically encrypted by the application. Same-origin
  scripts can access it, and a person with access to the browser profile/device
  may be able to access it.
- XSS in the application origin can expose or alter diary content and photos.
- Browser/device storage quotas vary. Large photo Blobs may exhaust available
  space; writes can fail with quota or other storage errors.
- Private browsing behavior, browser cleanup, eviction, profile loss, device
  failure, or browser problems may remove or make data unavailable.
- Data does not automatically sync to another device or recover after local
  profile loss.
- A secret embedded in client-side code cannot protect data from the user or
  same-origin code.

Tell users that data may be lost if browser data is cleared or the device or
browser fails. Do not describe local storage as encrypted, guaranteed, or a
permanent backup unless separately implemented and verified.

## Export and backup

Provide a user-initiated way to export/backup diary metadata and both raw and
final photos as local files, so users can keep an independent copy. Provide a
restore path that validates archive contents, types, sizes, and photo
references before transactional storage.

Archive format, optional encryption/password protection, entry selection,
duplicate handling, merge/replace behavior, and size limits are **PENDING PM
APPROVAL**. Export files are outside application-controlled storage; deleting
an in-app entry does not delete copies saved elsewhere by the user. Do not
promise recoverability until export and restore are implemented and verified.

**Current MVP status:** backup/export and restore are not implemented. Do not
present the current browser-local diary as a backup or promise recovery if
browser data is cleared or lost. The app tells users that their entries remain
on the current device/browser.

## XSS prevention and input validation

- Treat titles, milestone labels, restored data, and all other user-controlled
  values as untrusted.
- Render text with safe text APIs or context-appropriate escaping. Do not
  interpolate untrusted values into `innerHTML`, script, CSS, or unsafe URL
  contexts.
- Validate record shape, required fields, allowed theme values (exactly
  Minimalist, Cute, Masculine, Dreamy), photo type, MIME type, Blob size, and
  photo references before saving or restoring.
- Enforce title and field length/type limits after those limits are approved.
- Validate restored files and reject malformed archives, unsupported types,
  missing references, and inconsistent metadata without executing content.

## Dependencies, GitHub, and deployment

- Keep dependencies minimal and review dependency changes and lockfile updates.
  Run an approved dependency audit before release and when dependencies change;
  no audit result is asserted by this plan.
- Keep credentials and private configuration out of source control and
  client-delivered assets. The existing `.gitignore` does not explicitly
  exclude `.env`; decide on suitable ignore patterns before any secrets are
  introduced. Do not put secrets in frontend environment variables.
- Before using GitHub, repository owners should review applicable secret
  scanning/push protection, dependency alerts/security updates, protected
  branches, and required checks. Availability depends on repository settings
  and plan. GitHub has not been configured by this documentation work.
- Before deployment, use HTTPS and review security headers (including a
  restrictive Content Security Policy compatible with the app, MIME sniffing
  and framing protections as appropriate), origin restrictions, third-party
  resources, and production build contents.
- Verify camera access under the selected secure production origin. Deployment
  provider, configuration owner, and operational response process are pending
  PM approval.

## Proposed MVP security acceptance criteria

These criteria must be checked before release; this documentation task has not
executed them:

1. Camera permission is requested through the browser after explicit user
   action; denial is handled; active tracks stop when capture ends.
2. Capture, rendering, diary writes, and photo storage do not transmit photos
   or diary data over the network under the approved local-only scope.
3. Raw and final photo Blobs and the diary record commit together, or a failed
   transaction is reported without a false saved state.
4. Deleting an entry removes its diary record and both owned photos in one
   transaction, or reports failure without partial deletion.
5. Quota and IndexedDB errors are handled visibly and do not silently discard
   data or claim success.
6. Export includes the required metadata and both photo types; restore validates
   content and references and is atomic. Exact acceptance depends on the
   PM-approved format and conflict rules.
7. Markup-like input is displayed as text, not executed; malformed records and
   archives are rejected or safely handled.
8. User-facing disclosure explains browser-local data loss limitations and
   export/backup behavior accurately.
9. Dependency, GitHub, and deployment checks are reviewed and blocking findings
   resolved or explicitly accepted by the responsible approver.

## Decisions pending PM approval

- Backup archive format, encryption option, import conflict behavior, and size
  limits.
- Title/date validation limits, milestone values, and ID generation method.
- Orphan-photo cleanup policy and deletion confirmation behavior.
- Supported browsers/devices and deployment provider/security owner.
- GitHub repository settings and security response ownership.
- Vulnerability reporting channel (see [SECURITY.md](../SECURITY.md)).
