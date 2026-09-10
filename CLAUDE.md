@AGENTS.md

# Portibilify app (`mcsa/`)

Expo Router app for importing chat sources, de-identifying prompts on device, and tracking consent/earnings.

This repository is standalone. Its API server lives in the sibling repository `mcsa_server/` (separate git repo, own `CLAUDE.md`). Never import from it, never move code between the two, never commit from a parent folder. Installed SDK is **Expo 54** (`expo-router` 6, React Native 0.81, React 19, TypeScript strict). `reactCompiler` and `typedRoutes` experiments are on.

## Commands

```bash
npm start            # Expo dev server (Expo Go first)
npm run ios | android | web
npm run lint         # expo lint (ESLint flat config)
npm run typecheck    # tsc --noEmit
npm test             # jest, pure-TS services only
npm run validate     # lint + typecheck + test  -> MUST pass before every commit
npx expo-doctor      # run after touching package.json or app.json
node scripts/generate-brand-assets.js   # after editing assets/svgs/
```

## Server contract

- Base URL comes from `EXPO_PUBLIC_AUTH_API_URL`; fallback ports are `6000` (native) and `6001` (browser-safe). These match the server defaults.
- The server's Swagger UI at `<base>/api` is the source of truth for request/response shapes. Write services against it, not against guesses.
- Auth: `POST /auth/register|login|refresh|logout`, `GET /auth/me` (Bearer). Tokens are stored only via `expo-secure-store` in `auth-api.ts`.
- Refinement: `POST /refinement/process` (Bearer). Packaging: `GET /packaging/batch`, `GET /packaging/verify/:receiptRef` (public), `POST /packaging/revoke/:receiptRef` (Bearer).
- Every server endpoint the app uses must have exactly one client function under `src/features/<feature>/services/*-api.ts`. No inline `fetch` in screens or components.
- If a task needs both a server change and an app change, do the server first and keep each commit independently buildable.

## Privacy invariant (non-negotiable)

This product de-identifies user chat prompts on device before anything leaves the phone. **Raw prompt content and matched entity text must never be logged, sent to analytics, or sent to any endpoint other than the project server.** Only first-pass-redacted prompts, fingerprints, and consent data go to the server. If a change would violate this, stop and say so instead of implementing it.

## Directory structure (authoritative)

Every file you create must fit one of these slots. If it does not, you are in the wrong place.

```text
mcsa/
  app.json                 Expo config. Icons/splash paths point into assets/icons/.
  package.json             Scripts above. Do not add scripts without updating this file.
  tsconfig.json            strict: true. Aliases: @/* -> src/*, @/assets/* -> assets/*
  eslint.config.js         expo flat config. Do not disable rules per-file without a comment.
  jest.config.js           testMatch: **/__tests__/**/*.test.ts, node env, ts-jest
  AGENTS.md                Expo doc pointer (imported above). Keep it one line.
  README.md                Human-facing overview. Keep its "Project structure" in sync with this tree.
  assets/
    icons/                 App icon, adaptive icon, favicon, splash. Referenced only from app.json.
    images/                Raster images used at runtime. Registered in src/constants/assets.ts.
    svgs/                  Vector sources. Edit these, then regenerate; never hand-edit PNGs.
  scripts/                 Node maintenance scripts only (no app code, no imports from src/).
  src/
    app/                   Expo Router ROUTES ONLY. See "Route rules".
      _layout.tsx          Root providers: SafeArea > Splash > Theme > Auth > Stack
      index.tsx            Login route
      register.tsx         Register route
      (tabs)/
        _layout.tsx        Tab bar + auth redirect
        <tab>.tsx          One file per tab: home, sources, data, money, explore, notifications, profile
    components/
      brand/               Brand-only visuals (splash overlay, brand mark). Platform variants use .web.tsx.
      ui/                  App-wide primitives (AppScreen, ThemedText, GlassPanel, modals). No feature logic.
    constants/
      assets.ts            The ONLY place `require()` of image assets is allowed.
    features/
      <feature>/           One folder per product area. Allowed subfolders (create only when needed):
        screens/           Screen components. Default export. Named <name>-screen.tsx.
        components/        Components used only by this feature.
        services/          API clients, stores, pure logic. No React imports except hooks files.
          __tests__/       Jest tests for pure-TS services: <service>.test.ts
        providers/         React context providers + their hooks.
        data/              Static/seed data for the feature.
        utils/             Pure helpers specific to the feature.
        hooks/             Feature-specific hooks (create if needed).
    hooks/                 Cross-feature hooks only (e.g. use-refresh.ts).
    theme/                 Colors, fonts, theme provider/store, global.css. Single source of design tokens.
```

Current features: `auth`, `sources`, `data`, `money`, `explore`, `notifications`, `profile`, `home`.

## STRICT rules

Violating any rule below is a bug. Fix the placement before writing logic.

### Placement

1. **`src/app/` holds routes only.** A tab route file must be exactly one line:
   `export { default } from '@/features/<feature>/screens/<name>-screen';`
   Layout files (`_layout.tsx`) may contain navigation config and auth redirects, nothing else. No state, no fetches, no styles beyond navigator options.
2. **All behavior lives in `src/features/<feature>/`.** Never put a screen, service, or provider anywhere else.
3. **Reusable across 2+ features -> `src/components/ui/` or `src/hooks/`.** Used by one feature -> stays inside that feature. Move it the moment a second feature needs it; do not copy.
4. **No new top-level folder under `src/`** and no new subfolder name inside a feature beyond the allowed list, unless this file, `README.md`, and `tsconfig.json` paths are updated in the same commit.
5. **No files directly in `src/` or `src/features/`.** Everything sits in a named subfolder.
6. **Assets:** images go in `assets/images/` and are registered in `src/constants/assets.ts`. Never `require()` an image anywhere else. Never add files to `assets/icons/` except via `scripts/generate-brand-assets.js`.
7. **Scripts** in `scripts/` must not import from `src/`.

### Naming

8. **Files: kebab-case** (`edit-profile-modal.tsx`, `auth-api.ts`). Screens end in `-screen.tsx`, providers in `-provider.tsx`, modals in `-modal.tsx`, hooks start with `use-`, API clients end in `-api.ts`, stores in `-store.ts`.
9. **Components and hooks: named exports, PascalCase / camelCase** (`export function ThemedText`, `export function useRefresh`). **Default exports are only for screens and route/layout files.**
10. **Platform variants:** `<name>.web.tsx` beside `<name>.tsx`, identical export signature.
11. **Tests:** `services/__tests__/<service>.test.ts`. Only pure TS is tested here; never import React Native in a test.

### Imports

12. **Use the `@/` alias for every import outside the current folder.** `../` or `../../` imports are forbidden. `./` is allowed only within the same folder.
13. **Import order:** external packages, blank line, `@/` imports. Alphabetical within each group.
14. **Feature-to-feature imports** are allowed only for `providers/` and `services/` (e.g. `useAuth`). Never import another feature's `components/` or `screens/`; lift shared UI to `src/components/ui/`.
15. **No imports from `src/app/`.** Routes are leaves.

### Code

16. **TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment explaining why.**
17. **Colors and fonts come from `src/theme/`** via `useColors()` / `useTheme()` / `Fonts`. Do not hardcode hex values in components. Existing violations are legacy; do not add more.
18. **Styles use `StyleSheet.create` at the bottom of the file.** No inline style objects except for dynamic theme values.
19. **Network calls only in `services/*-api.ts`** using `fetch` from `expo/fetch`. Screens and components call services; they never build URLs or headers.
20. **Secrets and tokens only via `expo-secure-store`** inside `auth-api.ts`. Never `AsyncStorage`, never module-level variables for tokens.
21. **Environment variables must be prefixed `EXPO_PUBLIC_`** and read once in a service, with a documented fallback.
22. **Follow Expo 54 APIs.** Check https://docs.expo.dev/versions/v54.0.0/ before using an Expo module. Do not install `react-navigation` screens directly; routing is Expo Router.
23. **Do not add dependencies** without stating why in the commit body and running `npx expo-doctor`. Prefer `npx expo install <pkg>` so versions match the SDK.
24. **Never commit** `ios/`, `android/`, `.expo/`, `dist/`, `.env*.local`, `.DS_Store`, or `example`. They are gitignored on purpose.

## Mandatory checklist for every change

Do these in order. Do not skip because the change "looks small".

1. **Locate:** name the target folder from the tree above before creating any file. If unsure, it goes in `src/features/<feature>/`.
2. **Check existing:** grep `src/components/ui` and `src/hooks` for an existing primitive before writing a new one.
3. **Implement** following the rules above.
4. **Verify structure:** run the audit below and confirm zero output.
5. **Run `npm run validate`.** All three steps must pass. Do not commit on a failing lint, typecheck, or test.
6. **Update docs** if you added a feature, a tab, a script, an env var, or a folder: this file, `README.md`, and `assets/README.md` as relevant.

### Structure audit (must print nothing)

```bash
# route files with logic (anything beyond the one-line re-export), excluding layouts
for f in src/app/*.tsx src/app/\(tabs\)/*.tsx; do case "$f" in *_layout.tsx) ;; *) [ "$(grep -vc '^\s*$' "$f")" -gt 1 ] && echo "ROUTE HAS LOGIC: $f";; esac; done
# relative parent imports
grep -rn "from '\.\./" src && echo "RELATIVE PARENT IMPORT FOUND"
# non-kebab filenames
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -E '/[^/]*[A-Z_][^/]*\.(ts|tsx)$' | grep -v '_layout' && echo "NON-KEBAB FILENAME FOUND"
# files directly in src/ or src/features/
find src src/features -maxdepth 1 -type f | grep -v '\.DS_Store' && echo "LOOSE FILE FOUND"
# image requires outside constants/assets.ts
grep -rln "require('@/assets" src | grep -v 'constants/assets.ts' && echo "ASSET REQUIRE OUTSIDE CONSTANTS"
# unexpected feature subfolders
find src/features -mindepth 2 -maxdepth 2 -type d | grep -vE '/(screens|components|services|providers|data|utils|hooks)$' && echo "UNKNOWN FEATURE SUBFOLDER"
```

## Recipes

**New feature `foo`:** create `src/features/foo/screens/foo-screen.tsx` (default export). Add services/components/providers only when needed. If it is a tab, add `src/app/(tabs)/foo.tsx` with the one-line re-export and register a `<Tabs.Screen name="foo">` in `src/app/(tabs)/_layout.tsx`. Update the "Current features" line above and `README.md`.

**New API call:** add a function to `src/features/<feature>/services/<feature>-api.ts` (or create it). Take the access token from the auth provider; never read SecureStore outside `auth-api.ts`.

**New shared primitive:** `src/components/ui/<name>.tsx`, named export, props interface exported, theme colors via `useColors()`.

**New pure logic:** `src/features/<feature>/services/<name>.ts` plus `services/__tests__/<name>.test.ts`. Pure logic without tests will be rejected.
