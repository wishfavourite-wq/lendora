# Lendora Deployment Guide

## Production Checklist

1. Use Node.js 20 LTS or newer.
2. Create a production MySQL database and import `database/schema.sql`.
3. Set secure values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
4. Configure bKash production credentials and callback URL.
5. Switch upload storage from local disk to Cloudinary by implementing the same service contract used by `apps/api/src/services/storage.service.ts`.
6. Serve the API behind HTTPS with a reverse proxy.
7. Set `CLIENT_URL` to the deployed frontend origin.
8. Set `NEXT_PUBLIC_API_URL` to the deployed API `/api` URL.
9. Run database backups and enable slow-query monitoring.
10. Enable email/SMS providers for verification and notification jobs.

## Build Commands

```bash
npm install
npm run build
npm run dev:api
npm run dev:web
```

## Security Notes

- Keep JWT secrets out of source control.
- Store bKash credentials in environment variables only.
- Verify seller identity before product publishing.
- Use HTTPS for payment callbacks and QR handover flows.
- Keep deposit and refund writes in database transactions.
- Store dispute evidence with immutable metadata.
