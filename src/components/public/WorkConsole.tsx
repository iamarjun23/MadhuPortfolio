"use client";

import { useEffect, useRef, useState } from "react";
import type { Work } from "@/schemas";

type WorkProject = Work["lanes"][number]["projects"][number];

type PreviewSelection = {
  project: WorkProject;
  laneLabel: string;
};

type CardOffset = {
  x: number;
  y: number;
};

type CloudCardStyle = React.CSSProperties & {
  "--cloud-left": string;
  "--cloud-top": string;
  "--cloud-rotate": string;
  "--card-offset-x": string;
  "--card-offset-y": string;
};

function getCloudPosition(index: number, total: number) {
  const outerCount = Math.min(total, 10);
  const isOuter = index < outerCount;
  const ringIndex = isOuter ? index : index - outerCount;
  const ringCount = isOuter ? outerCount : Math.max(total - outerCount, 1);
  const angle = -Math.PI / 2 + (Math.PI * 2 * ringIndex) / ringCount;
  const radius = isOuter ? 1 : 0.48;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    rotate: Math.sin(angle * 1.7) * 2.2,
  };
}

function playPreview(event: React.MouseEvent<HTMLElement>) {
  const video = event.currentTarget.querySelector("video");
  void video?.play().catch(() => {});
}

function stopPreview(event: React.MouseEvent<HTMLElement>) {
  const video = event.currentTarget.querySelector("video");
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

export function WorkConsole({
  data,
  contactEmail,
}: Readonly<{ data: Work; contactEmail: string }>) {
  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSelection | null>(null);
  const [cardOffsets, setCardOffsets] = useState<Record<string, CardOffset>>({});
  const cardDrag = useRef({
    active: false,
    moved: false,
    id: "",
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const allProjects = data.lanes.flatMap((lane) =>
    lane.projects.map((project) => ({ project, laneLabel: lane.label })),
  );
  const projects = activeLane
    ? allProjects.filter(({ laneLabel }) => laneLabel === activeLane)
    : allProjects;
  function filterProjects(laneLabel: string | null) {
    setActiveLane(laneLabel);
    setPreview(null);
  }

  function cardPointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    const offset = cardOffsets[id] ?? { x: 0, y: 0 };
    cardDrag.current = {
      active: true,
      moved: false,
      id,
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function cardPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!cardDrag.current.active) return;
    const deltaX = event.clientX - cardDrag.current.x;
    const deltaY = event.clientY - cardDrag.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) cardDrag.current.moved = true;

    setCardOffsets((current) => ({
      ...current,
      [cardDrag.current.id]: {
        x: cardDrag.current.offsetX + deltaX,
        y: cardDrag.current.offsetY + deltaY,
      },
    }));
  }

  function cardPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    cardDrag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    if (!preview) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [preview]);

  const brief = `mailto:${contactEmail}?subject=${encodeURIComponent("Brief: Selected work")}`;

  return (
    <section className="work section" id="work">
      <div className="wrap">
        <header className="section-heading">
          <span className="slate">{data.eyebrow}</span>
          <h2>{data.heading}</h2>
          <p className="lede">{data.intro}</p>
        </header>
        <article className="work__panel work__panel--all">
          <div className="work__panel-head">
            <div className="work__panel-meta">
              <span>{activeLane ?? data.allProjectsLabel}</span>
              <span>
                {projects.length} {data.videoCountLabel}
              </span>
            </div>
            <div className="work__filters" role="tablist" aria-label="Filter projects">
              <button
                type="button"
                role="tab"
                aria-selected={activeLane === null}
                onClick={() => filterProjects(null)}
              >
                {data.allFilterLabel}
              </button>
              {data.lanes.map((lane) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLane === lane.label}
                  onClick={() => filterProjects(lane.label)}
                  key={lane.id}
                >
                  {lane.label}
                </button>
              ))}
            </div>
            <a className="work__brief" href={brief}>
              <span>{data.briefPrompt}</span>
              <strong>
                {data.briefCta} <i aria-hidden="true">&nearr;</i>
              </strong>
            </a>
          </div>
          <div className="work__cloud-toolbar">
            <span>{data.canvasHint}</span>
          </div>
          <div className="work__cloud" role="group" aria-label="Floating cloud of video projects">
            <div className="work__cloud-canvas">
              {projects.map(({ project, laneLabel }, index) => {
                const position = getCloudPosition(index, projects.length);
                const cardId = `${laneLabel}-${project.id}`;
                const offset = cardOffsets[cardId] ?? { x: 0, y: 0 };
                const cardStyle: CloudCardStyle = {
                  "--cloud-left": `${50 + position.x * 41}%`,
                  "--cloud-top": `${50 + position.y * 38}%`,
                  "--cloud-rotate": `${position.rotate}deg`,
                  "--card-offset-x": `${offset.x}px`,
                  "--card-offset-y": `${offset.y}px`,
                };

                return (
                  <button
                    className="work__cloud-card"
                    style={cardStyle}
                    type="button"
                    key={cardId}
                    onClick={() => {
                      if (cardDrag.current.moved) {
                        cardDrag.current.moved = false;
                        return;
                      }
                      setPreview({ project, laneLabel });
                    }}
                    onPointerDown={(event) => cardPointerDown(event, cardId)}
                    onPointerMove={cardPointerMove}
                    onPointerUp={cardPointerUp}
                    onPointerCancel={cardPointerUp}
                    onMouseEnter={playPreview}
                    onMouseLeave={stopPreview}
                    aria-label={`Preview ${project.title}`}
                  >
                    <span className={`work__thumb ${project.thumbHint}`}>
                      {project.preview ? (
                        <video muted loop playsInline preload="metadata">
                          <source src={project.preview} type="video/mp4" />
                        </video>
                      ) : null}
                    </span>
                    <span className="work__cloud-card-copy">
                      <small>{laneLabel}</small>
                      <b>{project.title}</b>
                      <em>{project.subtitle}</em>
                    </span>
                  </button>
                );
              })}
            </div>
            {preview ? (
              <>
                <div
                  className="work__preview-scrim"
                  aria-hidden="true"
                  onClick={() => setPreview(null)}
                />
                <div
                  className="work__preview"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${preview.project.title} preview`}
                >
                  <button
                    type="button"
                    className="work__preview-close"
                    onClick={() => setPreview(null)}
                    aria-label="Close video preview"
                  >
                    &times;
                  </button>
                  <div className="work__preview-media">
                    {preview.project.preview ? (
                      <video key={preview.project.id} controls autoPlay muted playsInline>
                        <source src={preview.project.preview} type="video/mp4" />
                      </video>
                    ) : (
                      <span>{data.previewUnavailableLabel}</span>
                    )}
                  </div>
                  <div className="work__preview-copy">
                    <small>{preview.laneLabel}</small>
                    <h3>{preview.project.title}</h3>
                    <p>{preview.project.subtitle}</p>
                    {preview.project.href ? (
                      <a href={preview.project.href} target="_blank" rel="noreferrer">
                        {preview.project.hrefLabel ?? "Watch full video"}{" "}
                        <span aria-hidden="true">&rarr;</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
