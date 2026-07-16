/* Show Team — cloud configuration.
   Fill these in to turn on shared, multi-user cloud sync (Supabase).
   Both values are SAFE to commit to a frontend: the anon key only grants
   what Row-Level Security allows, and RLS is what actually protects the data.

   You can also connect from inside the app (More → Connect to cloud) instead
   of editing this file — handy for testing before you commit keys.

   Leave them empty to run the app in local-only mode (data stays on-device). */
window.DFST_CONFIG = {
  supabaseUrl:     "https://awwqwxyfbmgxsashxaml.supabase.co",
  supabaseAnonKey: "sb_publishable_4KwaK78zSHqmK5PGoLqt5A_iV4cg1fE",  // publishable key (safe in frontend)

  // Web-push VAPID PUBLIC key (safe to commit). Pair it with the matching
  // PRIVATE key stored as a Supabase secret — see supabase/PUSH_SETUP.md.
  // Leave empty to disable phone push notifications.
  vapidPublicKey:  "BBswfXJ8bjSIZF0oa_ftwgocKaUgVWMoj4e2du43IQ8WfWFHYA52vWD48PQCYI_XuTwi9Z-_sFGd43aa5Uni-Os"
};
