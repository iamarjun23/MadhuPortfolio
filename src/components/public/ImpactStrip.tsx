"use client";
import { useEffect, useRef, useState } from "react";
import type { Impact } from "@/schemas";
export function ImpactStrip({ data }: Readonly<{ data: Impact }>) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="impact" ref={ref}>
      <div className="wrap">
        <div className="impact__stats">
          {data.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{visible ? stat.value : "0"}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="impact__worked">
          <span>In the room with</span>
          <div>
            {data.worked.map((person) => (
              <span key={person.name}>
                {person.name}
                <small>{person.context}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
