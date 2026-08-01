import type { About } from "@/schemas";
export function AboutBlock({ data }: Readonly<{ data: About }>) {
  return (
    <section className="section" id="about">
      <div className="wrap about">
        <div className="portrait" role="img" aria-label={data.portrait?.alt ?? "N Madhu Kumar"}>
          {data.portrait ? <img src={data.portrait.url} alt={data.portrait.alt} /> : null}
          <span>NMK</span>
        </div>
        <div>
          <span className="slate">About me</span>
          <h2>{data.heading}</h2>
          {data.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <span className="current-status">
            <i />
            {data.currentStatus}
          </span>
          <div className="tags">
            {data.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
