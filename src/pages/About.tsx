import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { photos } from "@/components/pk/photos";

const VALUES = [
  ["Freshness first", "Every order is handpicked from trusted market stalls."],
  ["Fair for vendors", "We help local sellers reach more Filipino households."],
  [
    "Made for real life",
    "From detailed cuts to Paluto, shopping works the way the palengke does.",
  ],
];

/** The design's About page. */
export default function About() {
  const navigate = useNavigate();

  return (
    <main className="inner-page">
      <section className="about-hero">
        <div className="shell about-grid">
          <div>
            <p className="kicker">Our story</p>
            <h1>Fresh from the market. Built for Filipino families.</h1>
            <p>
              Palengkey connects neighborhood markets, trusted vendors, personal shoppers,
              and riders in one thoughtful experience.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/shop")}
            >
              Shop the palengke <Icon name="arrow" />
            </button>
          </div>
          <img
            src={photos.palengke}
            alt="Local market shopper receiving fresh vegetables"
          />
        </div>
      </section>
      <section className="section shell values">
        <div>
          <p className="kicker">Why Palengkey</p>
          <h2>Keeping local markets at the heart of everyday life.</h2>
        </div>
        <div>
          {VALUES.map(([title, text], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
