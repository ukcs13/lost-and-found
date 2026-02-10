# Project Setup Guide

This guide details the steps to set up and run the Lost and Found application.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)
- A [Supabase](https://supabase.com/) account and project

## Setup Instructions

### 1. Environment Configuration

1.  Create a file named `.env.local` in the root directory (`lost-and-found/`).
2.  Copy the contents of `.env.example` into `.env.local`.
3.  Update the values with your actual Supabase project credentials:
    -   **NEXT_PUBLIC_SUPABASE_URL**: Found in Supabase Dashboard -> Project Settings -> API.
    -   **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Found in Supabase Dashboard -> Project Settings -> API.

### 2. Database Setup

1.  Log in to your Supabase Dashboard.
2.  Navigate to the **SQL Editor**.
3.  Open the file `supabase/complete_schema.sql` from this project (recommended over schema.sql).
4.  Copy the entire content of `complete_schema.sql` and paste it into the Supabase SQL Editor.
5.  Click **Run** to create or fix the necessary tables, policies, and functions. This script is safe to run multiple times.

### 2.1 Storage Setup

1.  In Supabase Dashboard, go to **Storage**.
2.  Click **Create new bucket** and name it `item-images`.
3.  Set the bucket to **Public**.
4.  Save the bucket. This is required for image uploads in the Create Item flow.

### 3. Installation and Running

Once the environment and database are ready, you can set up and run the project.

**Important: Navigate to the project directory first:**
```bash
cd lost-and-found
```

**First time setup:**
```bash
npm install
```

**Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and Supabase client.
- `supabase/`: Database schema and migrations.
