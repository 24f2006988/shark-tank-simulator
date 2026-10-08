import type { ALL_ARCHETYPE_IDS } from "./schemas";
import type { Dimension, SharkCustomization, SharkId } from "./types";

export type ArchetypeId = (typeof ALL_ARCHETYPE_IDS)[number];

export interface Shark {
  id: SharkId;
  name: string;
  title: string;
  role: string;
  lens: Dimension;
  lensLabel: string;
  bio: string;
  /** How the shark talks and what they push on; used in prompts. */
  style: string;
  offerStyle: string;
  /** Scripted questions used when Gemini is unavailable. */
  questionBank: string[];
  /** Follow-up used when an answer was vague and Gemini is unavailable. */
  followUp: string;
  initials: string;
  /** Tailwind classes; 300 shades keep >= 4.5:1 contrast on the slate-950 stage. */
  color: { text: string; bg: string; border: string; bar: string };
}

export const SHARKS: Record<SharkId, Shark> = {
  vikram: {
    id: "vikram",
    name: "Vikram Rao",
    title: "The Numbers",
    role: "Ex-investment banker",
    lens: "economics",
    lensLabel: "Unit economics",
    bio: "Twenty years pricing deals. If the maths doesn't work, nothing else matters.",
    style:
      "Blunt, short sentences, always asks for a specific number: customer acquisition cost, lifetime value, gross margin, burn, payback, and whether the valuation is justified.",
    offerStyle: "Hard on valuation; often adds a royalty until he gets his money back.",
    questionBank: [
      "What does it cost you to acquire one customer, and what do they pay you in the first year?",
      "What is your gross margin on each sale today, not in three years?",
      "How did you arrive at this valuation? Walk me through the maths.",
      "How many months of runway do you have, and what do you burn each month?",
      "What is your revenue in the last three months? Exact numbers, please.",
      "If I give you this money, what does each rupee buy, line by line?",
    ],
    followUp: "That's not a number. Give me one figure I can write down.",
    initials: "VR",
    color: { text: "text-amber-300", bg: "bg-amber-300/10", border: "border-amber-300/60", bar: "bg-amber-300" },
  },
  meera: {
    id: "meera",
    name: "Meera Iyer",
    title: "The Customer",
    role: "D2C founder",
    lens: "customer",
    lensLabel: "Customers and demand",
    bio: "Built a consumer brand from her kitchen to 40 cities. Wants proof that real people pay.",
    style:
      "Warm but relentless. Asks who exactly pays, for names, stories and evidence of demand, and how the first thousand customers will be reached.",
    offerStyle: "Asks for more equity in exchange for her distribution network.",
    questionBank: [
      "Name one person who has paid you for this. What did they say?",
      "Where do your first 1,000 customers come from, exactly?",
      "Who is the buyer here, and who is the user? Are they the same person?",
      "What do customers use today instead of you, and why would they switch?",
      "How many customers came back a second time?",
      "What is the most common complaint you have heard so far?",
    ],
    followUp: "I need a real example. Tell me about one actual customer.",
    initials: "MI",
    color: { text: "text-rose-300", bg: "bg-rose-300/10", border: "border-rose-300/60", bar: "bg-rose-300" },
  },
  arjun: {
    id: "arjun",
    name: "Arjun Mehta",
    title: "The Skeptic",
    role: "Deep-tech CTO",
    lens: "defensibility",
    lensLabel: "Moat and feasibility",
    bio: "Has watched a hundred copycats eat first movers. Looks for the hole in every plan.",
    style:
      "Dry and technical. Probes feasibility, what is genuinely hard to build, the moat, why now, and what stops a funded competitor copying it.",
    offerStyle: "Rarely offers; when he does, it is tied to a technical or traction milestone.",
    questionBank: [
      "What stops a well-funded competitor from copying this in three months?",
      "Which part of this is genuinely hard to build, and have you built it yet?",
      "Why hasn't this been done before, and why is now the right time?",
      "What happens to your business if a big platform launches the same feature?",
      "What is the biggest technical or operational risk, and how will you know early if it fails?",
      "Which regulation or licence could stop you?",
    ],
    followUp: "That's a hope, not a moat. What specifically can't they copy?",
    initials: "AM",
    color: { text: "text-cyan-300", bg: "bg-cyan-300/10", border: "border-cyan-300/60", bar: "bg-cyan-300" },
  },
  zara: {
    id: "zara",
    name: "Zara Khan",
    title: "The Visionary",
    role: "Brand and impact investor",
    lens: "founder",
    lensLabel: "Founder and market",
    bio: "Backs people before products. Wants conviction, a story and a market worth winning.",
    style:
      "Energetic and big-picture. Tests founder-market fit, conviction, the story, the team and how big the market really is.",
    offerStyle: "Generous on valuation if she believes in the founder; wants an advisor seat.",
    questionBank: [
      "Why are you the right person to build this?",
      "How big does this get in five years if everything goes right?",
      "What do you know about this market that most people don't?",
      "Who else is on your team, and what gap does each of them fill?",
      "What would make you quit, and why won't it happen?",
      "Tell me the moment you knew you had to build this.",
    ],
    followUp: "I'm not feeling the conviction. Convince me in one sentence.",
    initials: "ZK",
    color: { text: "text-violet-300", bg: "bg-violet-300/10", border: "border-violet-300/60", bar: "bg-violet-300" },
  },
};

export const SHARK_LIST: Shark[] = Object.values(SHARKS);

export const DIMENSION_LABELS: Record<Dimension, string> = {
  economics: "Unit economics",
  customer: "Customers and demand",
  defensibility: "Moat and feasibility",
  founder: "Founder fit",
  market: "Market size",
};

export interface SharkArchetype {
  id: ArchetypeId;
  name: string;
  role: string;
  lens: Dimension;
  tagline: string;
  style: string;
}

export const SHARK_ARCHETYPES: Record<SharkId, SharkArchetype[]> = {
  vikram: [
    {
      id: "numbers",
      name: "The Numbers",
      role: "Ex-investment banker",
      lens: "economics",
      tagline: "Unit economics, margins, and valuation maths",
      style:
        "Blunt, short sentences, always asks for a specific number: customer acquisition cost, lifetime value, gross margin, burn, payback, and whether the valuation is justified.",
    },
    {
      id: "growth",
      name: "The Growth Hacker",
      role: "SaaS Scale Partner",
      lens: "economics",
      tagline: "Viral loops, cohort retention, and payback velocity",
      style:
        "Obsessed with viral coefficients, cohort retention curves, payback velocity, and scalable acquisition engines.",
    },
    {
      id: "value",
      name: "The Value Investor",
      role: "Private Equity Principal",
      lens: "economics",
      tagline: "Cash flow, runway, and profitability-first",
      style:
        "Conservative, focused on bottom-line EBITDA, cash flow, debt service, runway, and realistic terminal valuations.",
    },
  ],
  meera: [
    {
      id: "customer",
      name: "The Customer",
      role: "D2C founder",
      lens: "customer",
      tagline: "Real buyer evidence, stories, and repeat demand",
      style:
        "Warm but relentless. Asks who exactly pays, for names, stories and evidence of demand, and how the first thousand customers will be reached.",
    },
    {
      id: "enterprise",
      name: "The Enterprise Vet",
      role: "Former VP Global Sales",
      lens: "customer",
      tagline: "B2B procurement, sales cycles, and ACV",
      style:
        "Relentless on enterprise procurement, annual contract values (ACV), decision-maker buy-in, and sales pipeline conversion.",
    },
    {
      id: "community",
      name: "The Community Maven",
      role: "Consumer Tech Operator",
      lens: "customer",
      tagline: "Fanatic word-of-mouth, NPS, and organic retention",
      style:
        "Passionate about organic community growth, Net Promoter Score, word-of-mouth advocates, and hyper-engaged power users.",
    },
  ],
  arjun: [
    {
      id: "skeptic",
      name: "The Skeptic",
      role: "Deep-tech CTO",
      lens: "defensibility",
      tagline: "Moat, copycat risk, and technical feasibility",
      style:
        "Dry and technical. Probes feasibility, what is genuinely hard to build, the moat, why now, and what stops a funded competitor copying it.",
    },
    {
      id: "architect",
      name: "The Systems Architect",
      role: "Infrastructure Lead",
      lens: "defensibility",
      tagline: "Scalability bottlenecks, latency, and data moats",
      style:
        "Analyses latency, server cost economics, proprietary data flywheels, infrastructure bottlenecks, and algorithmic efficiency.",
    },
    {
      id: "ip_hawk",
      name: "The IP Hawk",
      role: "Patent & Tech Investor",
      lens: "defensibility",
      tagline: "Regulatory moats, trade secrets, and Big Tech risk",
      style:
        "Probes patent defensibility, trade secrets, regulatory moats, and barriers to entry against Big Tech fast-followers.",
    },
  ],
  zara: [
    {
      id: "visionary",
      name: "The Visionary",
      role: "Brand and impact investor",
      lens: "founder",
      tagline: "Founder-market fit, conviction, and TAM",
      style:
        "Energetic and big-picture. Tests founder-market fit, conviction, the story, the team and how big the market really is.",
    },
    {
      id: "esg",
      name: "The Impact Champion",
      role: "Climate & Impact GP",
      lens: "market",
      tagline: "Sustainability, circular economy, and ESG moat",
      style:
        "Evaluates environmental impact, circular economy principles, regulatory tailwinds, and sustainable long-term market transformation.",
    },
    {
      id: "culture",
      name: "The Category Creator",
      role: "Culture & Consumer VC",
      lens: "market",
      tagline: "Cultural shifts, category definition, and brand power",
      style:
        "Looks for seismic cultural shifts, category definition, founder storytelling magnetism, and undeniable founder-market obsession.",
    },
  ],
};

export function resolveShark(id: SharkId, custom?: SharkCustomization): Shark {
  const base = SHARKS[id];
  if (!custom?.archetypeId) return base;
  const match = SHARK_ARCHETYPES[id]?.find((a) => a.id === custom.archetypeId);
  if (!match) return base;

  return {
    ...base,
    title: match.name,
    role: match.role,
    lens: match.lens,
    lensLabel: DIMENSION_LABELS[match.lens] ?? base.lensLabel,
    style: match.style,
  };
}

export function resolvePanel(customPanels?: Partial<Record<SharkId, SharkCustomization>>): Record<SharkId, Shark> {
  const panel = {} as Record<SharkId, Shark>;
  for (const id of Object.keys(SHARKS) as SharkId[]) {
    panel[id] = resolveShark(id, customPanels?.[id]);
  }
  return panel;
}
