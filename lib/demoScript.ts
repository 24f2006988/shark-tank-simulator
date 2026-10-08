import type { Difficulty, SharkId } from "./types";

/**
 * Two real sessions recorded from the live app (Gemini panel, 8 Oct 2026) and trimmed to the key lines.
 * The replay in components/DemoReplay.tsx plays them back with no API calls.
 */
type BeatKind = "question" | "answer" | "reaction" | "walkout" | "offer";

export interface DemoBeat {
  kind: BeatKind;
  /** Speaker; absent for the founder's own lines. */
  sharkId?: SharkId;
  text: string;
  followUp?: boolean;
  /** Interest change this line caused for its speaker. */
  delta?: number;
  /** Panel state once this beat is shown: interest 0-100, or null for a shark who is out. */
  interests: Record<SharkId, number | null>;
}

interface DemoSummary {
  overall: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  fix: string;
  outcome: string;
}

export interface DemoScript {
  id: "strong" | "weak";
  label: string;
  hint: string;
  pitch: { ideaName: string; oneLiner: string; askLakh: number; equityPct: number; difficulty: Difficulty };
  beats: DemoBeat[];
  summary: DemoSummary;
}

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    "id": "strong",
    "label": "Strong pitch",
    "hint": "ChaiCart: real numbers, honest about weak spots",
    "pitch": {
      "ideaName": "ChaiCart",
      "oneLiner": "Subscription tea carts for office parks, paid per cup through UPI.",
      "askLakh": 50,
      "equityPct": 10,
      "difficulty": "realistic"
    },
    "beats": [
      {
        "kind": "question",
        "sharkId": "vikram",
        "text": "You claim 58% gross margin at Rs 15 a cup, but what is your fully loaded cost per cup including cart depreciation, wastage, and the staff salary?",
        "interests": {
          "vikram": 50,
          "meera": 50,
          "arjun": 50,
          "zara": 50
        }
      },
      {
        "kind": "answer",
        "text": "Fully loaded cost is Rs 6.3 a cup: Rs 3.1 ingredients and cups, Rs 2.2 for the cart lead's wage share at 9,000 cups a day across 22 carts, and Rs 1 for depreciation and wastage. Against the Rs 15 price that is the 58% gross margin. Each cart nets about Rs 30,000 a month, which is why the Rs 1.2 lakh setup pays back in 4 months.",
        "interests": {
          "vikram": 50,
          "meera": 50,
          "arjun": 50,
          "zara": 50
        }
      },
      {
        "kind": "reaction",
        "sharkId": "vikram",
        "text": "Detailed unit economics. Fully loaded cost adds up correctly and matches the 58 percent margin.",
        "delta": 15,
        "interests": {
          "vikram": 65,
          "meera": 55,
          "arjun": 50,
          "zara": 55
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Good to see strong daily volume across tech parks. Employees are clearly paying and renewing.",
        "delta": 5,
        "interests": {
          "vikram": 65,
          "meera": 55,
          "arjun": 50,
          "zara": 55
        }
      },
      {
        "kind": "question",
        "sharkId": "meera",
        "text": "You claim 5 of your 6 parks renewed, but how do you actually acquire the cart space in a new tech park, and who specifically signs off on that?",
        "interests": {
          "vikram": 65,
          "meera": 55,
          "arjun": 50,
          "zara": 55
        }
      },
      {
        "kind": "answer",
        "text": "The facilities head or the property manager of each park signs, and we win them by running a two-week free pilot on one floor. Employees show up on day one, so the pilot sells itself: five of the six parks renewed this year, and the sixth left only because the building was vacated. A new park takes about 6 to 9 weeks from first meeting to a signed floor-rights agreement. We already have two parks in Pune and Hyderabad in that pipeline.",
        "interests": {
          "vikram": 65,
          "meera": 55,
          "arjun": 50,
          "zara": 55
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Clear on the decision-maker and the free pilot strategy. I like that.",
        "delta": 15,
        "interests": {
          "vikram": 65,
          "meera": 70,
          "arjun": 48,
          "zara": 61
        }
      },
      {
        "kind": "reaction",
        "sharkId": "zara",
        "text": "Good execution speed moving into Pune and Hyderabad.",
        "delta": 6,
        "interests": {
          "vikram": 65,
          "meera": 70,
          "arjun": 48,
          "zara": 61
        }
      },
      {
        "kind": "question",
        "sharkId": "arjun",
        "text": "You want to build an employer dashboard for Rs 50 lakh, but what stops a tech park vendor from building the exact same portal in a week?",
        "interests": {
          "vikram": 65,
          "meera": 70,
          "arjun": 48,
          "zara": 61
        }
      },
      {
        "kind": "answer",
        "text": "The dashboard is the smaller part. Our moat is the floor-rights agreements and the UPI data. We hold exclusive floor rights per park and 14 months of cup-level data on when each floor peaks, so we staff and stock by the hour. A vendor portal cannot see that data, and a rival cart company needs the same landlord approvals, which took us months per park. The Rs 12 lakh dashboard turns that data into a monthly subsidy tool employers pay for.",
        "interests": {
          "vikram": 65,
          "meera": 70,
          "arjun": 48,
          "zara": 61
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Floor rights are real barriers. Landlord lock-ins protect the customer funnel nicely.",
        "delta": 6,
        "interests": {
          "vikram": 70,
          "meera": 76,
          "arjun": 46,
          "zara": 65
        }
      },
      {
        "kind": "reaction",
        "sharkId": "arjun",
        "text": "Data and floor rights aren't proprietary tech moats. Anyone with capital can duplicate operations.",
        "delta": -2,
        "interests": {
          "vikram": 70,
          "meera": 76,
          "arjun": 46,
          "zara": 65
        }
      },
      {
        "kind": "question",
        "sharkId": "zara",
        "text": "You claim you want to expand to Pune and Hyderabad with 40 new carts, but what is your exact plan to hire and train reliable cart leads in new cities without breaking quality?",
        "interests": {
          "vikram": 70,
          "meera": 76,
          "arjun": 46,
          "zara": 65
        }
      },
      {
        "kind": "answer",
        "text": "We promote from within: each new city launches with two experienced leads from Bengaluru who train the local team for four weeks on a written checklist covering brewing, hygiene and UPI handling. Cart leads share in the revenue of their cart, which helped us bring attrition down. In Pune and Hyderabad the first five carts open only after the leads sign off the training, and each new cart is reviewed weekly on cups sold and complaints.",
        "interests": {
          "vikram": 70,
          "meera": 76,
          "arjun": 46,
          "zara": 65
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Good focus on training and hygiene checklists. That protects the brand experience.",
        "delta": 5,
        "interests": {
          "vikram": 72,
          "meera": 81,
          "arjun": 46,
          "zara": 73
        }
      },
      {
        "kind": "reaction",
        "sharkId": "zara",
        "text": "Revenue sharing to curb attrition is smart founder thinking. Good operational execution.",
        "delta": 8,
        "interests": {
          "vikram": 72,
          "meera": 81,
          "arjun": 46,
          "zara": 73
        }
      },
      {
        "kind": "question",
        "sharkId": "arjun",
        "text": "You claim exclusive floor rights in tech parks, but what exact legal clause prevents a property manager from terminating your agreement after a twelve-week notice period?",
        "interests": {
          "vikram": 72,
          "meera": 81,
          "arjun": 46,
          "zara": 73
        }
      },
      {
        "kind": "answer",
        "text": "Honestly, the agreements are two years with a renewal option, and a park can exit with notice, so the clause is not ironclad. The real protection is that we are the cheapest and most used option on the floor: 9,000 cups a day and five renewals out of six mean landlords lose employee goodwill if they swap us out. To strengthen it we are moving to three-year terms in the new parks, with a notice period tied to our setup payback.",
        "interests": {
          "vikram": 72,
          "meera": 81,
          "arjun": 46,
          "zara": 73
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Good answer. Employee goodwill is a real barrier.",
        "delta": 5,
        "interests": {
          "vikram": 75,
          "meera": 86,
          "arjun": 34,
          "zara": 68
        }
      },
      {
        "kind": "reaction",
        "sharkId": "arjun",
        "text": "You admitted the clause is not ironclad. That is not a moat.",
        "delta": -12,
        "interests": {
          "vikram": 75,
          "meera": 86,
          "arjun": 34,
          "zara": 68
        }
      },
      {
        "kind": "question",
        "sharkId": "arjun",
        "text": "If your floor-rights agreements can be terminated with notice and lack ironclad legal protection, what stops a well-funded competitor from undercutting you and paying landlords higher common area maintenance fees to evict you?",
        "followUp": true,
        "interests": {
          "vikram": 75,
          "meera": 86,
          "arjun": 34,
          "zara": 68
        }
      },
      {
        "kind": "answer",
        "text": "A rival would have to beat our price and service on every floor at once. At Rs 15 a cup with 58% margin we can cut price by Rs 3 and still earn more than 40% gross, so we can defend on price, and a landlord who evicts us loses a service employees use daily and a subsidy their tenants fund. I'm not claiming a technical moat. Our edge is density of carts, data on peak times, and a payback of 4 months that lets us open ahead of any competitor.",
        "interests": {
          "vikram": 75,
          "meera": 86,
          "arjun": 34,
          "zara": 68
        }
      },
      {
        "kind": "reaction",
        "sharkId": "vikram",
        "text": "Good that you know your gross margins well enough to absorb a price cut to defend territory.",
        "delta": 5,
        "interests": {
          "vikram": 80,
          "meera": 90,
          "arjun": 29,
          "zara": 73
        }
      },
      {
        "kind": "reaction",
        "sharkId": "arjun",
        "text": "You admitted there is no technical moat and agreements are cancellable. That is risky for us.",
        "delta": -5,
        "interests": {
          "vikram": 80,
          "meera": 90,
          "arjun": 29,
          "zara": 73
        }
      },
      {
        "kind": "question",
        "sharkId": "zara",
        "text": "You want Rs 50 lakh to expand to Pune and Hyderabad. Walk me through your exact marketing spend to acquire corporate clients in those new cities.",
        "interests": {
          "vikram": 80,
          "meera": 90,
          "arjun": 29,
          "zara": 73
        }
      },
      {
        "kind": "answer",
        "text": "Almost none, because parks are our customers and we win them through pilots. Of the Rs 50 lakh, roughly Rs 30 lakh opens 25 carts in Pune and Hyderabad, Rs 12 lakh builds the employer dashboard, and Rs 8 lakh is a working-capital buffer. Sales cost is the founders' time and a part-time business developer in each city, and we expect Rs 9 crore annualised revenue by next March.",
        "interests": {
          "vikram": 80,
          "meera": 90,
          "arjun": 29,
          "zara": 73
        }
      },
      {
        "kind": "reaction",
        "sharkId": "vikram",
        "text": "Allocation of Rs 30 lakh for 25 carts checks out against your setup costs. Good unit discipline.",
        "delta": 6,
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": 29,
          "zara": 85
        }
      },
      {
        "kind": "reaction",
        "sharkId": "zara",
        "text": "I love the execution clarity. Low acquisition cost and straight to expansion. That is founder drive.",
        "delta": 12,
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": 29,
          "zara": 85
        }
      },
      {
        "kind": "offer",
        "sharkId": "vikram",
        "text": "Your fully loaded cost of 6.3 rupees and 4-month payback make sense, but at a 5 crore valuation I need some downside protection on the numbers. Offer: Rs 50 lakh for 12%, 1% royalty until investment is returned.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": 29,
          "zara": 85
        }
      },
      {
        "kind": "offer",
        "sharkId": "meera",
        "text": "Five out of six parks renewing proves the demand is real, and I can help you scale that pilot playbook into Pune and Hyderabad seamlessly. Offer: Rs 50 lakh for 13%, Advisory on D2C office expansion and tenant partnerships.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": 29,
          "zara": 85
        }
      },
      {
        "kind": "offer",
        "sharkId": "zara",
        "text": "You have deep conviction and clear operational discipline, so I am matching your exact ask to back your vision for this expansion. Offer: Rs 50 lakh for 10%, Monthly brand and founder alignment meetings.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": 29,
          "zara": 85
        }
      },
      {
        "kind": "walkout",
        "sharkId": "arjun",
        "text": "I'm out. Your floor rights are legally weak and easily terminated, and the dashboard is not a real tech moat against a funded competitor.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": null,
          "zara": 85
        }
      },
      {
        "kind": "answer",
        "text": "I'll take Rs 50 lakh for 11%.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": null,
          "zara": 85
        }
      },
      {
        "kind": "offer",
        "sharkId": "meera",
        "text": "Twelve percent and I personally open doors for you with property managers across Mumbai and Pune. That is my final offer. Final: Rs 50 lakh for 12%.",
        "interests": {
          "vikram": 86,
          "meera": 96,
          "arjun": null,
          "zara": 85
        }
      }
    ],
    "summary": {
      "overall": 78,
      "verdict": "A highly practical, unit-economic-driven business with strong customer pull, but vulnerable to low legal defensibility and competitive copycats.",
      "strengths": [
        "Exceptional unit economics with a 58% gross margin, Rs 30,000 monthly net profit per cart, and a rapid 4-month payback period.",
        "Proven customer demand with 9,000 cups sold daily across 22 carts and a strong 5 out of 6 renewal rate."
      ],
      "weaknesses": [
        "Weak legal defensibility with floor-rights agreements that can be terminated on short notice.",
        "Lack of a technical moat, making the employer dashboard easily replicable by tech-enabled competitors."
      ],
      "fix": "Restructure the tech park contracts to include a revenue-share model with landlords, making eviction financially unappealing to them.",
      "outcome": "Deal: Rs 50 lakh for 12% with Meera"
    }
  },
  {
    "id": "weak",
    "label": "Weak pitch",
    "hint": "MindSpark AI: big claims, no proof",
    "pitch": {
      "ideaName": "MindSpark AI",
      "oneLiner": "AI that makes everyone more productive.",
      "askLakh": 500,
      "equityPct": 2,
      "difficulty": "ruthless"
    },
    "beats": [
      {
        "kind": "question",
        "sharkId": "vikram",
        "text": "You want a Rs 250 crore valuation pre-launch with zero revenue. What is your exact cash burn rate per month, and how many months of runway do you have left?",
        "interests": {
          "vikram": 40,
          "meera": 40,
          "arjun": 40,
          "zara": 40
        }
      },
      {
        "kind": "answer",
        "text": "Everyone needs productivity, so the market is huge. We will figure out pricing later once people love it.",
        "interests": {
          "vikram": 40,
          "meera": 40,
          "arjun": 40,
          "zara": 40
        }
      },
      {
        "kind": "reaction",
        "sharkId": "vikram",
        "text": "You dodged burn rate entirely. Pre-launch with zero revenue and you want Rs 250 crore? Absurd.",
        "delta": -28,
        "interests": {
          "vikram": 12,
          "meera": 32,
          "arjun": 32,
          "zara": 32
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Figure out pricing later? That is not a business model, that is a prayer.",
        "delta": -8,
        "interests": {
          "vikram": 12,
          "meera": 32,
          "arjun": 32,
          "zara": 32
        }
      },
      {
        "kind": "question",
        "sharkId": "vikram",
        "text": "You completely dodged my question. What is your exact monthly cash burn right now, down to the last rupee?",
        "followUp": true,
        "interests": {
          "vikram": 12,
          "meera": 32,
          "arjun": 32,
          "zara": 32
        }
      },
      {
        "kind": "answer",
        "text": "I have not really calculated it, but our AI is unique and better than everything else. I am very confident it will be a billion-dollar company.",
        "interests": {
          "vikram": 12,
          "meera": 32,
          "arjun": 32,
          "zara": 32
        }
      },
      {
        "kind": "walkout",
        "sharkId": "vikram",
        "text": "Zero burn calculated? You are playing with fire. I am out.",
        "delta": -12,
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Billion-dollar company with no numbers? Empty hype.",
        "delta": -8,
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "walkout",
        "sharkId": "arjun",
        "text": "Unique AI means nothing if you do not even know your own burn.",
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "walkout",
        "sharkId": "zara",
        "text": "Confidence does not pay server bills. Get real.",
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "question",
        "sharkId": "meera",
        "text": "You still have not answered. What is your exact monthly burn right now, or are you operating on zero capital?",
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "answer",
        "text": "We are pre-launch, so no customers yet, but I am sure people will want it. The numbers will be big because AI is the future.",
        "interests": {
          "vikram": null,
          "meera": 24,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "You keep talking about the future. Who is actually paying you?",
        "delta": -21,
        "interests": {
          "vikram": null,
          "meera": 3,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "question",
        "sharkId": "meera",
        "text": "You said you are pre-launch with no customers, so give me the exact name of one beta user who tested this today.",
        "followUp": true,
        "interests": {
          "vikram": null,
          "meera": 3,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "answer",
        "text": "Trust me, it will work. We just need the money to get started, and the vision is what matters.",
        "interests": {
          "vikram": null,
          "meera": 3,
          "arjun": null,
          "zara": null
        }
      },
      {
        "kind": "walkout",
        "sharkId": "meera",
        "text": "You still cannot name a single beta user. Trust does not pay my bills, give me a name.",
        "delta": -3,
        "interests": {
          "vikram": null,
          "meera": null,
          "arjun": null,
          "zara": null
        }
      }
    ],
    "summary": {
      "overall": 5,
      "verdict": "You walked in asking for an astronomical valuation pre-launch with zero traction, and then dodged every fundamental question about burn and customers.",
      "strengths": [
        "High confidence in the overarching market trend of AI productivity tools.",
        "Clear recognition of the general problem space regarding workplace efficiency."
      ],
      "weaknesses": [
        "Complete lack of preparation regarding fundamental financial metrics like cash burn.",
        "Evasion of direct questions from multiple sharks, destroying credibility."
      ],
      "fix": "Calculate your exact monthly burn rate, fixed costs, and remaining runway before pitching to anyone.",
      "outcome": "No deal: every shark is out"
    }
  }
];
