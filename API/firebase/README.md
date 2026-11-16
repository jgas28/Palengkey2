# Firebase Realtime Database rules

The rider app writes live locations to `riders_location/{riderId}` and
`orders/{orderId}/driver_location`. These rules accept a write only from a rider
signed in with a token from `POST /api/rider/firebase-token`
(`App\Services\FirebaseRiderTokenService`):

- `riders_location/{id}`: only rider `{id}`.
- `orders/{id}/driver_location`: only the rider delivering order `{id}` (status
  `out_for_delivery` when the token was issued).
- Write access lapses an hour after the token was issued unless the app gets a
  new one, so a rider taken off an order or deactivated loses it within the hour.
- Everything else in the database is closed. The Admin SDK (servers) ignores
  these rules.

Reads are still public (`".read": true`) because the customer app and the admin
map read locations without signing in to Firebase.

## Deploying

Only after the API with `/rider/firebase-token` is live **and** every rider runs
the updated APK. Older APKs don't sign in, so their location writes will be
refused.

1. Firebase Console > Authentication > Get started (once; no sign-in provider
   needs to be turned on for these tokens).
2. Firebase Console > Realtime Database > Rules: keep a copy of the current rules,
   paste `database.rules.json`, then use the Rules Playground to check a write as
   a signed-in rider before publishing. Or, from this folder:
   `firebase deploy --only database --project palengkey-delivery`
