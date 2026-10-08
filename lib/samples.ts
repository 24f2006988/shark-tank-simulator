import type { PitchInput } from "./types";

export interface SamplePitch {
  label: string;
  hint: string;
  pitch: PitchInput;
}

/** One well-prepared pitch and one deliberately vague one, so judges can see the panel push back. */
export const SAMPLE_PITCHES: SamplePitch[] = [
  {
    label: "Strong pitch",
    hint: "Real numbers and traction",
    pitch: {
      ideaName: "ChaiCart",
      oneLiner: "Subscription tea carts for office parks, paid per cup through UPI.",
      askLakh: 50,
      equityPct: 10,
      difficulty: "realistic",
      description:
        "ChaiCart puts a staffed tea cart on every floor of large office parks. Employees pay Rs 15 a cup by UPI; employers can top up a monthly subsidy. We run 22 carts across 6 tech parks in Bengaluru and sell 9,000 cups a day. Gross margin per cup is 58%, each cart pays back its Rs 1.2 lakh setup cost in 4 months, and 5 of our 6 parks renewed this year. We want Rs 50 lakh to open 40 more carts in Pune and Hyderabad and build the employer dashboard.",
    },
  },
  {
    label: "Vague pitch",
    hint: "Big claims, no proof",
    pitch: {
      ideaName: "MindSpark AI",
      oneLiner: "AI that makes everyone more productive.",
      askLakh: 500,
      equityPct: 2,
      difficulty: "ruthless",
      description:
        "MindSpark is an AI-powered platform that revolutionises productivity for everyone. It uses cutting-edge machine learning to help people do more in less time. The market is huge and growing fast, and there is no real competition because our technology is unique. We are pre-launch but very confident this will be a billion-dollar company.",
    },
  },
];
