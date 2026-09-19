# ServeUp V1 rollout checklist

V1 is additive. The four existing course pages, their progress tables and existing certificates are not removed or renamed.

## Before a Kuuraku pilot

1. Have an operations lead review all questions marked `needs_human_review` in `data/questions.json`.
2. Prioritise the 90 questions in `hygiene-food-safety`, `allergies-dietary` and `safety-emergency`. The content deliberately avoids invented temperatures, storage periods and legal claims; it still needs to be checked against the store's approved procedures.
3. Have native or professional reviewers check the Japanese, English and Hindi wording.
4. In a Supabase staging project, run `migrations/001_serveup_v1.sql` and then `migrations/002_serveup_v1_seed.sql`.
   For a completely empty staging project only, run `migrations/003_serveup_staging_access.sql` afterward to add the isolated Kuuraku test organization and compatibility RPCs. Do not use this bootstrap to replace an existing production access layer.
5. Test one learner and one manager in the same organisation. Confirm that a manager from another organisation cannot view or update the learner.
6. Only after staging sign-off, repeat the reviewed migration in production and publish the static files through the existing release process.

The migrations are non-destructive. They add `v1_*` tables, policies, scoring/certificate functions and a practical-completion trigger. The seed also copies existing course completion rows into V1 attempts using a deterministic ID, so rerunning it does not duplicate imported rows. On an empty staging project, missing legacy access functions and the missing `course_progress` table are handled safely: learner-owned V1 data remains available, legacy import is skipped, and manager/platform-admin access stays closed until the existing access layer is installed.

## Course settings

Platform administrators can use `v1-admin.html` to set:

- 1–30 questions per attempt (10 is the default; 15 is supported)
- pass score (80% is the default)
- certificate requirement: quiz only or quiz plus practical

The answer key is stored in a table that is not readable by browser clients. Submitted attempts are scored by `submit_v1_attempt`; the browser cannot write a score directly.

## Manager practical check

Open `v1-admin.html`, select a learner and a course, then save each item as Not checked, Practicing, Can perform independently or Needs review. The database policy requires:

- a signed-in manager in the learner's existing management scope;
- a passing quiz attempt for that learner and course;
- the current manager as reviewer.

Reviewer, timestamp and an optional comment are stored. When every required item becomes independent, a quiz-plus-practical certificate is issued automatically.

## PWA installation

- iPhone/iPad: open the published HTTPS page in Safari, choose Share, then Add to Home Screen.
- Android: open it in a supported browser and choose Install app or Add to Home Screen. ServeUp also shows an install button when the browser exposes one.

The PWA uses `manifest.webmanifest`, 192/512 normal and maskable icons, and `sw.js`. The service worker caches only the app shell on its own origin, uses network-first content updates and never caches Supabase authentication/API responses. Bump `VERSION` in `sw.js` for each release; installed users then receive the in-app update prompt.

The current icon is a simple temporary ServeUp mark in `icons/serveup.svg` and `icons/serveup-maskable.svg`. Replace those two source assets with the approved brand artwork and regenerate the four PNG sizes before launch.

## Local verification

Use the repository's bundled or system Node.js:

```sh
node --test test/*.test.cjs
node scripts/check.mjs
```

`test/preview.html` and `test/admin-preview.html` contain isolated, non-production demo data for UI verification. They do not send progress to Supabase.
