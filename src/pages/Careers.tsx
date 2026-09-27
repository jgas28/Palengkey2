import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { listCareers } from "@/services/api/careers";

const PERKS: [string, string][] = [
  ["🏥", "HMO on Day 1"],
  ["🏠", "Remote Options"],
  ["📈", "Stock Options"],
  ["🍱", "Daily Meal Perks"],
];

export default function Careers() {
  const [selected, setSelected] = useState<number | null>(null);

  const {
    data: careers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["careers"],
    queryFn: listCareers,
  });

  return (
    <div className="-mx-4 -mt-4 bg-[#F7FAFA] pb-8 md:-mx-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#203238] to-[#006D77]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            We&apos;re Hiring
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
            Build the Future of
            <br />
            Filipino Groceries
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/70">
            Join a passionate team bringing fresh market produce to Filipino homes. We move
            fast, care deeply, and love good food.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Perks */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {PERKS.map(([icon, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#DDE9EA] bg-white p-4 text-center"
            >
              <p className="mb-2 text-2xl">{icon}</p>
              <p className="text-sm font-medium text-[#203238]">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-5 font-display text-2xl font-bold text-[#203238]">
          Open Positions
        </h2>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {isError && <ErrorState onRetry={() => void refetch()} />}

        {!isLoading && !isError && careers?.length === 0 && (
          <p className="rounded-2xl border border-[#DDE9EA] bg-white p-6 text-center text-sm text-[#66777C]">
            No open positions right now — check back soon.
          </p>
        )}

        {careers && careers.length > 0 && (
          <div className="space-y-3">
            {careers.map((job) => {
              const isOpen = selected === job.id;
              return (
                <div
                  key={job.id}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-[#DDE9EA] bg-white transition-colors hover:border-[#0097A7]"
                  onClick={() => setSelected(isOpen ? null : job.id)}
                >
                  <div className="flex items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <h3 className="font-semibold text-[#203238]">{job.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {job.job_type && (
                          <span className="text-xs font-medium text-[#0097A7]">
                            {job.job_type}
                          </span>
                        )}
                        {job.job_type && job.location && (
                          <span className="text-[#DDE9EA]">·</span>
                        )}
                        {job.location && (
                          <span className="text-xs text-[#66777C]">{job.location}</span>
                        )}
                        {job.salary_range && (
                          <>
                            <span className="text-[#DDE9EA]">·</span>
                            <span className="text-xs text-[#66777C]">
                              {job.salary_range}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#66777C] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  {isOpen && (
                    <div className="border-t border-[#DDE9EA] px-6 pb-5">
                      {job.description && (
                        <p className="mb-3 mt-3 whitespace-pre-line text-sm leading-relaxed text-[#66777C]">
                          {job.description}
                        </p>
                      )}
                      {job.responsibilities && (
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#203238]">
                            Responsibilities
                          </p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-[#66777C]">
                            {job.responsibilities}
                          </p>
                        </div>
                      )}
                      {job.requirements && (
                        <div className="mb-4">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#203238]">
                            Requirements
                          </p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-[#66777C]">
                            {job.requirements}
                          </p>
                        </div>
                      )}
                      <a
                        href={`mailto:careers@palengkey.ph?subject=Application: ${job.title}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-block rounded-xl bg-[#0097A7] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#006D77]"
                      >
                        Apply for this Role
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-[#66777C]">
          Don&apos;t see a fit?{" "}
          <a
            href="mailto:careers@palengkey.ph"
            className="font-medium text-[#0097A7] hover:underline"
          >
            Send us your CV
          </a>{" "}
          and we&apos;ll keep you in mind.
        </p>

        <div className="mt-6 text-center">
          <Link to="/shop" className="font-semibold text-[#0097A7] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
