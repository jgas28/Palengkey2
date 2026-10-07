import { useQuery } from "@tanstack/react-query";
import Icon, { type IconName } from "@/components/pk/Icon";
import { getDeliveryAreas } from "@/services/api/content";

const SECTIONS: { id: string; title: string; icon: IconName; text: string }[] = [
  {
    id: "timing",
    title: "Timing and cutoff",
    icon: "clock",
    text: "Each market has a same-day order cutoff. After it, your items are scheduled for the next market run and you pick a delivery slot at checkout. Live progress appears on your order page.",
  },
  {
    id: "fees",
    title: "How delivery fees work",
    icon: "truck",
    text: "Fees are based on the distance from your market to your address. Your exact delivery fee appears at checkout before you confirm — no hidden charges. Bulk orders get up to ₱49 of delivery covered.",
  },
  {
    id: "freshness",
    title: "Our freshness guarantee",
    icon: "leaf",
    text: "If an item arrives damaged or below quality expectations, message Support with a photo within 30 minutes of delivery. Eligible items can be replaced or refunded after review.",
  },
];

/** The design's Delivery information page, with the real served / coming-soon areas. */
export default function DeliveryAreas() {
  const { data, isLoading } = useQuery({ queryKey: ["deliveryAreas"], queryFn: getDeliveryAreas });

  const areasText = isLoading
    ? "Loading delivery areas…"
    : data && data.available.length > 0
      ? `We currently deliver to ${data.available.join(", ")}.${data.coming_soon.length ? ` Coming soon: ${data.coming_soon.join(", ")}.` : ""} Availability depends on your selected market and delivery address.`
      : "Delivery areas depend on your selected market and address — enter your address at checkout to confirm.";

  return (
    <main className="inner-page account-bg">
      <section className="delivery-hero">
        <div className="shell">
          <p className="kicker">Delivery information</p>
          <h1>From the palengke to your doorstep.</h1>
          <p>Everything you need to know about areas, timing, fees, and freshness.</p>
        </div>
      </section>
      <section className="section shell delivery-content">
        <aside>
          <a href="#areas">Delivery areas</a>
          {SECTIONS.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </aside>
        <div>
          <article id="areas">
            <span>
              <Icon name="truck" />
            </span>
            <div>
              <h2>Where we deliver</h2>
              <p>{areasText}</p>
            </div>
          </article>
          {SECTIONS.map((section) => (
            <article id={section.id} key={section.id}>
              <span>
                <Icon name={section.icon} />
              </span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
