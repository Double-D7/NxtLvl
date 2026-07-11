/* Devitt Family Show Team — cloud configuration.
   Fill these in to turn on shared, multi-user cloud sync (Supabase).
   Both values are SAFE to commit to a frontend: the anon key only grants
   what Row-Level Security allows, and RLS is what actually protects the data.

   You can also connect from inside the app (More → Connect to cloud) instead
   of editing this file — handy for testing before you commit keys.

   Leave them empty to run the app in local-only mode (data stays on-device). */
window.DFST_CONFIG = {
  supabaseUrl:     "",   // e.g. "https://abcdefgh.supabase.co"
  supabaseAnonKey: ""    // the "anon public" key from Project Settings → API
};
