# KnotCall

Free, peer-to-peer video meetings in the browser. No signup, no API keys, no backend required.

## Features

- Instant meeting rooms with shareable links
- Host waiting room (admit / deny guests)
- Host controls — mute, stop video, remove participants, mute all
- HD video & audio via WebRTC mesh (PeerJS)
- Screen sharing, in-call chat, active speaker highlight
- Works in Chrome, Brave, Opera, Edge, Firefox, Safari, and Chromium browsers

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you see module errors, clear the cache:

```bash
npm run dev:clean
```

## Production

```bash
npm run build
npm run start
```

### Deploy to Netlify

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Netlify](https://app.netlify.com), click **Add new site → Import an existing project**.
3. Select the repo — Netlify auto-detects Next.js and uses `netlify.toml`.
4. Click **Deploy** (no environment variables needed).

Or deploy from the CLI:

```bash
npx netlify login
npx netlify init
npx netlify deploy --build --prod
```

Deploy to [Vercel](https://vercel.com), Netlify, or any Node.js host. No environment variables required.

> **Note:** Do not run `npm run build` while `npm run dev` is active — this can corrupt the `.next` cache.

## How it works

1. First person to join a room becomes the **host** (claims the room peer ID).
2. Guests knock on the **waiting room**; the host admits them.
3. Video/audio flows **peer-to-peer** via WebRTC through the free PeerJS cloud broker.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [PeerJS](https://peerjs.com) + WebRTC
- [Lucide React](https://lucide.dev) icons

## License

MIT
