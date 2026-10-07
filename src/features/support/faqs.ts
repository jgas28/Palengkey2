export interface FaqEntry {
  question: string;
  answer: string;
  category: string;
}

/** Shared by the Help & Support page and the full FAQ page. */
export const FAQS: FaqEntry[] = [
  {
    category: "Ordering & Delivery",
    question: "How do I place an order?",
    answer:
      "Browse products, add items to your basket, review it, then proceed to checkout and confirm your order.",
  },
  {
    category: "Ordering & Delivery",
    question: "Can I choose item portions and sizes?",
    answer:
      "Yes. You can select weight portions (e.g. 125g, 250g, 500g, 1kg), quantity, and add a special preparation note for each item.",
  },
  {
    category: "Payments",
    question: "What payment methods are supported?",
    answer:
      "Cash on Delivery, QR Ph, GCash, Maya, Visa / Mastercard, BPI and UnionBank online banking. Online payments are processed securely by PayMongo.",
  },
  {
    category: "Ordering & Delivery",
    question: "Where is my order?",
    answer:
      "Go to My Orders and open the order to see its live progress and, once it's out for delivery, your rider.",
  },
  {
    category: "Products & Quality",
    question: "What is the freshness guarantee?",
    answer:
      "If you're not happy with the freshness of your order, report it within 30 minutes of delivery for a refund or replacement.",
  },
  {
    category: "Ordering & Delivery",
    question: "Can I change or cancel an order?",
    answer:
      "Orders can be cancelled before they are accepted by the market. Once processing begins, please message support from the order page.",
  },
  {
    category: "Paluto",
    question: "How does Paluto pricing work?",
    answer:
      "Each stall has its own menu. You pay for the ingredients the stall needs, at today's market prices, plus the stall's cooking fee.",
  },
  {
    category: "Ordering & Delivery",
    question: "What's the bulk order deal?",
    answer:
      "Buy one item in bulk (e.g. 6kg+ of meat or seafood, 10kg+ of vegetables or fruit) and it's priced at wholesale, plus up to ₱49 of delivery is covered automatically.",
  },
];
