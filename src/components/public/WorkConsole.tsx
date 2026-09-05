"use client";

import { useEffect, useRef, useState } from "react";
import { PlaceholderImage } from "@/components/public/PlaceholderImage";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
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
  "--cloud-float-delay": string;
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
    currentX: 0,
    currentY: 0,
    minX: Number.NEGATIVE_INFINITY,
    maxX: Number.POSITIVE_INFINITY,
    minY: Number.NEGATIVE_INFINITY,
    maxY: Number.POSITIVE_INFINITY,
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
    const canvasBounds = event.currentTarget
      .closest(".work__cloud-canvas")
      ?.getBoundingClientRect();
    const cardBounds = event.currentTarget.getBoundingClientRect();
    cardDrag.current = {
      active: true,
      moved: false,
      id,
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      currentX: offset.x,
      currentY: offset.y,
      minX: canvasBounds
        ? offset.x + canvasBounds.left - cardBounds.left
        : Number.NEGATIVE_INFINITY,
      maxX: canvasBounds
        ? offset.x + canvasBounds.right - cardBounds.right
        : Number.POSITIVE_INFINITY,
      minY: canvasBounds ? offset.y + canvasBounds.top - cardBounds.top : Number.NEGATIVE_INFINITY,
      maxY: canvasBounds
        ? offset.y + canvasBounds.bottom - cardBounds.bottom
        : Number.POSITIVE_INFINITY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  // The card is driven straight through its custom properties while the pointer
  // is down; committing to state on every move re-rendered every card in the
  // cloud, each of which carries a video and a blurred backdrop.
  function cardPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = cardDrag.current;
    if (!drag.active) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.moved = true;

    drag.currentX = Math.min(Math.max(drag.offsetX + deltaX, drag.minX), drag.maxX);
    drag.currentY = Math.min(Math.max(drag.offsetY + deltaY, drag.minY), drag.maxY);
    const card = event.currentTarget;
    card.style.setProperty("--card-offset-x", `${drag.currentX}px`);
    card.style.setProperty("--card-offset-y", `${drag.currentY}px`);
  }

  function cardPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = cardDrag.current;
    if (drag.active) {
      const { id, currentX, currentY } = drag;
      setCardOffsets((current) => ({ ...current, [id]: { x: currentX, y: currentY } }));
    }
    drag.active = false;
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
  const previewYouTubeId = getYouTubeId(preview?.project.href ?? null);

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
                {data.briefCta} <i aria-hidden="true">↗</i>
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
                const thumbnail = getYouTubeThumbnail(project.href);
                const cardStyle: CloudCardStyle = {
                  "--cloud-left": `${50 + position.x * 41}%`,
                  "--cloud-top": `${50 + position.y * 38}%`,
                  "--cloud-rotate": `${position.rotate}deg`,
                  "--card-offset-x": `${offset.x}px`,
                  "--card-offset-y": `${offset.y}px`,
                  "--cloud-float-delay": `-${(index * 0.77) % 5.8}s`,
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
                    aria-label={`Preview ${project.title}`}
                  >
                    <span className={`work__thumb ${project.thumbHint}`}>
                      {thumbnail ? (
                        <PlaceholderImage
                          src={thumbnail}
                          alt={`${project.title} on YouTube`}
                          fill
                          sizes="(max-width: 720px) 70vw, 280px"
                        />
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
                    {previewYouTubeId ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${previewYouTubeId}?rel=0`}
                        title={`${preview.project.title} video`}
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
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
