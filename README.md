# Party Balance — README

## What is this?

**Party Balance** is a simple, clean party-wise payment tracking register.

- Add a **Supplier** or **Customer** party
- Add financial entries (Bill / Paid / Received)
- System automatically calculates running balance
- Single-user, login-protected via Supabase Auth

---

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**
3. Choose a name (e.g. `party-balance`) and set a database password
4. Wait for the project to initialize (~2 minutes)

### 2. Run the SQL Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file: `supabase/migrations/001_initial_schema.sql`
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run**

This creates:
- `parties` table with Row Level Security
- `party_entries` table with Row Level Security
- All required indexes, constraints, and policies

### 3. Create Your Login User

Since there is no public signup, create your account directly:

1. In Supabase dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Enter your email and password
4. Click **Create User**

That's it. Use these credentials to log in to Party Balance.

### 4. Set Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

To find these values:
- Supabase dashboard → **Project Settings** → **API**
- Copy `Project URL` and `anon / public` key

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login with the credentials you created in step 3.

---

## Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New Project**
4. Import your GitHub repository
5. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts, then set environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then redeploy:

```bash
vercel --prod
```

### Connect Vercel to Supabase (Optional but Recommended)

1. In your Supabase dashboard → **Project Settings** → **Integrations**
2. Connect to Vercel — this auto-syncs environment variables

---

## Supabase Auth Configuration

For production deployments, update the Supabase Auth settings:

1. Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://party-balance.vercel.app`)
3. Add to **Redirect URLs**: `https://party-balance.vercel.app/**`

---

## Application Structure

```
app/
├── page.tsx              ← Parties home page (/)
├── login/page.tsx        ← Login page
├── party/[id]/page.tsx   ← Party detail page
├── reports/page.tsx      ← Reports page
├── settings/page.tsx     ← Settings page
└── layout.tsx            ← Root layout with AppShell

components/
├── ui/AppShell.tsx       ← Sidebar navigation
├── party/
│   ├── PartiesClient.tsx
│   ├── PartyCard.tsx
│   ├── AddPartyModal.tsx
│   └── EditPartyModal.tsx
├── entries/
│   ├── PartyDetailClient.tsx
│   ├── AddEntryModal.tsx
│   └── EditEntryModal.tsx
├── reports/ReportsClient.tsx
└── settings/SettingsClient.tsx

lib/
├── supabase/client.ts    ← Browser Supabase client
├── supabase/server.ts    ← Server Supabase client
├── calculations.ts       ← Balance calculation functions
└── validations.ts        ← Zod schemas

supabase/
└── migrations/
    └── 001_initial_schema.sql
```

---

## How it Works

### Supplier Balance
```
PAYABLE = Total BILL - Total PAID
```

- Positive → "YOU HAVE TO PAY ₹X"
- Zero → "NOTHING TO PAY"
- Negative → "ADVANCE PAID ₹X"

### Customer Balance
```
RECEIVABLE = Total BILL - Total RECEIVED
```

- Positive → "YOU HAVE TO RECEIVE ₹X"
- Zero → "NOTHING TO RECEIVE"
- Negative → "ADVANCE RECEIVED ₹X"

---

## Security

- All data is protected by Supabase **Row Level Security (RLS)**
- Each user can only see their own parties and entries
- No data leakage between users
- Authentication is handled entirely by Supabase Auth
- Passwords are never stored manually

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

Both variables are prefixed with `NEXT_PUBLIC_` because they are needed in the browser (Supabase client) and on the server.
