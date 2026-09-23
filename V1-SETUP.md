# ServeUp Training rollout checklist

ServeUp Training is additive. The four original course pages, their progress tables and existing certificates are not removed. Learners use the unified eight-course program, while original records remain available for migration and reporting.

## Before a Kuuraku pilot

1. Have an operations lead review all questions marked `needs_human_review` in `data/questions.json`.
2. Prioritise the 90 questions in `hygiene-food-safety`, `allergies-dietary` and `safety-emergency`. The content deliberately avoids invented temperatures, storage periods and legal claims; it still needs to be checked against the store's approved procedures.
3. Have native or professional reviewers check the Japanese, English and Hindi wording.
4. In a Supabase staging project, run `migrations/001_serveup_v1.sql` and then `migrations/002_serveup_v1_seed.sql`.
   For a completely empty staging project only, run `migrations/003_serveup_staging_access.sql` afterward to add the isolated Kuuraku test organization and compatibility RPCs. Do not use this bootstrap to replace an existing production access layer.
   After creating the two documented staging Auth users, run `migrations/004_serveup_staging_test_members.sql` to assign manager and learner roles. This file contains no passwords and must not be used in production.
   For a database that received an earlier copy of migration 001, also run `migrations/005_fix_attempt_scoring.sql`; fresh installs already include the same fix in migration 001.
   Run `migrations/006_profile_display_name.sql` if display-name support has not been applied, then run `migrations/007_unify_training_catalog.sql`. Migration 007 activates the eight official course IDs in the existing assignment catalog and keeps the four original rows for historical references.
5. Test one learner and one manager in the same organisation. Confirm that a manager from another organisation cannot view or update the learner.
6. Only after staging sign-off, repeat the reviewed migration in production and publish the static files through the existing release process.

The migrations are non-destructive. The existing internal `v1_*` table names are retained for database compatibility; they store ServeUp Training sessions, attempts, practical checks and certificates. The seed also copies original course completion rows into training attempts using a deterministic ID, so rerunning it does not duplicate imported rows. On an empty staging project, missing legacy access functions and the missing `course_progress` table are handled safely: learner-owned training data remains available, legacy import is skipped, and manager/platform-admin access stays closed until the existing access layer is installed.

## Course settings

Platform administrators can open Staff progress & practical checks from the main admin dashboard to set:

- 1–30 questions per attempt (10 is the default; 15 is supported)
- pass score (80% is the default)
- certificate requirement: quiz only or quiz plus practical

The answer key is stored in a table that is not readable by browser clients. Submitted attempts are scored by `submit_v1_attempt`; the browser cannot write a score directly.

## Manager practical check

Open Staff progress & practical checks from `admin.html`, select a learner and a course, then save each item as Not checked, Practicing, Can perform independently or Needs review. The database policy requires:

- a signed-in manager in the learner's existing management scope;
- a passing quiz attempt for that learner and course;
- the current manager as reviewer.

Reviewer, timestamp and an optional comment are stored. When every required item becomes independent, a quiz-plus-practical certificate is issued automatically.

## PWA installation

- iPhone/iPad: open the published HTTPS page in Safari, choose Share, then Add to Home Screen.
- Android: open it in a supported browser and choose Install app or Add to Home Screen. ServeUp also shows an install button when the browser exposes one.

The PWA uses `manifest.webmanifest`, 192/512 normal and maskable icons, and `sw.js`. The service worker caches only the app shell on its own origin, uses network-first content updates and never caches Supabase authentication/API responses. Bump `VERSION` in `sw.js` for each release; installed users then receive the in-app update prompt.

The approved ServeUp brand mark is used in `icons/serveup.svg` and `icons/serveup-maskable.svg`, with matching 192px and 512px PNG fallbacks for install compatibility.

## Local verification

Use the repository's bundled or system Node.js:

```sh
node --test test/*.test.cjs
node scripts/check.mjs
```

`test/preview.html` and `test/admin-preview.html` contain isolated, non-production demo data for UI verification. They do not send progress to Supabase.
