# Build Plan: Shark Tank Simulator

> Detailed plan for the app. Requirements live in `chosen problem statement.txt`; rules and hard limits in `AGENTS.md`.
> Build window: about 10:00 to 18:00 on 8 Oct 2026. Required features first, extras only after a working deploy.

## 1. Product in one line
Pitch your idea to a panel of 4 AI sharks. They grill you round by round, their interest rises or falls with every answer, they make (or refuse) offers you can negotiate, and you leave with a scorecard and a rewritten, stronger pitch.

## 2. Tech stack
| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 16 (App Router) + TypeScript + Tailwind 4** (already scaffolded) | UI and API routes in one deploy |
| AI | **Gemini API** via `@google/genai` (installed), model from env `GEMINI_MODEL` (default: a current Flash model) | Free tier, fast, JSON-schema output |
| Voice (extra) | Browser `SpeechRecognition` + `speechSynthesis` | Free, no extra API |
| State | Client-side (React state + `localStorage` for the session) | No database needed; the server is stateless |
| Hosting | **Vercel** (Hobby, free) | User has an account; `vercel` CLI installed |

Secret: `GEMINI_API_KEY` only, in Vercel env vars and the git-ignored `.env.local`. `.env.example` lists the names.

## 3. The panel (personas)
| Shark | Cares about | Typical hard question |
|---|---|---|
| **Vikram "The Numbers"**: blunt ex-banker | Unit economics, margins, CAC/LTV, valuation | "What does it cost you to get one customer, and what do they pay you?" |
| **Meera "The Customer"**: D2C founder | Who pays, distribution, real demand evidence | "Name one person who has paid for this." |
| **Arjun "The Skeptic"**: deep-tech CTO | Feasibility, moat, why now, copycat risk | "What stops Google doing this next week?" |
| **Zara "The Visionary"**: brand and impact investor | Founder, story, market size, mission | "Why are *you* the person to build this?" |

Personas live in `lib/sharks.ts` (name, emoji/avatar colour, focus, voice, style, deal tendencies) so prompts and UI share one source.

## 4. Session flow (state machine)
```
PITCH  ->  QUESTIONING (rounds)  ->  DEAL  ->  DEBRIEF
```
1. **Pitch:** founder enters idea name, a one-line ask (e.g. "Rs 50 lakh for 10%") and the pitch (text or voice). Optional difficulty.
2. **Questioning:** up to ~8 founder answers in total. Each turn:
   - the server picks the next shark (the one whose concern is least resolved, or a follow-up if the last answer was weak);
   - the shark asks one sharp question (reacting to the previous answer when relevant);
   - the founder answers; the server evaluates the answer -> per-shark interest deltas (-20..+20), a short reaction line, a flag `dodged`;
   - a shark whose interest drops below 20 **walks out** ("I'm out") with a reason and leaves the round.
3. **Deal:** each remaining shark with interest >= 50 makes an offer (amount, equity %, optional condition such as royalty or advisor seat); others say why they're out. Founder can **accept one, counter, or walk away**; a counter gets accept / counter-back / walk (max 2 counter rounds).
4. **Debrief:** scorecard, strongest and weakest answers, the question dodged, what each shark wanted to hear, and a **rewritten 60-second pitch** plus 3 things to fix before a real investor meeting.

## 5. API routes (stateless; the client sends the session transcript each call)
| Route | Input | Output (Gemini `responseSchema` JSON) |
|---|---|---|
| `POST /api/question` | pitch, transcript, interest map, active sharks, difficulty | `{ sharkId, question, isFollowUp }` |
| `POST /api/evaluate` | pitch, transcript, latest Q and A | `{ reactions: [{sharkId, delta, line}], dodged: bool, quality: 1-5, walkouts: [{sharkId, reason}] }` |
| `POST /api/offers` | pitch, transcript, interest map | `{ offers: [{sharkId, amount, equity, condition?, line}], outs: [{sharkId, reason}] }` |
| `POST /api/negotiate` | offers, founder counter | `{ sharkId, response: "accept" \| "counter" \| "walk", amount?, equity?, line }` |
| `POST /api/debrief` | full session | `{ scores: {problem, market, business, team, answers}, overall, verdict, strengths[], weaknesses[], dodged, sharkWishes[], improvedPitch, fixes[] }` |

`/api/question` and `/api/evaluate` can be merged into one call per turn if latency or rate limits bite (evaluate answer + produce next question). Start with the merged version: **one Gemini call per turn** keeps us inside the free tier.

**Prompt rules:** each shark stays in persona and focus; questions are specific to *this* pitch (cite its claims and numbers), one question at a time, under 40 words; follow-ups target vagueness ("you said 'lots of users': how many?"); tough but never insulting; Indian startup context (Rs, lakh/crore) by default. Difficulty changes strictness of evaluation and offer terms.

**Reliability:** input length limits, 15 s timeout, one retry, then a scripted fallback question bank per shark and neutral evaluation so a session never dead-ends during the demo. Simple per-IP rate limit to protect the free quota.

## 6. UI
- **Landing (`/`):** "Enter the Tank" hero, the 4 sharks on show, pitch form (idea name, ask, pitch textarea, mic button), difficulty toggle, 2 sample pitches to try.
- **Tank (`/tank`):** sharks in a row across the top: avatar, name, focus tag, **interest meter** (animated bar), "OUT" state greyed with stamp. Below: chat transcript (shark bubbles coloured per shark, founder bubbles right), answer box with mic, round counter. Typing indicator "Vikram is thinking...". Optional read-aloud.
- **Deal (`/tank` deal stage):** offer cards (Rs, %, implied valuation computed in code), buttons Accept / Counter (amount + equity inputs) / Walk away; responses animate in.
- **Debrief (`/debrief`):** verdict banner ("DEAL with Meera: Rs 40L for 15%" or "No deal"), radar/bars scorecard, dodged question, improved pitch with **Copy** button, "Pitch again" (pre-fills the improved pitch).
- Dark stage-lighting theme, mobile responsive.

## 7. File layout
```
app/
  page.tsx               landing + pitch form
  tank/page.tsx          questioning + deal (client component, state machine)
  debrief/page.tsx       results
  api/turn/route.ts      evaluate answer + next question (merged)
  api/offers/route.ts
  api/negotiate/route.ts
  api/debrief/route.ts
lib/
  sharks.ts    personas
  gemini.ts    client, call helper with schema, timeout, retry
  prompts.ts   prompt builders
  fallback.ts  scripted questions/evaluations
  session.ts   types + state machine + localStorage
  types.ts
components/  SharkPanel, InterestMeter, ChatLog, AnswerBox, MicButton, OfferCard, Scorecard
.env.example  README.md
```

## 8. Timeline
| Time | Milestone | Done when |
|---|---|---|
| 10:30-11:00 | Clean scaffold, `.env.example`, git init, push to GitHub, **deploy hello-world to Vercel** | Live URL opens |
| 11:00-12:15 | `lib/sharks.ts`, `lib/gemini.ts`, `lib/prompts.ts`, `/api/turn` | Curl a pitch + answer, get a good question and deltas |
| 12:15-13:30 | Landing + Tank page (panel, meters, chat, answer box). **Redeploy** | A full questioning session works live: **all REQUIRED except debrief** |
| 13:30-14:00 | Lunch / buffer | |
| 14:00-15:00 | `/api/debrief` + debrief page with improved pitch. **Redeploy** | **All REQUIRED features work on the live URL** |
| 15:00-16:15 | Extras: walkouts, deal round + negotiation | Redeployed after each works |
| 16:15-16:45 | Voice in/out, difficulty | |
| 16:45-17:15 | Polish, mobile, fallback paths, rate limit, error states | |
| 17:15-17:45 | README with live link, repo size check, incognito full demo, `SUBMISSION CHECKLIST.txt` | All boxes ticked |
| 17:45 | Submit (only 2 attempts in total) | |

If behind at 15:00: drop voice first, then negotiation (keep plain offers), then walkouts.

## 9. Parallel work split (for multiple AIs)
- **Agent A:** `lib/sharks.ts`, `lib/prompts.ts`, `lib/gemini.ts`, API routes
- **Agent B:** UI components and pages, built against `lib/types.ts` with mocked API responses
- **Agent C:** voice, deal round, polish
Agree on `lib/types.ts` first, then each works in its own files.

## 10. Demo script (60-90 s)
1. Hand a judge the laptop: "Pitch any idea in one line."
2. Sharks ask; the judge answers one vaguely and watches the interest meter drop and a follow-up land.
3. Offers come in; counter one live.
4. Debrief shows the rewritten pitch: "this is what you should have said."
