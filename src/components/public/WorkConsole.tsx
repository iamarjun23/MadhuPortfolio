"use client";
import { useState } from "react";
import type { Work } from "@/schemas";
export function WorkConsole({
  data,
  contactEmail,
}: Readonly<{ data: Work; contactEmail: string }>) {
  const [active, setActive] = useState(0);
  const lane = data.lanes[active] ?? data.lanes[0];
  if (!lane) return null;
  function activate(index: number) {
    setActive(index);
  }
  function keydown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = data.lanes.length;
    if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key))
      event.preventDefault();
    if (event.key === "Home") activate(0);
    else if (event.key === "End") activate(count - 1);
    else if (event.key === "ArrowDown" || event.key === "ArrowRight") activate((index + 1) % count);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      activate((index - 1 + count) % count);
  }
  const brief = `mailto:${contactEmail}?subject=${encodeURIComponent(`Brief: ${lane.briefLabel}`)}`;
  return (
    <section className="work section" id="work">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">Selected work</span>
          <h2>
            What are you <em>making?</em>
          </h2>
          <p className="lede">
            Pick a lane - the screen loads that craft and the real cuts behind it.
          </p>
        </header>
        <div className="work__deck">
          <div className="work__rail" role="tablist" aria-label="Choose a category">
            {data.lanes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-controls={`panel-${item.id}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => activate(index)}
                onKeyDown={(event) => keydown(event, index)}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>
                  {item.label}
                  <small>{item.subLabel}</small>
                </span>
              </button>
            ))}
          </div>
          <article
            className={`work__panel work__panel--${lane.projects[0]?.thumbHint ?? "bd-1"}`}
            id={`panel-${lane.id}`}
            role="tabpanel"
          >
            <div className="work__panel-meta">
              <span>Now showing - {lane.label}</span>
              <span>{lane.loadTc}</span>
            </div>
            <h3>{lane.headline}</h3>
            <p>{lane.approach}</p>
            <div className="work__projects">
              {lane.projects.map((project) =>
                project.href ? (
                  <a key={project.id} href={project.href} target="_blank" rel="noreferrer">
                    <span className={`work__thumb ${project.thumbHint}`} />
                    <b>{project.title}</b>
                    <small>{project.subtitle}</small>
                    <em>{project.hrefLabel}</em>
                  </a>
                ) : (
                  <div key={project.id}>
                    <span className={`work__thumb ${project.thumbHint}`} />
                    <b>{project.title}</b>
                    <small>{project.subtitle}</small>
                  </div>
                ),
              )}
            </div>
            <footer>
              <div>
                {lane.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              <a href={brief}>
                Brief me for this <span aria-hidden="true">&rarr;</span>
              </a>
            </footer>
          </article>
        </div>
      </div>
    </section>
  );
}
