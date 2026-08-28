import { Photobooth } from "@/components/public/Photobooth";
import type { Booth } from "@/schemas";

const steps = [
  {
    number: "01",
    title: "Organise",
    description:
      "Files named, bins built, script read twice. Nothing hits the timeline until I know where everything lives.",
  },
  {
    number: "02",
    title: "Assemble",
    description:
      "A rough pass for structure - where the story turns, where it drags, what can go. Structure before polish, always.",
  },
  {
    number: "03",
    title: "Cut",
    description:
      "Dialogue-led, cut on meaning rather than beat. Sound design in the same pass, not bolted on after.",
  },
  {
    number: "04",
    title: "Feedback",
    description:
      "Send it, take the notes, cut again. This is the part most editors resist and the part that makes the video good.",
  },
  {
    number: "05",
    title: "Deliver",
    description: "Every format the campaign needs, named properly, on time.",
  },
] as const;

const turnaround = [
  { format: "Short-form reel", timing: "1 day" },
  { format: "Long-form / explainer", timing: "2-3 days" },
  { format: "Podcast episode", timing: "4-5 days" },
  { format: "Campaign", timing: "~1 month, script to live ads" },
] as const;

export function ProcessPage({ booth }: Readonly<{ booth: Booth }>) {
  return (
    <main className="process-page">
      <section className="process-hero">
        <div className="wrap">
          <span className="slate">Studio</span>
          <h1>The work behind the cut.</h1>
          <p>
            A clear process, realistic turnaround, and a few frames from the rooms where the work
            happened.
          </p>
        </div>
      </section>

      <section className="section process-method" aria-labelledby="process-method-title">
        <div className="wrap">
          <header className="section-heading">
            <span className="slate">How I work</span>
            <h2 id="process-method-title">Five passes. One better film.</h2>
          </header>
          <ol>
            {steps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section process-turnaround" aria-labelledby="turnaround-title">
        <div className="wrap">
          <header className="section-heading">
            <span className="slate">Turnaround</span>
            <h2 id="turnaround-title">Know the rhythm before we start.</h2>
          </header>
          <dl>
            {turnaround.map((item) => (
              <div key={item.format}>
                <dt>{item.format}</dt>
                <dd>{item.timing}</dd>
              </div>
            ))}
          </dl>
          <div className="process-turnaround__notes">
            <p>Podcasts run longer because they&apos;re multicam and cut to reference.</p>
            <p>Freelance work starts within a week of the brief. Rates depend on scope - ask.</p>
          </div>
        </div>
      </section>

      <Photobooth data={booth} />
    </main>
  );
}
