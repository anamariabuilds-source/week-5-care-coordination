const views = [
  {
    number: "01",
    eyebrow: "Patient boundary",
    title: "Simulated case + consent",
    description:
      "Review the documented next step, the selected simulated facility, minimum scheduling fields, and separate permissions.",
    details: [
      "Provider-documented next step: Colposcopy",
      "Selected facility: Centro Aurora (invented classroom facility)",
      "Scheduling consent and support-person permission will remain separate",
    ],
  },
  {
    number: "02",
    eyebrow: "Human operator boundary",
    title: "Navigator facility-call capture",
    description:
      "A human navigator will complete a fixed Facility Verification Questionnaire using simulated facility-level information.",
    details: [
      "Manual structured entry is the primary path",
      "Optional AI assistance will be bounded to simulated facility-call notes",
      "Human approval will be required before information becomes authoritative",
    ],
  },
  {
    number: "03",
    eyebrow: "Structured signal",
    title: "Facility information",
    description:
      "Timestamped, source-attributed facility-reported information will preserve missing facts and uncertainty.",
    details: [
      "Reported service, availability, charge, prerequisites, and rules",
      "Source and verification timestamp",
      "Stale or uncertain information shown as Not recently verified or Not confirmed",
    ],
  },
  {
    number: "04",
    eyebrow: "State separation",
    title: "Booking status",
    description:
      "The workflow will keep facility information, a navigator request, and facility confirmation visibly distinct.",
    details: [
      "Facility-reported information",
      "Appointment requested",
      "Appointment confirmed only with simulated reservation evidence",
    ],
  },
] as const;

export default function Home() {
  return (
    <main>
      <header className="hero">
        <p className="kicker">Week 5 · Referral-to-appointment coordination</p>
        <h1>A bounded classroom workflow after a provider documents the next step.</h1>
        <p className="hero-copy">
          In this simulated case, an authorized provider already documented <strong>Colposcopy</strong> as the
          next clinical step. This system did not choose, infer, or recommend the procedure.
        </p>
        <div className="scope-note">
          This prototype demonstrates workflow mechanics only. It does not interpret clinical results,
          establish real facility participation, or prove completed care.
        </div>
      </header>

      <section className="views" aria-labelledby="views-heading">
        <div className="section-heading">
          <p className="kicker">Four required views</p>
          <h2 id="views-heading">One small, inspectable slice</h2>
        </div>

        <div className="view-grid">
          {views.map((view) => (
            <article className="view-card" key={view.number}>
              <div className="card-topline">
                <span className="view-number">{view.number}</span>
                <span className="eyebrow">{view.eyebrow}</span>
              </div>
              <h3>{view.title}</h3>
              <p>{view.description}</p>
              <ul>
                {view.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <p>All people, facilities, calls, prices, timestamps, and booking evidence shown here are simulated.</p>
        <p>Appointment confirmed ≠ completed colposcopy.</p>
      </footer>
    </main>
  );
}

