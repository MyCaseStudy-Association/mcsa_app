# Portibilify

Portibilify is an Expo Router application for managing imported chat sources, member data, and projected earnings.

## Getting started

```bash
npm install
npm start
```

The app is designed to run in Expo Go first. Use `npm run ios`, `npm run android`, or `npm run web` to open a specific platform.

## Project structure

```text
src/
  app/          Expo Router route files and navigation layouts only
  components/   App-wide brand and UI primitives
  features/     Feature-owned screens, components, data, providers, and services
  hooks/        Shared hooks that are not owned by one feature
  theme/        Theme tokens, persistence, provider, and web font tokens
```

Route files under `src/app` should stay thin. Application behavior belongs to the matching folder under `src/features`, while reusable controls belong in `src/components/ui`.

## Quality checks

```bash
npm run validate
npx expo-doctor
```

`validate` runs ESLint and TypeScript. Run both commands before opening a pull request.

## Environment

Authentication reads its server URL from `EXPO_PUBLIC_AUTH_API_URL`. When the variable is omitted, the existing development fallback in the auth service is used.
