import type { Difficulty, SharkId } from "./types";

/**
 * Real sessions recorded from the live app (Gemini panel; strong and weak on 8 Oct 2026, trimmed to the key lines;
 * the Ruthless win on 9 Oct 2026, verbatim, showing the asker's reaction and the most moved other shark, as the tank does).
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
  id: "strong" | "weak" | "ruthless";
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
  },
  {
    "id": "ruthless",
    "label": "Ruthless win",
    "hint": "ChaiCart on the hardest panel: every answer backed by numbers",
    "pitch": {
      "ideaName": "ChaiCart",
      "oneLiner": "Subscription tea carts for office parks, paid per cup through UPI.",
      "askLakh": 50,
      "equityPct": 10,
      "difficulty": "ruthless"
    },
    "beats": [
      {
        "kind": "question",
        "sharkId": "vikram",
        "text": "You claim 58 percent gross margin per cup at Rs 15; what is your fully loaded delivery and staffing cost per cup, and what is your current monthly net burn?",
        "interests": {
          "vikram": 40,
          "meera": 40,
          "arjun": 40,
          "zara": 40
        }
      },
      {
        "kind": "answer",
        "text": "Fully loaded cost is Rs 6.30 a cup: Rs 3.10 for tea, milk, sugar and the cup, Rs 2.20 for the cart lead's salary with PF, and Rs 1.00 for delivery from our central kitchen. That leaves Rs 8.70, the 58 percent. We are not burning: last month we sold 2.34 lakh cups, Rs 35.1 lakh revenue. After the parks' 15 percent revenue share of Rs 5.3 lakh and Rs 11.6 lakh for supervisors, the kitchen lease and head office, we made Rs 3.5 lakh net profit. The Rs 50 lakh is for growth, not survival.",
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
        "text": "Good, the math actually checks out and you are net profitable. Let us see the books.",
        "delta": 15,
        "interests": {
          "vikram": 55,
          "meera": 40,
          "arjun": 40,
          "zara": 40
        }
      },
      {
        "kind": "question",
        "sharkId": "meera",
        "text": "You claim 9000 cups a day across 22 carts, which is over 400 cups per cart. Name the exact tech park where you hit peak volume and how many carts are stationed there.",
        "interests": {
          "vikram": 55,
          "meera": 46,
          "arjun": 40,
          "zara": 46
        }
      },
      {
        "kind": "answer",
        "text": "Manyata Tech Park in Hebbal. We have 7 carts there, one per floor across Blocks D and G, selling about 2,900 cups a day, so roughly 415 a cart. Peak is 3:30 to 5 pm, when 38 percent of the day's cups go. The pantry is the competition and we still win: the pantry machine is free but sits a floor away with a queue, our cart comes to the desk row in under 2 minutes. 62 percent of our weekly payers at Manyata buy at least 4 days out of 5, and that repeat rate is what the park's facility manager, Ramesh Nair, cited when he renewed us in July.",
        "interests": {
          "vikram": 55,
          "meera": 46,
          "arjun": 40,
          "zara": 46
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Naming Manyata, Ramesh Nair, and the 415-cup breakdown is stellar. You actually know your ground.",
        "delta": 15,
        "interests": {
          "vikram": 55,
          "meera": 61,
          "arjun": 40,
          "zara": 46
        }
      },
      {
        "kind": "question",
        "sharkId": "arjun",
        "text": "What stops a well-funded competitor from placing identical carts next to yours in Manyata tomorrow?",
        "interests": {
          "vikram": 60,
          "meera": 61,
          "arjun": 40,
          "zara": 51
        }
      },
      {
        "kind": "answer",
        "text": "Three things. First, the contract: our Manyata agreement gives us exclusive beverage-cart rights on the floors we serve for 24 months, with a 6-month notice period, so a rival cannot park next to us without the landlord breaching it. Second, the employer wallet: at 4 parks the employer subsidy is loaded through our UPI wallet and reconciled into their HR payroll export every month. Ripping that out means redoing finance approvals, and nobody has churned from it. Third, cost: one central kitchen serves 22 carts, so our cost per cup is Rs 6.30. A newcomer with 3 carts pays closer to Rs 9 and loses money at Rs 15. A copier can try, but they start with no floors, no wallet and worse margins.",
        "interests": {
          "vikram": 60,
          "meera": 61,
          "arjun": 40,
          "zara": 51
        }
      },
      {
        "kind": "reaction",
        "sharkId": "arjun",
        "text": "Addressed exclusivity, switching costs, and cost disadvantage of copycats directly.",
        "delta": 10,
        "interests": {
          "vikram": 60,
          "meera": 61,
          "arjun": 50,
          "zara": 51
        }
      },
      {
        "kind": "question",
        "sharkId": "zara",
        "text": "You want Rs 50 lakh to expand to Pune and Hyderabad; who is running those new regions and what is your founder-market background in scaling outside Bengaluru?",
        "interests": {
          "vikram": 65,
          "meera": 65,
          "arjun": 50,
          "zara": 56
        }
      },
      {
        "kind": "answer",
        "text": "I ran city launches for four years at a food delivery company, including Pune, where I took us from zero to 300 restaurant partners in 9 months. My co-founder Priya built our central kitchen and the cart training manual. For the new cities we promote from inside: Suresh, our best Manyata cart lead, has already moved to Pune and signed a letter of intent with one tech park in Hinjewadi for 8 carts starting in January. Hyderabad follows in month 6, only after Pune hits 350 cups a cart, so we never open a city on hope. I will spend the first 90 days in Pune myself.",
        "interests": {
          "vikram": 65,
          "meera": 65,
          "arjun": 50,
          "zara": 56
        }
      },
      {
        "kind": "reaction",
        "sharkId": "zara",
        "text": "Promoting Suresh and moving yourself to Pune shows operational maturity and real grit. I like this execution.",
        "delta": 15,
        "interests": {
          "vikram": 65,
          "meera": 65,
          "arjun": 50,
          "zara": 71
        }
      },
      {
        "kind": "question",
        "sharkId": "arjun",
        "text": "You claim Suresh signed a letter of intent in Hinjewadi; what exact penalty clauses protect you if the park reneges before January?",
        "interests": {
          "vikram": 70,
          "meera": 70,
          "arjun": 50,
          "zara": 71
        }
      },
      {
        "kind": "answer",
        "text": "None, and I would not pretend otherwise: an LOI is not binding. So we structured the risk instead. We spend nothing on Hinjewadi carts until the 24-month exclusive agreement is signed; the LOI converts to that agreement after a 2-week free pilot with 2 carts we move from Bengaluru, so our exposure is about Rs 40,000 in transport and staff. Carts take 3 weeks to build, so we never hold idle inventory. And Hinjewadi is not our only shot: we have a second Pune park, in Kharadi, in pilot talks. If one park walks away we lose two weeks, not the round.",
        "interests": {
          "vikram": 70,
          "meera": 70,
          "arjun": 50,
          "zara": 71
        }
      },
      {
        "kind": "reaction",
        "sharkId": "arjun",
        "text": "Fair admission on the LOI, but your pilot structure limits deployment risk effectively.",
        "delta": 10,
        "interests": {
          "vikram": 70,
          "meera": 70,
          "arjun": 60,
          "zara": 71
        }
      },
      {
        "kind": "question",
        "sharkId": "vikram",
        "text": "You claim each cart pays back its Rs 1.2 lakh setup cost in 4 months; what is the exact depreciation schedule and replacement rate for carts over a 12-month period?",
        "interests": {
          "vikram": 75,
          "meera": 74,
          "arjun": 60,
          "zara": 77
        }
      },
      {
        "kind": "answer",
        "text": "We depreciate each cart straight-line over 36 months, so Rs 3,333 a month, and that is already inside the Rs 30,000 monthly net per cart I quoted. In 14 months of running, we fully replaced 2 of 22 carts after a wheel-base failure, about 9 percent a year, and we spend roughly Rs 1,500 per cart per month on maintenance: urn seals, wheels and the UPI display. The cart body is steel, so the real wear part is the urn, which costs Rs 8,000 to replace. Even with a full replacement every 3 years, a cart earns back its cost about 9 times over its life.",
        "interests": {
          "vikram": 75,
          "meera": 74,
          "arjun": 60,
          "zara": 77
        }
      },
      {
        "kind": "reaction",
        "sharkId": "vikram",
        "text": "Good, straight to the point. Depreciation and maintenance are factored in, real replacement rate is 9 percent.",
        "delta": 15,
        "interests": {
          "vikram": 90,
          "meera": 74,
          "arjun": 60,
          "zara": 77
        }
      },
      {
        "kind": "question",
        "sharkId": "meera",
        "text": "You claim 62 percent of weekly payers at Manyata buy 4 out of 5 days; exactly how many unique corporate employees does that represent out of the total footfall on those floors?",
        "interests": {
          "vikram": 90,
          "meera": 74,
          "arjun": 65,
          "zara": 82
        }
      },
      {
        "kind": "answer",
        "text": "About 1,300 people. The 7 floors we serve at Manyata badge in around 6,000 employees a day, and 2,100 unique UPI IDs paid us last week, so 35 percent of the floor buys from us weekly. 62 percent of those 2,100, about 1,300 employees, bought on 4 or 5 days. They average 1.8 cups on the days they buy, which is roughly 10,500 of our 14,500 cups a week there. So two thirds of our volume comes from 1,300 habitual buyers, and the other 65 percent of the floor, who have never bought, is our headroom without adding a single cart.",
        "interests": {
          "vikram": 90,
          "meera": 74,
          "arjun": 65,
          "zara": 82
        }
      },
      {
        "kind": "reaction",
        "sharkId": "meera",
        "text": "Precise math and employee badge data. You know your floor-level penetration cold. I am impressed.",
        "delta": 15,
        "interests": {
          "vikram": 90,
          "meera": 89,
          "arjun": 65,
          "zara": 82
        }
      },
      {
        "kind": "question",
        "sharkId": "zara",
        "text": "You plan to enter Pune and Hyderabad with Rs 50 lakh; exactly how much of that capital is allocated to inventory versus hiring, and how long does it last if both cities miss their month-6 targets?",
        "interests": {
          "vikram": 96,
          "meera": 89,
          "arjun": 65,
          "zara": 88
        }
      },
      {
        "kind": "answer",
        "text": "Rs 30 lakh goes to 25 carts, Rs 8 lakh to the Pune kitchen and opening stock, Rs 7 lakh to hiring and paying 2 city leads and 30 cart staff through 6 weeks of training, and Rs 5 lakh to the employer dashboard. The other 15 carts come from our own profits. If both cities miss month 6, the new cities cost us Rs 4 lakh a month in fixed overhead, and Bengaluru makes Rs 3.5 lakh, so the round still lasts more than 2 years. But we would not wait that long: the carts are on wheels. If Pune misses, we roll them into the 3 Bengaluru parks that have a waitlist, where each one earns Rs 30,000 a month from day one. The downside is a slower plan, not a dead company.",
        "interests": {
          "vikram": 96,
          "meera": 89,
          "arjun": 65,
          "zara": 88
        }
      },
      {
        "kind": "reaction",
        "sharkId": "zara",
        "text": "Fantastic clarity on resource deployment and downside management. I am completely in.",
        "delta": 12,
        "interests": {
          "vikram": 96,
          "meera": 89,
          "arjun": 65,
          "zara": 100
        }
      },
      {
        "kind": "offer",
        "sharkId": "vikram",
        "text": "The unit economics hold up, and making Rs 3.5 lakh net profit on Rs 35 lakh revenue shows discipline, so I am in at your Rs 5 crore valuation. Rs 50 lakh for 10%. Plus 2 percent royalty until Rs 1.5 crore is returned.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "offer",
        "sharkId": "meera",
        "text": "Your repeat rate and deep penetration at Manyata prove the customer demand is real, so I want in. Rs 50 lakh for 12%.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "offer",
        "sharkId": "arjun",
        "text": "You have managed the supply chain and cart replacement rates well, but hardware in office parks has execution risks. Rs 50 lakh for 14%. Tied to completing the employer dashboard and scaling Pune successfully.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "offer",
        "sharkId": "zara",
        "text": "Your city launch background from food delivery gives me total conviction in your founder-market fit. Rs 50 lakh for 10%. With an advisor seat.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "answer",
        "text": "Meera, I'll take Rs 50 lakh for 10%.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "offer",
        "sharkId": "meera",
        "text": "Eleven percent and my retail distribution network helps you scale Pune and Hyderabad instantly. Take it or I walk. Rs 50 lakh for 11%.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      },
      {
        "kind": "answer",
        "text": "Zara, you matched my ask: Rs 50 lakh for 10% with you as an advisor. Deal.",
        "interests": {
          "vikram": 100,
          "meera": 95,
          "arjun": 70,
          "zara": 100
        }
      }
    ],
    "summary": {
      "overall": 92,
      "verdict": "An exceptional pitch backed by bulletproof unit economics, clear moats, and a battle-tested founder who thoroughly dismantled every skeptical attack.",
      "strengths": [
        "Impeccable unit economics with transparent fully loaded cost breakdowns, positive net profit, and proven 4-month cart payback periods.",
        "Unshakable founder-market fit demonstrated through direct execution experience in city launches and rigorous risk-managed expansion plans."
      ],
      "weaknesses": [
        "Reliance on non-binding letters of intent for early-stage regional expansion into Pune.",
        "Low gross margin cushion if raw material inflation hits milk, tea, and sugar simultaneously."
      ],
      "fix": "Convert current letters of intent for Pune into binding lease or exclusivity addendums prior to capital deployment.",
      "outcome": "Deal: Rs 50 lakh for 10% with Zara"
    }
  }
];
