# Phone push notifications — setup

Real reminders that reach your phone **even when the app is closed** — "3 animals
due for a weigh-in", "Weld County Fair is tomorrow", "withdrawal ends today".

There are three moving parts:

1. **The app** subscribes each device and stores a push token (already built in).
2. **A table** holds those tokens (`supabase/push.sql`).
3. **A scheduled Edge Function** (`supabase/functions/push-reminders`) reads the
   team data once a day and sends the notifications.

You only do this once. Budget ~15 minutes. You'll need the free
[Supabase CLI](https://supabase.com/docs/guides/cli).

---

## 1. Create the table

Open your project → **SQL Editor**, paste the contents of **`supabase/push.sql`**,
run it. (Safe to re-run.)

## 2. Keys

Push uses a VAPID key pair. The **public** key is already in `config.js`
(`vapidPublicKey`). You need to give the function the matching **private** key as
a secret — never commit it.

> The private key was generated for you and shared separately. If you'd rather
> make your own pair, run `npx web-push generate-vapid-keys` and put the
> `Public Key` in `config.js` and the `Private Key` in the secret below.

## 3. Deploy the function

From the repo root:

```bash
supabase login
supabase link --project-ref awwqwxyfbmgxsashxaml     # your project ref
supabase functions deploy push-reminders --no-verify-jwt
```

## 4. Set the secrets

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BBswfXJ8bjSIZF0oa_ftwgocKaUgVWMoj4e2du43IQ8WfWFHYA52vWD48PQCYI_XuTwi9Z-_sFGd43aa5Uni-Os" \
  VAPID_PRIVATE_KEY="PASTE_THE_PRIVATE_KEY_HERE" \
  VAPID_SUBJECT="mailto:david.devitt@fortressds.com"
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function
automatically — you don't set those.)

## 5. Schedule it (once a day, ~7am)

In **SQL Editor**, enable the schedulers and add a job. Replace
`YOUR_SERVICE_ROLE_KEY` with your project's service-role key
(**Project Settings → API → service_role**, keep it secret):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'dfst-daily-reminders',
  '0 13 * * *',   -- 13:00 UTC = 7am US Mountain (adjust to your timezone)
  $$
  select net.http_post(
    url     := 'https://awwqwxyfbmgxsashxaml.functions.supabase.co/push-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

To change the time later: `select cron.unschedule('dfst-daily-reminders');` then
re-run with a new cron expression. (Supabase also has a **Database → Cron** UI if
you prefer clicking to SQL.)

## 6. Turn it on, on each phone

In the app: **More → Notifications → Enable on this device**, allow the prompt,
then tap **Send test** to confirm.

### iPhone / iPad
Safari only allows push for **installed** web apps. Open the site in Safari →
**Share → Add to Home Screen**, then open the app *from the home-screen icon* and
enable notifications there. (Requires iOS/iPadOS 16.4 or later.)

---

## Test it now, without waiting for 7am

Fire the function by hand:

```bash
curl -i -X POST \
  'https://awwqwxyfbmgxsashxaml.functions.supabase.co/push-reminders' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

It returns `{"ok":true,"considered":N,"sent":M}` and any device with something
due today gets a "Today in the barn" notification.

## What gets sent

One tidy digest per device per run, honouring that device's toggles in
**More → Notifications**:

- **Weigh-ins due** — animals not weighed in 7+ days
- **Shows & deadlines** — starting or closing within 3 days
- **Health** — withdrawal ending today/tomorrow, follow-ups due today
- **Tasks** — anything due
- **Layover care** — open items for an active layover

Nothing due → nothing sent (no empty pings).
