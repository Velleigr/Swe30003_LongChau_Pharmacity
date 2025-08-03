Swe30003_LongChau_Pharmacity

## Setup Instructions

1. **Create a Supabase project** at https://supabase.com
2. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to 'Project Settings' -> 'API'
   - Copy your 'Project URL' and 'anon public' key
3. **Create a `.env` file** in the project root directory with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-public-key
   ```
   **Important:** Replace the placeholder values with your actual Supabase credentials
4. **Install dependencies:** `npm install`
5. **Start the development server:** `npm run dev`

## Troubleshooting

If you encounter "Failed to fetch" errors:
1. Verify your `.env` file contains actual Supabase credentials (not placeholder values)
2. Ensure your Supabase project is active and accessible
3. Check that your API keys have the correct permissions
4. Restart the development server after updating environment variables

## Environment Variables

The following environment variables are required:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase public API key

### Email Configuration (for prescription notifications)
- `GMAIL_USER`: Gmail account for sending notifications
- `GMAIL_PASSWORD`: Gmail app password or account password
- `GMAIL_FROM_NAME`: Display name for outgoing emails
