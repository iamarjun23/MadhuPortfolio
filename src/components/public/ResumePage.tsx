import type { Resume } from "@/schemas";

export function ResumePage({ data }: Readonly<{ data: Resume }>) {
  const url = data.pdf?.url;
  /* `download` is ignored on a link to another origin, and the PDF lives on the
     media domain. A Cloudflare Transform Rule adds `Content-Disposition: attachment`
     to responses for this query only (DEPLOYMENT.md), so the viewer below still
     shows the same file inline. */
  const downloadUrl = url ? `${url}${url.includes("?") ? "&" : "?"}download=1` : undefined;

  return (
    <main className="resume-page">
      <section className="process-hero">
        <div className="wrap">
          <span className="slate">{data.eyebrow}</span>
          <h1>{data.heading}</h1>
          {data.intro ? <p>{data.intro}</p> : null}
          {url ? (
            <div className="resume-page__actions">
              <a
                className="button button--primary"
                href={downloadUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
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
