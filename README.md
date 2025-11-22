# MyRoxas Web

This is a Next.js application.

To get started, take a look at src/app/page.tsx.

## Environment variables

Create a `.env.local` file (copy `.env.local.example`) and provide the following values from your Supabase project settings:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Restart `npm run dev` after adding or changing env vars so Next.js picks them up.
