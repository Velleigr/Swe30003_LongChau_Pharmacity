Swe30003_LongChau_Pharmacity

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Copy your project URL and public API key from the Supabase dashboard
3. Update the `.env` file with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server

## Environment Variables

The following environment variables are required:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase public API key
