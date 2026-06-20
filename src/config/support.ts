export interface SupportTier {
  id: string;
  emoji: string;
  name: string;
  description: string;
  amount?: number;
}

export const SUPPORT_CONFIG = {
  upiId: "prasanth1010000@oksbi",
  payeeName: "Prasanth P",
  tiers: [
    {
      id: "chaya",
      emoji: "☕",
      name: "Chaya Break",
      description: "Helps cover hosting costs.",
      amount: 30,
    },
    {
      id: "porotta",
      emoji: "🍛",
      name: "Porotta Set",
      description: "Keeps bug fixing sessions alive.",
      amount: 60,
    },
    {
      id: "biriyani",
      emoji: "🐔",
      name: "Biriyani",
      description: "Weekend development fuel.",
      amount: 150,
    },
    {
      id: "mandi",
      emoji: "🥘",
      name: "Kuzhi Mandi",
      description: "Supports new feature development.",
      amount: 250,
    },
    {
      id: "sadya",
      emoji: "🍽️",
      name: "Full Sadya",
      description: "Covers domain + infrastructure.",
      amount: 500,
    },
    {
      id: "custom",
      emoji: "❤️",
      name: "Custom Support",
      description: "Choose your own amount.",
      amount: undefined,
    },
  ] as SupportTier[],
};
