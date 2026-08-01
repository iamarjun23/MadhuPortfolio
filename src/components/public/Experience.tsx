import type { Experience as ExperienceData } from "@/schemas";
export function Experience({ data }: Readonly<{ data: ExperienceData }>) {
  return (
    <section className="section" id="experience">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">Experience</span>
          <h2>Where I&apos;ve been cutting</h2>
        </header>
        <div className="experience">
          {data.roles.map((role) => (
            <article key={role.id}>
              <span className={`experience__logo ${role.logoHint}`}>
                {role.logo ? <img src={role.logo.url} alt="" /> : role.initials}
              </span>
              <div>
                <small>
                  {role.start} - {role.end}
                  {role.location ? ` - ${role.location}` : ""}
                </small>
                <h3>
                  {role.role} - {role.company}
                </h3>
                <p>{role.description}</p>
              </div>
              <strong>{role.duration}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
