export interface SupportTier {
  id: string;
  emoji: string;
  name: string;
  description: string;
  amount?: number;
  cashfreeLink: string;
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
      cashfreeLink: "https://payments.cashfree.com/forms/chayabreak",
    },
    {
      id: "kanji",
      emoji: "🍚",
      name: "Kanji & Payar",
      description: "Keeps bug fixing sessions alive.",
      amount: 60,
      cashfreeLink: "https://payments.cashfree.com/forms/kanji",
    },
    {
      id: "biriyani",
      emoji: "🐔",
      name: "Biriyani",
      description: "Weekend development fuel.",
      amount: 150,
      cashfreeLink: "https://payments.cashfree.com/forms/fullbiriyani",
    },
    {
      id: "mandi",
      emoji: "🥘",
      name: "Kuzhi Mandi",
      description: "Supports new feature development.",
      amount: 250,
      cashfreeLink: "https://payments.cashfree.com/forms/mandi",
    },
    {
      id: "sadya",
      emoji: "🍽️",
      name: "Full Sadya",
      description: "Covers domain + infrastructure.",
      amount: 500,
      cashfreeLink: "https://payments.cashfree.com/forms/sadhya",
    },
    {
      id: "custom",
      emoji: "❤️",
      name: "Custom Support",
      description: "Choose your own amount.",
      amount: undefined,
      cashfreeLink: "https://payments.cashfree.com/forms/treat",
    },
  ] as SupportTier[],
};
