# In-app account deletion (App Store requirement)

Apple requires any app that lets people create an account to also let them
**delete** it from inside the app. Show Team's **More → Delete account** does
this. In cloud mode it calls a Supabase Edge Function that removes the user's
data and their auth account with the service-role key (which never touches the
client).

## One-time deploy

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) and to be
linked to your project (`supabase link --project-ref <your-ref>`).

```bash
supabase functions deploy delete-account
```

That's it — the function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
from the platform's built-in secrets, so there's nothing else to configure.

## What it does

For the signed-in caller (identified from their own JWT — a user can only ever
delete themselves):

1. **Teams they own** → deletes the team's media (Storage), push subscriptions,
   invites, members, and the team row.
2. **Teams they're a member of** → removes them from `team_members` and from the
   shared roster (`data.users`).
3. Deletes their push subscriptions, then the **Auth user**.

The app then signs out and wipes the local cache on the device.

## Notes

- Deleting the **owner** deletes the whole team (all shared records) — the app
  warns clearly and requires typing `DELETE`. If you later want owners to
  *transfer* the team instead, add an ownership-transfer step before deletion.
- Local-only installs (no cloud connected) don't need this function — the app
  deletes the account and wipes on-device data directly.
