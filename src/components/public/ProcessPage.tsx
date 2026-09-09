import { Photobooth } from "@/components/public/Photobooth";
import type { FallbackImage } from "@/lib/placeholders";
import type { Booth, Process } from "@/schemas";

type ProcessPageProps = Readonly<{
  data: Process;
  booth: Booth;
  fallbackImage?: FallbackImage;
}>;

export function ProcessPage({ data, booth, fallbackImage = null }: ProcessPageProps) {
  const { method, turnaround } = data;

  return (
    <main className="process-page">
      <section className="process-hero">
        <div className="wrap">
          <span className="slate">{data.eyebrow}</span>
          <h1>{data.heading}</h1>
          {data.intro ? <p>{data.intro}</p> : null}
        </div>
      </section>

      {method.steps.length > 0 ? (
        <section className="section process-method" aria-labelledby="process-method-title">
          <div className="wrap">
            <header className="section-heading">
              <span className="slate">{method.eyebrow}</span>
              <h2 id="process-method-title">{method.heading}</h2>
            </header>
            <ol>
              {method.steps.map((step) => (
                <li key={step.id}>
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
      ) : null}

      {turnaround.rows.length > 0 || turnaround.notes.length > 0 ? (
        <section className="section process-turnaround" aria-labelledby="turnaround-title">
          <div className="wrap">
            <header className="section-heading">
              <span className="slate">{turnaround.eyebrow}</span>
              <h2 id="turnaround-title">{turnaround.heading}</h2>
            </header>
            {turnaround.rows.length > 0 ? (
              <dl>
                {turnaround.rows.map((row) => (
                  <div key={row.id}>
                    <dt>{row.format}</dt>
                    <dd>{row.timing}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {turnaround.notes.length > 0 ? (
              <div className="process-turnaround__notes">
                {turnaround.notes.map((note) => (
                  <p key={note.id}>{note.text}</p>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {data.showPhotobooth ? <Photobooth data={booth} fallbackImage={fallbackImage} /> : null}
    </main>
  );
}
