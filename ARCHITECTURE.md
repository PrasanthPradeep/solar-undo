# 🏗️ Architecture: Solar ഉണ്ടോ?

This document outlines the high-level architecture of the **Solar ഉണ്ടോ?** application.

## System Overview

The app is built entirely on the **Next.js App Router** paradigm, utilizing Server Components for optimal performance and SEO, and Client Components where interactivity is required.

### 1. Frontend Layer
- **Next.js & React 19**: Manages routing (`/app`), server-side rendering, and API routes.
- **State Management**: **Zustand** is used for lightweight, fast, and scalable client-side state management (e.g., managing consumer details across the 3-step verification flow).
- **Styling**: **Tailwind CSS v4** coupled with **shadcn/ui** provides a headless, highly customizable, and accessible design system.

### 2. API & Integration Layer (`/src/app/api` & `/src/integrations`)
The application requires querying live utility data. It does this through several isolated integration points:

- **KSEB Integration**: Direct, server-side requests to KSEB servers to fetch capacity and transformer details.
- **Supabase Integration**: Used for caching metadata, managing cron jobs, and storing application configurations securely.
- **Captcha Handling**: Specialized API routes to handle captcha challenges during the consumer verification process.

### 3. Core Features (`/src/features`)
The business logic is modularized into discrete domains:
- **Consumer**: Logic related to parsing and validating KSEB consumer numbers.
- **Transformer**: Logic mapping consumer coordinates or IDs to specific transformers.
- **Solar**: Logic assessing the rooftop capacity threshold (e.g., allowed MW vs. installed MW).

### 4. Background Jobs & Processing
- **PDF Extraction**: The `pdf-parse` library is utilized in serverless functions/cron jobs to extract capacity reports periodically published by KSEB.
- **Capacity Sync**: API routes under `/api/capacity-sync` ensure that the local DB (Supabase) remains eventually consistent with official KSEB data.

## Request Flow

1. **User Input**: User enters their 13-digit consumer number on the home page.
2. **Verification API**: The app hits `/api/verify` which acts as a proxy to KSEB's internal APIs, solving captchas if necessary.
3. **Capacity Check**: Once verified, the consumer's transformer details are cross-referenced with the latest capacity data (`/api/solar-capacity`).
4. **Result Delivery**: The UI renders a clear "Yes" or "No" along with the specific available capacity numbers.

## Security & Privacy
- All API keys and KSEB endpoints are securely stored in server-side environment variables.
- The client-side application never sees the actual API calls to KSEB, preventing abuse.
- Consumer data is strictly used for real-time querying and is never persisted to Supabase.
