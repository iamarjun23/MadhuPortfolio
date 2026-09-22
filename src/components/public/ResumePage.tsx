import type { Resume } from "@/schemas";

export function ResumePage({ data }: Readonly<{ data: Resume }>) {
  const url = data.pdf?.url;

  return (
    <main className="resume-page">
      <section className="process-hero">
        <div className="wrap">
          <span className="slate">{data.eyebrow}</span>
          <h1>{data.heading}</h1>
          {data.intro ? <p>{data.intro}</p> : null}
          {url ? (
            <div className="resume-page__actions">
              <a className="button button--primary" href={url} download target="_blank" rel="noreferrer">
                {data.downloadLabel}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {url ? (
            <iframe className="resume-page__viewer" src={url} title={data.heading} />
          ) : (
            <p className="resume-page__empty">{data.emptyMessage}</p>
          )}
        </div>
      </section>
    </main>
  );
}
