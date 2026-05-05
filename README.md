# Il Forno Trattoria — B2B Demo

The ESL Room's premium B2B chatbot demo. Pizza restaurant ordering scenario for staff training.

## What's in this build

- **`index.html`** — Complete frontend (single file, no build step needed)
- **`api/chat.js`** — Claude Haiku chat backend with random special request
- **`api/speech.js`** — OpenAI TTS Nova for AI voice
- **`api/transcribe.js`** — OpenAI Whisper for voice input
- **`package.json`** — Dependencies (formidable for file uploads)
- **`vercel.json`** — Vercel config

## Deployment to Vercel

### 1. Set up Formspree (5 minutes)

1. Go to https://formspree.io and create a free account
2. Create a new form and copy your form endpoint (looks like `https://formspree.io/f/xyznabcd`)
3. In `index.html`, find this line:
   ```html
   <form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
4. Replace `YOUR_FORM_ID` with your Formspree form ID

### 2. Push to GitHub

Create a new private repo (e.g. `il-forno-demo`) and push these files.

### 3. Deploy to Vercel

1. Go to https://vercel.com and import the GitHub repo
2. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `OPENAI_API_KEY` — your OpenAI API key (for Whisper + TTS)
3. Deploy

The demo will be live at `your-project-name.vercel.app`.

## Recording the intro video

The video card in the top section currently shows a placeholder. To replace:

1. Record a 30-second intro on your phone (good lighting, plain background)
   - "Welcome to the Il Forno staff training. You're about to practise taking an order. Take your time and speak naturally — let's begin."
2. Upload the video file to your repo (e.g. `intro.mp4`)
3. In `index.html`, replace the video placeholder div with:
   ```html
   <video controls poster="thumbnail.jpg">
     <source src="/intro.mp4" type="video/mp4">
   </video>
   ```

## Customisation

- **Brand colours** — Edit CSS variables at top of `index.html`:
  - `--brand: #5B9BAD` (your primary blue)
  - `--ink: #1a1a2e` (dark text/backgrounds)
- **Menu items** — Edit both the menu card HTML in `index.html` AND the system prompt in `api/chat.js`
- **Special requests (A/B/C scenarios)** — Edit the `SPECIAL_REQUESTS` array in `api/chat.js`
- **Hint text** — Edit the `hints` object in the script section of `index.html`

## How it works

1. User lands on page, sees Il Forno branding, scenario brief, intro video, menu, chat
2. Sarah greets them: "Hi there. I'm ready to order, please."
3. User types or speaks their response
4. Backend picks one of 3 special request scenarios randomly on first user message
5. Conversation flows for 7-9 exchanges
6. Sarah closes naturally
7. B2B section reveals with benefits + Formspree contact form

## Costs

- **Anthropic (Claude Haiku):** ~$0.001 per conversation
- **OpenAI Whisper:** ~$0.006 per minute of audio
- **OpenAI TTS Nova:** ~$15 per 1M characters
- **Vercel:** Free tier covers thousands of demo plays
- **Formspree:** Free tier covers 50 form submissions/month

Estimated cost per demo session (with voice): ~$0.05-0.10
