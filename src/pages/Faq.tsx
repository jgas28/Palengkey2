import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Mail,
  Facebook,
  type LucideIcon,
} from "lucide-react";
import InfoPageHeader from "@/components/layout/InfoPageHeader";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";

interface FaqEntry {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqEntry[] = [
  {
    category: "Ordering & Delivery",
    question: "How do I place an order?",
    answer:
      "Browse products, add items to your cart, review your basket, then proceed to checkout and confirm your order.",
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
      "Cash on Delivery is available for all orders. Card and QR Ph payment options are shown at checkout based on availability.",
  },
  {
    category: "Ordering & Delivery",
    question: "How can I track my order?",
    answer:
      "Go to My Orders, open the relevant order, then view its status to see live progress and your rider's location.",
  },
  {
    category: "Products & Quality",
    question: "What is the freshness guarantee?",
    answer:
      "If you're not happy with the freshness of your order, report it within 30 minutes of delivery for an instant refund or replacement.",
  },
  {
    category: "Ordering & Delivery",
    question: "Can I cancel or modify an order?",
    answer:
      "Orders can be cancelled before they are accepted by the market. Once processing begins, please contact support through the order details page.",
  },
];

const CATEGORIES = Array.from(new Set(FAQS.map((faq) => faq.category)));

const CONTACT_OPTIONS: { label: string; description: string; Icon: LucideIcon; href: string }[] = [
  {
    label: "Message Support",
    description: "Open a support thread and we'll get back to you.",
    Icon: MessageCircle,
    href: "/support",
  },
  {
    label: "Email Us",
    description: "contact@palengkey.ph",
    Icon: Mail,
    href: "mailto:contact@palengkey.ph",
  },
  {
    label: "Facebook",
    description: "Message us on Facebook.",
    Icon: Facebook,
    href: "https://facebook.com",
  },
];

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-card border border-border bg-surface shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="font-semibold text-text">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="px-5 pb-5 text-sm leading-relaxed text-text-muted">{answer}</p>
      )}
    </div>
  );
}

export default function Faq() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesQuery =
        !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      const matchesCategory = q ? true : !activeCategory || faq.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <InfoPageHeader
        icon={<HelpCircle className="h-6 w-6" aria-hidden="true" />}
        title="Help Center"
        description="Answers to common questions about ordering, payment, and delivery."
      />

      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search the help center…"
      />

      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
              activeCategory === null
                ? "bg-primary-500 text-white"
                : "border border-border bg-surface text-text-muted hover:text-primary"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? "bg-primary-500 text-white"
                  : "border border-border bg-surface text-text-muted hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HelpCircle size={40} aria-hidden="true" />}
          title="No results found"
          description="Try a different search term, or reach out to support below."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((faq) => (
            <FaqAccordionItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Still need help?
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CONTACT_OPTIONS.map(({ label, description, Icon, href }) => {
            const isExternal = href.startsWith("http") || href.startsWith("mailto:");
            const content = (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-text">{label}</p>
                  <p className="text-xs text-text-muted">{description}</p>
                </div>
              </>
            );
            const className =
              "flex flex-col items-start gap-2 rounded-card border border-border bg-surface p-4 shadow-soft transition-all md:hover:-translate-y-0.5 md:hover:shadow-card";

            return isExternal ? (
              <a key={label} href={href} target="_blank" rel="noreferrer" className={className}>
                {content}
              </a>
            ) : (
              <Link key={label} to={href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
