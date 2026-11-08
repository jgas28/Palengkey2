import { labelled, sectionId, type PolicyDocument, type PolicySection } from "./types";

// Source: "TERMS AND CONDITIONS.docx" (Last Updated: April 30, 2026). Keep the
// wording as written — it's the approved legal text.

function section(
  title: string,
  icon: PolicySection["icon"],
  blocks: PolicySection["blocks"],
): PolicySection {
  return { id: sectionId(title), title, icon, blocks };
}

const list = (...items: string[]) => ({
  type: "list" as const,
  items: items.map(labelled),
});
const p = (text: string) => ({ type: "p" as const, text });

export const termsOfService: PolicyDocument = {
  language: "English",
  title: "Terms and Conditions",
  lastUpdated: "April 30, 2026",
  intro: [
    'Welcome to Palengkey! These Terms and Conditions ("Terms") govern your use of the Palengkey web application and services. By accessing our platform and placing an order, you agree to be bound by these Terms.',
  ],
  sections: [
    section("1. Nature of Service", "bag", [
      p(
        "Palengkey Digital Market Corp. operates as a logistics and technology partner connecting customers to local public market vendors. We facilitate the ordering, payment, and delivery of goods. Please note that Palengkey does not own the market stalls; we act as the bridge to bring fresh market goods to your doorstep.",
      ),
    ]),
    section("2. Account Registration", "shield", [
      list(
        "Users must provide accurate and complete information (Name, Address, Contact Number) during registration.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "Palengkey reserves the right to suspend or terminate accounts found to be providing false information or engaging in fraudulent activities.",
      ),
    ]),
    section("3. Ordering and Pricing", "cart", [
      list(
        "Minimum Order: A minimum purchase of ₱500 is required to process a delivery.",
        "Pricing: Prices of fresh produce (meat, fish, vegetables) may fluctuate daily based on market rates. The price reflected at the time of your checkout is the final price you will pay.",
        "Availability: Fresh goods are subject to daily market availability. If an item is unavailable, our team will contact you for a replacement or issue a refund for that specific item.",
      ),
    ]),
    section("4. Payments", "cash", [
      list(
        "We accept payments via GCash, Maya, and Cash on Delivery (COD).",
        "For COD orders, customers must ensure that the payment is ready upon the arrival of our rider.",
        "Repeated refusal to accept or pay for COD orders may lead to the permanent deactivation of your account.",
      ),
    ]),
    section("5. Delivery Policy", "truck", [
      list(
        "Schedule: Deliveries are typically conducted between 5:00 AM and 12:00 PM for Wet Goods (Fish, meats, chicken, etc.,) 5:00 AM and 4:00 PM for Dry Goods (farm produce) to ensure the freshness of the goods.",
        "Address: Customers must provide a precise delivery address. If the rider cannot reach the customer after three (3) attempts or a 10-minute waiting period, the order may be cancelled, and a redelivery fee may apply.",
        "Logistics: As your logistics partner, we strive for punctuality, but we are not liable for delays caused by extreme weather, heavy traffic, or unforeseen road conditions.",
      ),
    ]),
    section("6. Returns, Refunds, and Cancellations", "clock", [
      list(
        'Cancellations: Orders can only be cancelled before they reach the "Processing" or "Sourcing" stage. Once our team has begun sourcing items from the market vendors, cancellations are no longer allowed.',
        "Freshness Guarantee: If you receive a damaged or spoiled item, you must report it within two (2) hours of delivery with photographic evidence.",
        "Refunds: Approved refunds will be credited back via your original payment method or as Palengkey app credits within 3-5 business days.",
      ),
    ]),
    section("7. User Conduct", "message", [
      p("Users agree not to:"),
      list(
        "Use the platform for any illegal purposes.",
        "Attempt to bypass the app’s security or extract data (web scraping).",
        "Harass or mistreat our riders and customer support staff.",
      ),
    ]),
    section("8. Limitation of Liability", "leaf", [
      p(
        "Palengkey Digital Market Corp. is responsible for the logistics and delivery of your items. However, the quality and preparation of the goods are the primary responsibility of the Partner Vendors. We will, however, mediate any disputes between the customer and the vendor to ensure a fair resolution.",
      ),
    ]),
    section("9. Amendments", "sparkle", [
      p(
        "We reserve the right to update these Terms at any time. Continued use of the web app after changes are posted constitutes your acceptance of the new Terms.",
      ),
    ]),
    section("10. Governing Law", "star", [
      p(
        "These Terms are governed by and construed in accordance with the laws of the Republic of the Philippines.",
      ),
    ]),
    section("Contact Information", "pin", [
      p("For questions regarding these Terms, please contact us at:"),
      list(
        "Palengkey Digital Market Corp.",
        "Address: Alabang, Muntinlupa City",
        "Email: admin@palengkey.com",
        "Phone: 09098875763",
      ),
    ]),
  ],
};
