import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/pk/Icon";

export interface PkInfoSection {
  id: string;
  title: string;
  body: ReactNode;
  icon?: IconName;
}

export interface PkInfoPageProps {
  kicker: string;
  title: string;
  description: string;
  sections: PkInfoSection[];
  children?: ReactNode;
}

/** Long-form info pages (privacy, terms) in the design's Delivery-information layout. */
export default function PkInfoPage({ kicker, title, description, sections, children }: PkInfoPageProps) {
  return (
    <main className="inner-page account-bg">
      <section className="delivery-hero">
        <div className="shell">
          <p className="kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
      <section className="section shell delivery-content">
        <aside>
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </aside>
        <div>
          {sections.map((section) => (
            <article id={section.id} key={section.id}>
              <span>
                <Icon name={section.icon ?? "shield"} />
              </span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </article>
          ))}
          {children}
        </div>
      </section>
    </main>
  );
}
