# Josy Quinaia — Website

Official institutional website developed for **Josy Quinaia**, an advanced aesthetics professional.

The project was created to establish a professional digital presence, present the services offered, and provide an easy way for potential clients to get in touch and schedule an evaluation.

## Live Website

**[Visit the Website](https://josy-quinaia.vercel.app/)**

## About the Project

The website was designed with a focus on:

- Professional visual identity
- Responsive design
- Clear presentation of services
- Easy contact and appointment access
- Mobile-friendly experience
- Fast and intuitive navigation

## Features

- Responsive layout for desktop, tablet, and mobile
- Professional landing page
- Services presentation
- About section
- Customer reviews section, loaded live from Google through a Vercel serverless function
- Contact section
- WhatsApp integration
- Instagram integration
- Direct appointment call-to-action

## Technologies

- HTML5
- CSS3
- JavaScript
- Vercel

## Project Structure

```text
josy-quinaia-website/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── api/
│   └── reviews.js        (serverless: Google Places proxy)
├── dev-server.js         (local server: site + /api)
├── .env.example
└── README.md
```

## Google reviews setup (Vercel)

The API key never reaches the browser: `/api/reviews` runs on the server and calls the Google Places API (New).

1. In Google Cloud, enable **Places API (New)** and create an API key. Restrict the key to that API only
   (HTTP-referrer restrictions don't apply to server calls).
2. Find the business **Place ID** (Google's "Place ID Finder").
3. In Vercel > Settings > Environment Variables, add `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID`, then redeploy.
4. For local testing use `vercel dev` with a `.env.local` based on `.env.example`.

Notes: Google returns at most 5 reviews per place (chosen by Google). Responses are cached at the Vercel CDN for 1 hour.

### Running locally

`node dev-server.js` (Node 18+, no install) serves the site **and** `/api/reviews` at http://localhost:3000,
reading `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` from `.env.local`.
A plain static server (Live Server, `python -m http.server`, opening the file) cannot run `/api` and will show
"Não foi possível carregar as avaliações".

### Troubleshooting

Open `https://YOUR-SITE.vercel.app/api/reviews` in the browser (or check the Console/F12 and Vercel > Logs):

| What you see | Cause | Fix |
|---|---|---|
| Vercel 404 page | `api/` folder is not at the repository root | Deploy the folder that contains `index.html` **and** `api/` |
| `{"error":"not_configured","missing":[...]}` | Env var missing / no redeploy | Add the variables (Production), then redeploy |
| `{"error":"invalid_place_id"}` | Wrong Place ID format | Use the `ChIJ...` ID from Place ID Finder |
| `reason: SERVICE_DISABLED` | Wrong/disabled API | Enable **Places API (New)** |
| `reason: BILLING_DISABLED` | No billing account | Enable billing in the Google Cloud project |
| `reason: API_KEY_HTTP_REFERRER_BLOCKED` / `API_KEY_IP_ADDRESS_BLOCKED` | Key restricted by site/IP | Restrict the key by **API** only |
| `reason: API_KEY_INVALID` | Bad key | Re-copy the key (no spaces/quotes), redeploy |
| `reason: NOT_FOUND` | Place ID not found | Re-check the Place ID |
| JSON with `reviews: []` | Place has no public reviews | Nothing to fix |

Full details (never the key) are written to the Vercel function logs.

## Development

This project is maintained as an independent repository, allowing the website to be developed, updated, and deployed separately from other EventHorizon-Web projects.

## Team

Developed by **Lucas and Tiago** under the **EventHorizon-AI** initiative.

## Related Projects

This website is part of **EventHorizon-Web**, our web development initiative focused on creating digital experiences for businesses and professionals.

**[EventHorizon-Web](https://github.com/EventHorizon-ia/EventHorizon-Web)**

---

*From ideas to digital experiences.*
