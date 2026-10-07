import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { listCareers } from "@/services/api/careers";

/** The design's Careers page, listing the real open roles from the CMS. */
export default function Careers() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { data: careers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["careers"],
    queryFn: listCareers,
  });

  return (
    <main className="inner-page">
      <section className="page-hero careers-hero">
        <div className="shell simple-page">
          <p className="kicker">Join our team</p>
          <h1>Help us bring the palengke closer.</h1>
          <p>
            We’re building a fresher, fairer way to shop local. Join a team supporting shoppers,
            market vendors, riders, and Filipino families.
          </p>
          <a className="page-cta" href="#open-roles">
            See open roles <Icon name="arrow" />
          </a>
        </div>
      </section>
      <section className="section shell jobs" id="open-roles">
        <div>
          <p className="kicker">Open positions</p>
          <h2>Grow with Palengkey</h2>
        </div>
        <div>
          {isLoading && <p style={{ color: "var(--muted)" }}>Loading open roles…</p>}
          {isError && (
            <button type="button" className="btn primary" onClick={() => void refetch()}>
              Try again
            </button>
          )}
          {!isLoading && !isError && careers.length === 0 && (
            <article>
              <div>
                <h3>No open roles right now</h3>
                <p>Send us your CV anyway — we’ll reach out when something fits.</p>
              </div>
              <a href="mailto:careers@palengkey.ph">
                Email us <Icon name="arrow" />
              </a>
            </article>
          )}
          {careers.map((job) => (
            <div key={job.id}>
              <article style={{ cursor: "pointer" }} onClick={() => setOpenId(openId === job.id ? null : job.id)}>
                <div>
                  <h3>{job.title}</h3>
                  <p>
                    {[job.location, job.job_type, job.salary_range].filter(Boolean).join(" · ") || "Metro Manila"}
                  </p>
                </div>
                <a
                  href={`mailto:careers@palengkey.ph?subject=Application: ${job.title}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  Apply <Icon name="arrow" />
                </a>
              </article>
              {openId === job.id && (
                <div style={{ padding: "4px 0 18px", color: "var(--muted)", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {job.description && <p>{job.description}</p>}
                  {job.responsibilities && (
                    <>
                      <strong style={{ color: "var(--ink)" }}>Responsibilities</strong>
                      <p>{job.responsibilities}</p>
                    </>
                  )}
                  {job.requirements && (
                    <>
                      <strong style={{ color: "var(--ink)" }}>Requirements</strong>
                      <p>{job.requirements}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
