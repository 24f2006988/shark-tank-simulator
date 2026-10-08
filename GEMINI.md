# PromptWars: 8-Hour Build With AI Hackathon

> Shared context for ANY AI agent or human working in this repo (Claude Code, Antigravity, Gemini, ChatGPT, Cursor, Copilot, etc.).
> Read this first. Source of truth: `AGENTS.md`. `GEMINI.md` is a copy and `CLAUDE.md` imports it. Edit `AGENTS.md`, then re-copy to `GEMINI.md`.
> Several AIs work in parallel here, so keep changes small, don't rewrite files you didn't create, and log what you did under "Progress log" below.

## ⚠️ READ BEFORE EVERY CHANGE: build for the 7 scoring metrics
An **AI evaluator** scores the repo + live app out of 100 on these 7 metrics. Every agent must maintain all of them on **every** change, not "later". Before you finish any task, check your change against this list:
1. **Code Quality:** small typed modules with one job each, clear names, ESLint clean (`npm run lint`), no dead code, no `any`.
2. **Security:** secrets only in server env vars (never in repo, image or client); validate and length-limit every request body; validate Gemini JSON before use; rate limit; no `dangerouslySetInnerHTML`.
3. **Efficiency:** one Gemini call per turn; no new dependency without a clear need; no redundant fetches or re-renders.
4. **Testing:** add or update **Vitest** tests in the same change as the code (`npm test` must pass).
5. **Accessibility:** semantic HTML, labels/ARIA (`role="meter"`, `aria-live` for shark messages), full keyboard use, visible focus, WCAG AA contrast, `prefers-reduced-motion`.
6. **Google Services:** prefer Google tech when there is a choice (Gemini API, Cloud Run, Secret Manager, Cloud Logging, Google Fonts, Cloud TTS) and list each in the README's "Google services used" section.
7. **Problem Statement Alignment:** every required feature in `chosen problem statement.txt` works on the live app; keep the README's feature-to-code map up to date.

If a change would hurt a metric, say so in your Progress log line. When handing work to another agent, **pass this list on**.

## ⚠️ YOU ARE NOT ALONE: coordinate with the other agents
Several AI agents (Claude Code sessions, Gemini/Antigravity, others) edit this repo **at the same time**, all on the single `main` branch and **in the same working folder**, so other agents' uncommitted edits are sitting in your working tree (never commit, stash-drop or `git checkout --` them). Assume someone else changed something since you last looked. Follow this protocol:
1. **Before starting a task:** run `git pull --rebase --autostash` and `git status`, re-read this file (Work board, Next steps, last 10 Progress log lines), then **claim** your task on the Work board below (agent name, task, files, time).
2. **Stay in your lane:** only edit files you claimed or own (ownership in `PLAN.md` section 16). Need a change in someone else's file? Ask in the Progress log or the Work board instead of editing it. Never delete, revert or reformat other agents' work.
3. **Shared files need care:** `package.json` / `package-lock.json` (only the backend owner adds dependencies; ask first), `lib/types.ts` (contracts: additive changes only and log them), `AGENTS.md` / `PLAN.md` (append or edit your own lines; don't rewrite sections), `app/layout.tsx`, `app/globals.css`.
4. **Re-read a file right before editing it.** If it changed under you, merge with what is there rather than overwriting it.
5. **Commit small and often, only your own files:** `git add <your paths>` (never `git add -A` / `git add .`, which sweeps up other agents' half-finished work), then `git pull --rebase --autostash`, then `npm run lint && npm test` pass, then `git push`. Never force-push, never create branches, never rewrite history.
6. **Deploys:** only the agent that owns deploys (see Work board) runs `gcloud run deploy`, and only from a clean, pushed, passing `main`. Others ask for a redeploy in the log.
7. **When done:** add a Progress log line (time, agent, what, which metrics it affects), then move your Work board row to "done" or remove it.
8. **Mind the generated block:** `next dev` appends the "nextjs-agent-rules" block at the end of this file; keep Progress log lines above it.

### Work board (claim before you start; one row per active task)
| Agent | Task | Files claimed | Since | Status |
|---|---|---|---|---|
| Claude Code (backend/quality) | Backend, API, tests, CI, deploys, README | `lib/*` (except `session.ts`, `samples.ts`), `app/api/*`, `tests/*`, `.github/*`, `Dockerfile`, `next.config.ts`, `README.md` | 11:30 | active |
| Frontend agent | UI pages and components | `components/*`, `app/page.tsx`, `app/tank/*`, `app/layout.tsx`, `app/globals.css`, `lib/session.ts`, `lib/samples.ts` | 11:30 | active |

Organized by the Dept. of Computer Science, Pondicherry University. Part of the hack2skill/Google PromptWars program.
Event page: https://hack2skill.com/event/promptwars-x-the-prompt-arena-pu/?sectionid=6aa90a039d38ac1eb4ddb596

## Schedule (source: organizers' email "Final Info: Build With AI Hackathon", 7 Oct 2026)
- **8 Oct 2026 (build day).** Reporting 9:00 AM sharp, Ground Floor Lab, Dept. of Computer Science.
- 09:00-09:15: reporting and check-in. 09:15-10:00: briefing, submission-website walkthrough, problem-statement reveal (Room 104, New Building).
- **10:00-18:00: 8-hour build sprint** (Ground and Second Floor labs).
- **18:00-18:30: FINAL SUBMISSION window. Hard deadline 18:30, no extension.** Our target: submit by 17:45-18:00.
- **8 Oct by midnight:** Top 10 finalists announced by email and on the submission portal.
- **9 Oct (finale day), Top 10 only:** PPT presentation + final evaluation + winner announcement. Venue/time sent to finalists on the night of 8 Oct. Prize pool Rs 15,000.

## Rules and deliverables
Sources: organizers' email (7 Oct) and the official deck `Prompt_Arena_Participant_Briefing.pdf` (repo root, git-ignored). The deck wins where they differ.
- Any AI agent may be used. Log in to the hack2skill **Innovator Dashboard** with the registration email (hrisitroy4@gmail.com); submit in its **Submissions** tab when it shows ONGOING ("Submission Attempts: 0/2").
- **Submission = 3 links, all required. One missing or incorrect field invalidates the entry:**
  1. **GitHub repo**: public, link must END IN `.git` (`https://github.com/24f2006988/shark-tank-simulator.git`).
  2. **Cloud Run URL**: the deployed app, **hosted on Google Cloud Run ONLY. No other host (Vercel, Netlify, Firebase Hosting...) is accepted.**
  3. **LinkedIn post**: short, clear post about what was built; must NAME the problem statement (Shark Tank Simulator) and show how the app addresses it. Vague posts hurt the alignment score.
- **Scoring (automated, score shown instantly after submitting):** Code Quality (clean, readable, structured) | Security (no leaked keys, validate inputs and external data) | Efficiency (no redundant work, no bloated deps) | **Testing (unit/integration tests showing coverage)** | **Accessibility (semantic HTML, ARIA labels, keyboard use, contrast)** | Problem Alignment (solves the stated challenge, not just impressive tech).
  - The scorer is an **AI evaluator** that reads the GitHub repo and the deployed app and gives a score out of 100 with **7 categories**: Code Quality, Security, Efficiency, Testing, Accessibility, **Google Services**, Problem Statement Alignment. (Briefing example of a weak entry: 25.56/100 with Code Quality 55, Security 70, Efficiency 20, Testing 13, Accessibility 15, **Google Services 0, Problem Statement Alignment 0**.)
  - **Google Services** counts on its own: use and visibly document Google tech (Gemini API via `@google/genai`, Cloud Run, Secret Manager for the key, Cloud Logging, Google Fonts; optionally Cloud Text-to-Speech / Firebase). Name them in the README.
  - **Problem Statement Alignment** is judged from what the evaluator can see: the README must map each required feature to where it is in the code and app.
- **Only the LATEST score counts**, not the best (90 then 60 = 60 on the leaderboard). The leaderboard updates live.
- Only 2 submission attempts in total, no appeals (see HARD LIMITS rule 4).
- The solution must **implement every feature asked in the problem statement**. Certificate needs at least **80% of problem-statement features**; aim for 100%.
- **Participation certificate only if all three:** checked in before 09:30 AM on 8 Oct; BOTH links submitted before 18:30; at least 80% of features covered. No certificate for late or incomplete submissions.
- The Top 10 go to a finale on 9 Oct with a **PPT presentation**: keep a short deck outline in mind (problem, demo, panel design, tech, what's next).
- Queries: organizers' WhatsApp community (link in the email).

## HARD LIMITS (enforced, never cross; breaking one can disqualify the submission)
0. **Repo: public, EXACTLY ONE branch (`main`), under 10 MB. Break any one and the repo is rejected.** Never create or push other branches (no feature branches, no `gh-pages`); all AIs commit straight to `main`. Delete any extra remote branch before submitting.
1. **GitHub repo must stay under 10 MB, including git history.** Working ceiling is **8 MB** to keep a safety margin.
   - Never commit `node_modules/`, build output (`.next/`, `dist/`, `build/`), `.env` files, logs, videos, large images, datasets, zips or model files. `.gitignore` covers these; don't weaken it.
   - Images: compressed (WebP/SVG), each under 200 KB. Prefer CSS/SVG/icons over image files. No fonts committed; load them from Google Fonts.
   - A big file committed and then deleted still counts (it stays in history). If one slips in, stop and fix history before pushing.
   - Run `sh scripts/check-repo-size.sh` before every push. It is installed as a git pre-commit hook and blocks the commit if the limit is broken.
2. **The app must be deployed ON GOOGLE CLOUD RUN and the Cloud Run URL (`*.run.app`) must work at submission time.** Vercel is not accepted.
   - Deploy within the first 1-2 hours, then redeploy after every working feature. Never leave the live link broken.
   - Open the live URL in a fresh incognito window before submitting and run the full demo (pitch, get questioned by the panel, answer, offers, debrief with improved pitch).
   - All secrets (Gemini API key) go in Cloud Run environment variables (or Secret Manager), never in the repo, the Docker image or client-side code.
3. **Every required feature in `chosen problem statement.txt` must work on the deployed app**, not only locally.
4. **Only 2 submission attempts in total. Submit only a COMPLETE, final app.**
   - No AI agent ever submits or tells the user to submit without first passing the pre-submission checklist in `SUBMISSION CHECKLIST.txt`, with every box ticked.
   - Attempt 1 is the real, final submission. Attempt 2 only to fix the specific weak parameters named in attempt 1's feedback, or a wrong link. Only the LATEST score counts, so a rushed or unchanged attempt 2 can LOWER the score. Never resubmit without changes; never plan to "submit early and fix later".
   - Submit well before the 18:30 hard deadline (target 17:45-18:00), never in the last minutes.
   - After submitting, freeze the deployed app: no risky redeploys or pushes that could break the live link or push the repo over 10 MB while judging is in progress.
   - Log each attempt in the Progress log (time, URL, repo link, commit hash).

## Problem statements
The candidate problems are in `problem statements.txt`: Story Teacher, GitHub Roast and Rescue, Bug Hunt Arena (it appears twice, as items 1 and 3), Shark Tank Simulator, Say It Right, and Campus Hustle. The statement revealed on the day is the one that counts. Campus Hustle must have sellers posting, buyers browsing and buyer-seller chat with price bargaining, and it needs no AI inside the app.

## Working guidance
- Favor a small, fully working, deployed app over a large unfinished one. Check every feature in the problem statement off against the build.
- Deploy early, push to GitHub often, and keep the README short with the live link.
- Build for the scoring rubric from the start: tests alongside code (Vitest for `lib/` and API validation), semantic HTML + ARIA + keyboard + contrast, validate every input server-side, minimal dependencies.

## Project status (update as decisions are made)
- Chosen problem: **Shark Tank Simulator** (switched from GitHub Roast and Rescue for more interaction). Full statement, required-feature checklist and planned extras in `chosen problem statement.txt` (read it before building).
- Tech stack: **Next.js 16 + TypeScript + Tailwind 4, Gemini API (`@google/genai`, free tier key), hosted on Google Cloud Run** (Docker image from Next.js `output: "standalone"`; Vercel is NOT allowed). Full build plan: `PLAN.md`.
- Deployed URL (Cloud Run, asia-south1, GCP project project-49ab7bea-3f18-4f37-868): https://shark-tank-simulator-888217860739.asia-south1.run.app
- GitHub repo: https://github.com/24f2006988/shark-tank-simulator (submit as https://github.com/24f2006988/shark-tank-simulator.git)

### Current state (12:10, 8 Oct): ALL 5 REQUIRED FEATURES LIVE (revision 00006, Gemini via Vertex AI)
- **Live:** pitch form with samples and difficulty → `/tank` with 4 sharks, interest meters, multi-turn Gemini questions, follow-ups on vague answers, walkouts → offers + counter/accept → debrief (scorecard, toughest moment, improved pitch). A headless-Chrome e2e run on the live URL passed end to end with no console errors (script in the backend agent's scratchpad; ask it to rerun).
- **Gemini now runs on Vertex AI** (billed to the user's GCP credits, about Rs 20,000). The free API key allowed only 20 requests/day for gemini-3.5-flash and was exhausted. Env (set via `--env-vars-file`): GEMINI_USE_VERTEX=true, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION=global, GEMINI_MODELS=gemini-3.8-flash,gemini-3.5-flash,gemini-3.5-flash-lite. The Cloud Run SA has roles/aiplatform.user. **Do not redeploy with `--set-env-vars` or `--env-vars-file` without these** or the app falls back to the exhausted key.
- **Backend (done):** `lib/` + 4 API routes, Gemini `gemini-3.5-flash` → `gemini-3.5-flash-lite` → scripted fallback, about 3-4 s per turn, key in **Secret Manager** (`gemini-api-key`), security headers, rate limit, 71 Vitest tests, CI workflow, README with feature map and Google services.
- **Frontend:** first version committed (3570c2b) at the user's request; the frontend agent is still polishing (`SharkFace.tsx`, OfferCard, SharkCard, Tank, globals.css uncommitted).
- **Known issues:** the "OUT" stamp overlaps shark names on the cards (frontend); the panel was too harsh even on a strong pitch (backend is tuning: non-asker reactions capped, the model may keep a follow-up).

### Next steps
1. Frontend agent: finish polish, then push and log it → backend agent redeploys and reruns the e2e.
2. Backend: tune scoring harshness; component a11y tests; Lighthouse a11y check on live.
3. Then: incognito manual demo (strong, vague, nonsense input, phone width), `SUBMISSION CHECKLIST.txt`, LinkedIn post (draft in PLAN.md section 18), submit 17:30-17:50.

### Deploy how-to (for any AI)
- gcloud is NOT on this session's PATH: use `"$env:LOCALAPPDATA\gcloud-cli\google-cloud-sdk\bin\gcloud.cmd"` (PowerShell). Account xalphanoscruiser@gmail.com, project `project-49ab7bea-3f18-4f37-868` (only project with billing), region `asia-south1` (both set as gcloud defaults).
- Redeploy: `gcloud.cmd run deploy shark-tank-simulator --source . --region asia-south1 --quiet` (about 3-4 min; env vars persist across deploys). Then `curl` the URL to confirm 200.
- Run `npm run build` locally before deploying; a failed Cloud Build leaves the previous revision serving.
- Changing the Gemini key: `gcloud.cmd run services update shark-tank-simulator --region asia-south1 --update-env-vars GEMINI_API_KEY=...` (never commit it).

## Progress log (append one line per change: time, which AI, what)
- 2026-10-08, Claude Code: chose GitHub Roast and Rescue; created `chosen problem statement.txt`; updated Project status.
- 2026-10-08, Claude Code: added HARD LIMITS (repo < 10 MB, deployment must work), `.gitignore`, `scripts/check-repo-size.sh`.
- 2026-10-08, Claude Code: wrote `PLAN.md` (architecture, scoring, Gemini schema, UI, timeline, work split).
- 2026-10-08, Claude Code: added HARD LIMIT 4 (only 2 submission attempts, submit complete app only) and `SUBMISSION CHECKLIST.txt`.
- 2026-10-08, Claude Code: switched to Shark Tank Simulator; rewrote `chosen problem statement.txt`, `PLAN.md`, checklist section A; scaffolded Next.js 16 app (deps installed, not yet committed).
- 2026-10-08, Claude Code: first commit pushed to https://github.com/24f2006988/shark-tank-simulator (hello-world page, README, .env.example, pre-commit size hook installed).
- 2026-10-08, Claude Code: added official timeline (submit 18:00-18:30, no extension), certificate rules (80% features, public GitHub, check-in by 09:30) and 9 Oct PPT finale from the organizers' email.
- 2026-10-08, Claude Code: added rules from the official briefing deck: Cloud Run ONLY (replaces Vercel), 3 required links (.git GitHub URL, Cloud Run URL, LinkedIn post), exactly one branch, scoring rubric (incl. testing + accessibility), latest score counts.
- 2026-10-08, Claude Code: added AI-evaluator scoring details (7 categories incl. Google Services) from briefing screenshot to HARD rules context and PLAN.md rubric.
- 2026-10-08, Claude Code: installed gcloud (%LOCALAPPDATA%\gcloud-cli), deployed hello-world to Cloud Run: https://shark-tank-simulator-888217860739.asia-south1.run.app. Redeploy: `gcloud run deploy shark-tank-simulator --source . --region asia-south1` (env vars persist).
- 2026-10-08 11:10, Claude Code: added "Current state", "Next steps" and "Deploy how-to" to Project status (live site is a placeholder; no features yet).
- 2026-10-08 11:35, Claude Code: rewrote `PLAN.md` as a detailed v2 spec (types and API contracts, game rules, prompts, a11y, security, tests, Google services, timeline from 11:30, work split). Model tests: use `gemini-3.5-flash` + fallback `gemini-3.5-flash-lite` (3.8-flash returned 503, 2.5-flash returns 404 for new users).
- 2026-10-08, Claude Code: added "READ BEFORE EVERY CHANGE: build for the 7 scoring metrics" rule at the top of AGENTS.md (all agents must maintain it).
- 2026-10-08, Claude Code: added "YOU ARE NOT ALONE: coordinate with the other agents" protocol and a Work board (claims) near the top of AGENTS.md.
- 2026-10-08 11:40, Claude Code (Agent A, backend): built `lib/` (schemas, types, sharks, game, prompts, gemini, fallback, handlers, http, rateLimit, log), the 4 API routes, 71 Vitest tests (`npm test`), CI workflow, security headers, README. Moved GEMINI_API_KEY to Secret Manager (`gemini-api-key`) and deploying with GEMINI_MODEL=gemini-3.5-flash. Contract notes: `SharkState` has no `asked` field (computed from turns); `/api/turn` returns updated `sharks`. Frontend files (components/, app/page.tsx, app/tank, lib/session.ts, samples, api-client) belong to Agent B; I don't edit them.
- 2026-10-08, Claude Code (frontend, Agent B): built the UI: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/tank/*`, `components/*`, `lib/session.ts`, `lib/samples.ts`, `lib/api-client.ts`. Wired to the real `/api/*` routes. Typecheck and lint clean; not committed yet.
- 2026-10-08 11:45, Claude Code (backend): LIVE revision 00002 serves all 4 APIs with Gemini (about 3.5 s per turn), key from Secret Manager, security headers on. Note: commit d9b3d24 (my `git add -A`, before the protocol existed) also committed the frontend agent's early `lib/api-client.ts`, `lib/samples.ts`, `lib/session.ts`; contents unchanged, just committed. Frontend agent: tell me in this log when the UI is pushed, and I'll run lint/test/build and redeploy. Metrics: Security, Testing, Google Services, Efficiency up.
- 2026-10-08, Claude Code (frontend): added animated SVG shark faces (`components/SharkFace.tsx`): expression follows interest, blink, talking mouth, nod or shake after each answer, respects reduced motion. No image files or dependencies.
- 2026-10-08, Claude Code (frontend): tank redesigned as a live stage: `components/Stage.tsx` (seated panel, spotlight, speech bubble) + `components/useScript.ts` (sequential lines: typewriter + browser speechSynthesis, distinct voice/pitch per shark, Skip, Voices on/off). Chat moved into a collapsed Transcript. Removed `SharkPanel.tsx`. Typecheck and lint clean; walked through in headless Edge.
- 2026-10-08, Claude Code (frontend): `SharkFace.tsx` redrawn as soft Ghibli-style SVG portraits (skin shading, sparkly eyes, hair, outfits, per-shark details) with blink, eye glance, hair sway, talking mouth and mood expressions. Pure SVG/CSS, no assets.
- 2026-10-08 12:10, Claude Code (backend): fixed broken Cloud Build (my commit 972def0 had swept in another agent's staged deletion of SharkPanel.tsx; restored in 7316d48. LESSON: `git commit` commits the whole index, so check `git diff --cached` first). Switched Gemini to Vertex AI (rev 00006); live e2e: 8/8 AI turns, about 4 s each, no console errors. Panel tuning: non-asker reactions capped at +/-6.
- 2026-10-08 12:15, Claude Code (frontend): UI PUSHED in b3881af (live stage, speaking Ghibli-style sharks, offers/debrief). Local checks: tsc, eslint, `npm test` 75/75, `next build` all green. Removed `components/SharkPanel.tsx` (new Tank.tsx uses Stage.tsx). Backend agent: please redeploy to Cloud Run and run the incognito demo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
