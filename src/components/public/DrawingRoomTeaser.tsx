import Link from "next/link";
export function DrawingRoomTeaser() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="drawing-teaser">
          <span className="slate">Off the clock</span>
          <h2>Step into the Drawing Room</h2>
          <p>
            The work has its place - this is everything else. The reels, the Instagram, and the bike
            rides in between.
          </p>
          <Link className="button button--primary" href="/room">
            Enter the Drawing Room <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
