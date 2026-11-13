# ZYVON AI Mobile Setup

The Expo client is in `apps/mobile` and uses the NestJS API. It does not include a hosted backend URL by default.

## Configure the API address

Set `EXPO_PUBLIC_API_BASE_URL` before starting Expo. Include the API prefix `/api/v1`.

- Physical Android/iPhone on the same Wi-Fi as your development computer: `http://YOUR_COMPUTER_LAN_IP:4000/api/v1` (replace the example with the computer's LAN IPv4 address).
- Android emulator: `http://10.0.2.2:4000/api/v1`.
- iOS simulator: `http://localhost:4000/api/v1`.
- Deployed backend: use its HTTPS base URL, for example `https://api.example.com/api/v1`.

For a physical phone, `localhost` points to the phone itself, not the computer running the API. The phone and computer must be on the same network, and the API must listen on an interface reachable from the LAN. Configure the API CORS origin if the web client also needs access.

## Start the app

From the repository root:

```bash
pnpm install
pnpm --filter @zyvon/mobile dev
```

Scan the Expo QR code with Expo Go where supported. The API and PostgreSQL database must already be running and reachable.

## Validate

```bash
pnpm --filter @zyvon/mobile typecheck
pnpm --filter @zyvon/mobile exec expo export --platform android
pnpm --filter @zyvon/mobile exec expo export --platform ios
```

The export commands create JavaScript bundles; they do not sign or produce store-ready APK/AAB or IPA binaries.

## Security

- `EXPO_PUBLIC_*` values are bundled into the client and are not secrets.
- Never put `JWT_ACCESS_SECRET`, database credentials, or AI provider keys in the mobile app.
- Use HTTPS for any deployed backend and configure secrets only in the server environment.
