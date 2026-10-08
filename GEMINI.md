# PromptWars: 8-Hour Build With AI Hackathon

> Shared context for ANY AI agent or human working in this repo (Claude Code, Antigravity, Gemini, ChatGPT, Cursor, Copilot, etc.).
> Read this first. Source of truth: `AGENTS.md`. `GEMINI.md` is a copy and `CLAUDE.md` imports it. Edit `AGENTS.md`, then re-copy to `GEMINI.md`.
> Several AIs work in parallel here, so keep changes small, don't rewrite files you didn't create, and log what you did under "Progress log" below.

Organized by the Dept. of Computer Science, Pondicherry University. Part of the hack2skill/Google PromptWars program.
Event page: https://hack2skill.com/event/promptwars-x-the-prompt-arena-pu/?sectionid=6aa90a039d38ac1eb4ddb596

## Schedule
- **Date:** 8 October 2026. Reporting at 9:00 AM sharp. Venue: Ground Floor Lab, Dept. of Computer Science.
- 09:00-09:30: reporting and check-in.
- 09:30-10:00: briefing, submission-website walkthrough and problem-statement reveal (Room 104, New Building).
- From about 10:00: build time (8 hours in total). The organizers' announcement was cut off after this point, so the exact submission deadline and finale time are unknown.
- Organizers emailed a detailed walkthrough covering the schedule, submission timings, guidelines, certificate eligibility and the finale / Top 10 selection.

## Rules and deliverables
- Any AI agent may be used.
- The solution must **implement every feature asked in the problem statement**.
- Submit a **working cloud (deployed) link** and a **GitHub link** through the organizers' submission website. **Only 2 submission attempts in total** (see HARD LIMITS rule 4).
- The Top 10 go to a finale (pitch).

## HARD LIMITS (enforced, never cross; breaking one can disqualify the submission)
1. **GitHub repo must stay under 10 MB, including git history.** Working ceiling is **8 MB** to keep a safety margin.
   - Never commit `node_modules/`, build output (`.next/`, `dist/`, `build/`), `.env` files, logs, videos, large images, datasets, zips or model files. `.gitignore` covers these; don't weaken it.
   - Images: compressed (WebP/SVG), each under 200 KB. Prefer CSS/SVG/icons over image files. No fonts committed; load them from Google Fonts.
   - A big file committed and then deleted still counts (it stays in history). If one slips in, stop and fix history before pushing.
   - Run `sh scripts/check-repo-size.sh` before every push. It is installed as a git pre-commit hook and blocks the commit if the limit is broken.
2. **The app must be deployed and the cloud link must work at submission time.**
   - Deploy within the first 1-2 hours, then redeploy after every working feature. Never leave the live link broken.
   - Open the live URL in a fresh incognito window before submitting and run the full demo (pitch, get questioned by the panel, answer, offers, debrief with improved pitch).
   - All secrets (Gemini API key) go in the host's environment variables, never in the repo or client-side code.
3. **Every required feature in `chosen problem statement.txt` must work on the deployed app**, not only locally.
4. **Only 2 submission attempts in total. Submit only a COMPLETE, final app.**
   - No AI agent ever submits or tells the user to submit without first passing the pre-submission checklist in `SUBMISSION CHECKLIST.txt`, with every box ticked.
   - Attempt 1 is the real, final submission. Attempt 2 is an emergency reserve only (e.g. the link breaks or a wrong URL was pasted). Never plan to "submit early and fix later".
   - Submit well before the deadline (target 30+ minutes early), never in the last minutes.
   - After submitting, freeze the deployed app: no risky redeploys or pushes that could break the live link or push the repo over 10 MB while judging is in progress.
   - Log each attempt in the Progress log (time, URL, repo link, commit hash).

## Problem statements
The candidate problems are in `problem statements.txt`: Story Teacher, GitHub Roast and Rescue, Bug Hunt Arena (it appears twice, as items 1 and 3), Shark Tank Simulator, Say It Right, and Campus Hustle. The statement revealed on the day is the one that counts. Campus Hustle must have sellers posting, buyers browsing and buyer-seller chat with price bargaining, and it needs no AI inside the app.

## Working guidance
- Favor a small, fully working, deployed app over a large unfinished one. Check every feature in the problem statement off against the build.
- Deploy early, push to GitHub often, and keep the README short with the live link.

## Project status (update as decisions are made)
- Chosen problem: **Shark Tank Simulator** (switched from GitHub Roast and Rescue for more interaction). Full statement, required-feature checklist and planned extras in `chosen problem statement.txt` (read it before building).
- Tech stack: **Next.js 16 + TypeScript + Tailwind 4, Gemini API (`@google/genai`, free tier key), hosted on Vercel**. Full build plan: `PLAN.md`.
- Deployed URL: _TBD_
- GitHub repo: https://github.com/24f2006988/shark-tank-simulator

## Progress log (append one line per change: time, which AI, what)
- 2026-10-08, Claude Code: chose GitHub Roast and Rescue; created `chosen problem statement.txt`; updated Project status.
- 2026-10-08, Claude Code: added HARD LIMITS (repo < 10 MB, deployment must work), `.gitignore`, `scripts/check-repo-size.sh`.
- 2026-10-08, Claude Code: wrote `PLAN.md` (architecture, scoring, Gemini schema, UI, timeline, work split).
- 2026-10-08, Claude Code: added HARD LIMIT 4 (only 2 submission attempts, submit complete app only) and `SUBMISSION CHECKLIST.txt`.
- 2026-10-08, Claude Code: switched to Shark Tank Simulator; rewrote `chosen problem statement.txt`, `PLAN.md`, checklist section A; scaffolded Next.js 16 app (deps installed, not yet committed).
- 2026-10-08, Claude Code: first commit pushed to https://github.com/24f2006988/shark-tank-simulator (hello-world page, README, .env.example, pre-commit size hook installed).
