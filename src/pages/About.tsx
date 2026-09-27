import { Link } from "react-router-dom";

const VALUES = [
  {
    icon: "🥬",
    title: "Freshness First",
    desc: "We source produce daily from trusted market vendors to ensure maximum freshness with every order.",
  },
  {
    icon: "🤝",
    title: "Community Roots",
    desc: "Palengkey supports local market vendors and helps them reach more customers across the city.",
  },
  {
    icon: "🚀",
    title: "Fast & Reliable",
    desc: "Our dedicated delivery team ensures your groceries arrive the same day, every day.",
  },
];

export default function About() {
  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-8 md:-mx-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#006D77] to-[#0097A7]">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-80 w-80 translate-x-20 -translate-y-20 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            Our Story
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
            Bringing the Market
            <br />
            to Your Door
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/80">
            Palengkey was born from a simple idea: what if you could shop at the local
            palengke without leaving your home?
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Mission */}
        <div className="mb-8 rounded-3xl border border-[#DDE9EA] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F7] text-2xl">
            🌿
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold text-[#203238]">Our Mission</h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-[#66777C]">
            We connect busy Filipino households with fresh, quality produce from their local
            public markets — sourced daily by our trusted shopping team, and delivered fast.
            No more long trips to the palengke. Just fresh food, conveniently.
          </p>
        </div>

        {/* Values */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-[#DDE9EA] bg-white p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F7F7] text-xl">
                {v.icon}
              </div>
              <h3 className="mb-2 font-semibold text-[#203238]">{v.title}</h3>
              <p className="text-sm leading-relaxed text-[#66777C]">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Team CTA */}
        <div className="mb-8 rounded-3xl bg-[#203238] p-8 text-center text-white">
          <h2 className="mb-3 font-display text-2xl font-bold">Join Our Team</h2>
          <p className="mx-auto mb-5 max-w-md text-white/70">
            We&apos;re a growing team passionate about food, technology, and serving Filipino
            communities. Come build with us.
          </p>
          <Link
            to="/careers"
            className="inline-block rounded-xl bg-[#0097A7] px-6 py-3 font-bold text-white transition-colors hover:bg-[#006D77]"
          >
            View Open Positions
          </Link>
        </div>

        <div className="text-center">
          <Link to="/shop" className="font-semibold text-[#0097A7] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
