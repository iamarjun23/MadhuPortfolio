import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, Status } from "../src/generated/prisma";
import { sectionKeys, type SectionKey } from "../src/lib/sections";
import { placeholderImageUrl } from "../src/lib/placeholders";
import {
  AboutSchema,
  BoothSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "../src/schemas";

export const sectionData = {
  hero: HeroSchema.parse({
    eyebrow: "Video Editor · Driven by emotion & storytelling · Bengaluru",
    line1: "Every frame",
    line2: "holds",
    cutWords: ["a feeling", "a rhythm", "a story", "a heartbeat", "a moment", "a cut"],
    sub: "Editing, for me, is the art of slowing time and amplifying emotion — taking fleeting moments and turning them into stories that breathe, move, and stay with you.",
    primaryCta: { label: "See the work", href: "#work" },
    secondaryCta: { label: "Enter the Drawing Room", href: "/room" },
    bgVideo: {
      url: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/3129957/pexels-photo-3129957.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
      duotone: true,
    },
  }),
  about: AboutSchema.parse({
    portrait: {
      url: placeholderImageUrl("Portrait", 1200, 1600),
      alt: "Madhu behind the lens",
    },
    heading: "The edit is invisible. You feel the pace.",
    paragraphs: [
      "I'm Madhu, a video editor driven by emotion and storytelling. Every cut I make is intentional; every frame is chosen to hold a feeling. I take fleeting moments and turn them into stories that breathe, move, and stay with you.",
      "I work across Jar, The 1% Club, AI Accountant and the Untouchable documentary — podcasts, campaigns, events and explainers — moving between the timeline and the camera. Whatever the format, the thread is the same: story first.",
    ],
    currentStatus: "Currently — Video Editor at Jar",
    skills: ["After Effects", "Premiere Pro", "Podcasting", "Media production", "Colour", "Camera"],
  }),
  impact: ImpactSchema.parse({
    stats: [
      { value: "2+", label: "Years editing" },
      { value: "4", label: "Brands & clients" },
      { value: "6", label: "Content formats" },
      { value: "10+", label: "Names in the room" },
    ],
    worked: [
      {
        name: "Dulquer Salmaan",
        context: "Jar ad",
        image: { url: placeholderImageUrl("Dulquer Salmaan"), alt: "Dulquer Salmaan" },
      },
      {
        name: "Ramesh Arvind",
        context: "Jar ad",
        image: { url: placeholderImageUrl("Ramesh Arvind"), alt: "Ramesh Arvind" },
      },
      {
        name: "Danish Sait",
        context: "JarXchange",
        image: { url: placeholderImageUrl("Danish Sait"), alt: "Danish Sait" },
      },
      {
        name: "Ankur Warikoo",
        context: "JarXchange",
        image: { url: placeholderImageUrl("Ankur Warikoo"), alt: "Ankur Warikoo" },
      },
      {
        name: "Sharan Hegde",
        context: "Finance with Sharan",
        image: { url: placeholderImageUrl("Sharan Hegde"), alt: "Sharan Hegde" },
      },
      {
        name: "Manjeet Sarkar",
        context: "Untouchable",
        image: { url: placeholderImageUrl("Manjeet Sarkar"), alt: "Manjeet Sarkar" },
      },
      {
        name: "Deepak Shenoy",
        context: "Capitalmind",
        image: { url: placeholderImageUrl("Deepak Shenoy"), alt: "Deepak Shenoy" },
      },
      {
        name: "Neil Borate",
        context: "podcast",
        image: { url: placeholderImageUrl("Neil Borate"), alt: "Neil Borate" },
      },
      {
        name: "Ravi Handa",
        context: "FIRE",
        image: { url: placeholderImageUrl("Ravi Handa"), alt: "Ravi Handa" },
      },
      { name: "Mahanati", context: "TV", image: { url: placeholderImageUrl("Mahanati"), alt: "Mahanati" } },
      {
        name: "Bigg Boss Kannada",
        context: "TV",
        image: { url: placeholderImageUrl("Bigg Boss Kannada"), alt: "Bigg Boss Kannada" },
      },
      {
        name: "Sa Re Ga Ma Pa",
        context: "TV",
        image: { url: placeholderImageUrl("Sa Re Ga Ma Pa"), alt: "Sa Re Ga Ma Pa" },
      },
    ],
  }),
  work: WorkSchema.parse({
    lanes: [
      {
        id: "podcasts",
        label: "Podcasts",
        subLabel: "JarXchange",
        headline: "JarXchange — conversations that actually hold.",
        approach:
          "Long-form episodes and the clips that travel from them — pre to post, with a feel for where a conversation breathes.",
        chips: ["Pre & post", "Clips", "On-camera"],
        loadTc: "LOAD 00:46:11:00",
        briefLabel: "Podcast",
        projects: [
          {
            id: "danish-sait",
            title: "Danish Sait — Mr. Nags origin",
            subtitle: "JarXchange",
            href: "https://youtu.be/PxoYGdcjmt8",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
          },
          {
            id: "ankur-warikoo",
            title: "Ankur Warikoo — Unfiltered",
            subtitle: "JarXchange",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
          },
          {
            id: "kunal-khattar",
            title: "Kunal Khattar — Bike taxi ban",
            subtitle: "JarXchange",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/4990247/4990247-hd_1920_1080_30fps.mp4",
          },
          {
            id: "deepak-shenoy",
            title: "Deepak Shenoy — Trump, India & Taxes",
            subtitle: "Capitalmind",
            href: "https://youtu.be/PxoYGdcjmt8",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
          },
          {
            id: "ravi-handa",
            title: "Ravi Handa — Retire Early / FIRE",
            subtitle: "JarXchange",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
          },
          {
            id: "neil-borate",
            title: "Neil Borate — Financial news",
            subtitle: "JarXchange",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
            preview: "https://videos.pexels.com/video-files/4990247/4990247-hd_1920_1080_30fps.mp4",
          },
        ],
      },
      {
        id: "campaigns-tv-ads",
        label: "Campaigns & TV Ads",
        subLabel: "Dulquer · Ramesh",
        headline: "Star-led films, cut to convert.",
        approach:
          "National campaigns for Jar featuring big names — built for TV and Meta, paced to land the message in seconds.",
        chips: ["TV + Meta", "Star talent", "Brand"],
        loadTc: "LOAD 00:00:30:00",
        briefLabel: "Campaign / TV ad",
        projects: [
          {
            id: "dulquer-salmaan",
            title: "Never Underestimate ₹100",
            subtitle: "ft. Dulquer Salmaan",
            href: "https://youtu.be/PxoYGdcjmt8",
            hrefLabel: "YouTube",
            thumbHint: "bd-2",
            preview: "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
          },
          {
            id: "ramesh-arvind",
            title: "Start Saving on #JarApp",
            subtitle: "ft. Ramesh Arvind",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-2",
            preview: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
          },
        ],
      },
      {
        id: "events",
        label: "Events",
        subLabel: "JarXchange · Auto",
        headline: "Live energy, edited to relive it.",
        approach:
          "Event films that capture the room — recap edits with momentum, made to be reshared.",
        chips: ["Recap", "Momentum", "Social"],
        loadTc: "LOAD 00:03:00:00",
        briefLabel: "Event film",
        projects: [
          {
            id: "all-india-permit",
            title: "JarXchange — All India Permit",
            subtitle: "Event · Edition 1",
            href: "https://www.linkedin.com/posts/jarapp_jarxchange-all-india-permit-edition-1-activity-7388540343006445569-ISxs",
            hrefLabel: "LinkedIn",
            thumbHint: "bd-3",
            preview: "https://videos.pexels.com/video-files/4990247/4990247-hd_1920_1080_30fps.mp4",
          },
          {
            id: "kannada-rajyotsava",
            title: "Jar Auto — Kannada Rajyotsava 2025",
            subtitle: "Event",
            href: "https://www.linkedin.com/posts/jarapp_kannada-rajyotsava-2025-x-jar-activity-7402319420766928896-YQV4",
            hrefLabel: "LinkedIn",
            thumbHint: "bd-3",
            preview: "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
          },
        ],
      },
      {
        id: "informative-documentary",
        label: "Informative / Docu",
        subLabel: "Explainers",
        headline: "Explainers that keep their momentum.",
        approach:
          "Documentary-style informative videos — in English and Kannada — structured so an idea carries the whole way through.",
        chips: ["Structure", "English + Kannada", "Clarity"],
        loadTc: "LOAD 00:09:00:00",
        briefLabel: "Informative / documentary",
        projects: [
          {
            id: "bengaluru-water-crisis",
            title: "Bengaluru Water Crisis",
            subtitle: "Kannada · Docu-style",
            href: "https://youtu.be/PxoYGdcjmt8",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
            preview: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
          },
          {
            id: "rule-for-2025",
            title: "Rule for 2025",
            subtitle: "Kannada · Informative",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
            preview: "https://videos.pexels.com/video-files/4990247/4990247-hd_1920_1080_30fps.mp4",
          },
          {
            id: "second-airport",
            title: "Second Airport — Where?",
            subtitle: "Kannada · Explainer",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
            preview: "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4",
          },
          {
            id: "ktm-bankrupt",
            title: "Is KTM going bankrupt?",
            subtitle: "Jar · Explainer",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
            preview: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
          },
        ],
      },
    ],
  }),
  booth: BoothSchema.parse({
    slots: [
      {
        id: "dulquer-salmaan",
        image: {
          url: placeholderImageUrl("Dulquer Salmaan"),
          alt: "Dulquer Salmaan",
        },
        title: "Dulquer Salmaan",
        subtitle: "Jar · Never Underestimate ₹100",
        lightboxCaption: "On set — Jar campaign · with Dulquer Salmaan",
        hasTape: true,
        tile: "a",
      },
      {
        id: "danish-sait",
        image: {
          url: placeholderImageUrl("Danish Sait"),
          alt: "Danish Sait",
        },
        title: "Danish Sait",
        subtitle: "JarXchange podcast",
        lightboxCaption: "JarXchange — with Danish Sait",
        hasTape: false,
        tile: "b",
      },
      {
        id: "ankur-warikoo",
        image: {
          url: placeholderImageUrl("Ankur Warikoo"),
          alt: "Ankur Warikoo",
        },
        title: "Ankur Warikoo",
        subtitle: "JarXchange",
        lightboxCaption: "JarXchange — with Ankur Warikoo",
        hasTape: true,
        tile: "c",
      },
      {
        id: "ramesh-arvind",
        image: {
          url: placeholderImageUrl("Ramesh Arvind"),
          alt: "Ramesh Arvind",
        },
        title: "Ramesh Arvind",
        subtitle: "Jar · Start Saving",
        lightboxCaption: "On set — with Ramesh Arvind",
        hasTape: false,
        tile: "d",
      },
      {
        id: "sharan-hegde",
        image: {
          url: placeholderImageUrl("Sharan Hegde"),
          alt: "Sharan Hegde",
        },
        title: "Sharan Hegde",
        subtitle: "Finance with Sharan",
        lightboxCaption: "With Sharan Hegde — Finance with Sharan",
        hasTape: true,
        tile: "e",
      },
      {
        id: "manjeet-sarkar",
        image: {
          url: placeholderImageUrl("Manjeet Sarkar"),
          alt: "Manjeet Sarkar",
        },
        title: "Manjeet Sarkar",
        subtitle: "Untouchable",
        lightboxCaption: "Untouchable — with Manjeet Sarkar",
        hasTape: false,
        tile: "f",
      },
      {
        id: "one-percent-club",
        image: {
          url: placeholderImageUrl("The 1% Club"),
          alt: "The 1% Club",
        },
        title: "The 1% Club",
        subtitle: "Mumbai",
        lightboxCaption: "The 1% Club — Mumbai team",
        hasTape: false,
        tile: "g",
      },
      {
        id: "jarxchange-event",
        image: {
          url: placeholderImageUrl("JarXchange Event"),
          alt: "JarXchange Event",
        },
        title: "JarXchange Event",
        subtitle: "All India Permit",
        lightboxCaption: "JarXchange — All India Permit event",
        hasTape: true,
        tile: "h",
      },
    ],
  }),
  praise: PraiseSchema.parse({
    quotes: [
      {
        id: "sample-client",
        quote:
          "Madhu finds the emotion in the footage the rest of us missed. Every cut came back tighter and more watchable than the brief.",
        name: "[Client name]",
        role: "Brand Marketing Lead",
        initials: "AM",
        isSample: true,
      },
      {
        id: "sample-producer",
        quote:
          "Calm under deadline and obsessive about pace. Our reels started performing the week he took over the edit.",
        name: "[Producer name]",
        role: "Content Producer",
        initials: "PN",
        isSample: true,
      },
      {
        id: "sample-director",
        quote:
          "On the documentary he treated the footage like it mattered — because it did. A real collaborator in the edit room.",
        name: "[Director name]",
        role: "Documentary Director",
        initials: "RD",
        isSample: true,
      },
    ],
  }),
  experience: ExperienceSchema.parse({
    roles: [
      {
        id: "jar-editor",
        company: "Jar",
        role: "Video Editor",
        logo: { url: placeholderImageUrl("Jar", 512, 512) },
        logoHint: "l-jar",
        initials: "jar",
        start: "Mar 2025",
        end: "Present",
        duration: "1 yr 4 mo",
        description:
          "Campaign films with Dulquer Salmaan & Ramesh Arvind; JarXchange podcasts; events; documentary-style explainers in English & Kannada.",
      },
      {
        id: "jar-intern",
        company: "Jar",
        role: "Video Editor Intern",
        logo: { url: placeholderImageUrl("Jar", 512, 512) },
        logoHint: "l-jar",
        initials: "jar",
        start: "Sep 2024",
        end: "Mar 2025",
        duration: "7 mo",
        description:
          "Long-form podcasts and short-form reels for JarXchange, documentary-style videos, and camera on podcast shoots.",
      },
      {
        id: "one-percent-club",
        company: "The 1% Club",
        role: "Video Editor Intern",
        logo: { url: placeholderImageUrl("The 1% Club", 512, 512) },
        logoHint: "l-onep",
        initials: "1%",
        start: "Apr 2024",
        end: "Jun 2024",
        duration: "3 mo",
        location: "Mumbai",
        description:
          "Content strategy with the editorial team; 10+ projects coordinated; 10–15 reels per cycle for Instagram and YouTube.",
      },
      {
        id: "untouchable",
        company: "Untouchable: Laughing Out Caste",
        role: "Assistant Video Editor",
        logo: { url: placeholderImageUrl("ULC", 512, 512) },
        logoHint: "l-ulc",
        initials: "ULC",
        start: "Nov 2023",
        end: "Apr 2024",
        duration: "6 mo",
        description:
          "Manjeet Sarkar's debut feature documentary — nearly a year with the directors on rough and final cuts.",
      },
      {
        id: "hector-beverages",
        company: "Hector Beverages",
        role: "Marketing Intern",
        logo: { url: placeholderImageUrl("Hector Beverages", 512, 512) },
        logoHint: "l-hb",
        initials: "HB",
        start: "Nov 2022",
        end: "Dec 2022",
        duration: "2 mo",
        description: "Early marketing exposure — the first step toward a storytelling craft.",
      },
    ],
  }),
  room: RoomSchema.parse({
    intro:
      "A living mood board of my off-clock ideas and experiments. Grab anything and move it around — arrange the room however you like.",
    allowDrag: true,
    showShuffle: true,
    cards: [
      {
        id: "sunrise-ghats",
        type: "polaroid",
        fx: 0.03,
        fy: 0.06,
        rot: -5,
        pinType: "pin",
        image: {
          url: placeholderImageUrl("Sunrise Ghats"),
          alt: "Sunrise on the Ghats",
        },
        tint: "rg3",
        tag: "Reel",
        caption: "Sunrise on the Ghats",
        subCaption: "Travel · 41.7k",
      },
      {
        id: "breath-sounds",
        type: "note",
        fx: 0.29,
        fy: 0.02,
        rot: 3,
        pinType: "tape",
        color: "ember",
        kicker: "Idea",
        text: "A reel cut only to breath sounds — no music.",
      },
      {
        id: "city-60fps",
        type: "polaroid",
        fx: 0.55,
        fy: 0.05,
        rot: -3,
        pinType: "pin-signal",
        image: {
          url: placeholderImageUrl("City 60fps"),
          alt: "City at 60fps",
        },
        tint: "rg1",
        tag: "B-roll",
        caption: "City at 60fps",
        subCaption: "Bengaluru · 12.9k",
      },
      {
        id: "match-cut-travel",
        type: "note",
        fx: 0.8,
        fy: 0.07,
        rot: 4,
        pinType: "pin-signal",
        color: "signal",
        kicker: "Try next",
        text: "Match-cut travel series — one location, six transitions.",
      },
      {
        id: "notebook-quote",
        type: "quote",
        fx: 0.04,
        fy: 0.36,
        rot: 3,
        pinType: "tape",
        text: "Editing is the art of slowing time and amplifying emotion.",
        attribution: "from my notebook",
      },
      {
        id: "chain-throttle",
        type: "polaroid",
        fx: 0.35,
        fy: 0.37,
        rot: -4,
        pinType: "pin",
        image: {
          url: placeholderImageUrl("Chain Throttle"),
          alt: "Chain and throttle",
        },
        tint: "rg4",
        tag: "Bikes",
        caption: "Chain & throttle",
        subCaption: "On the road · 33.0k",
      },
      {
        id: "instagram",
        type: "ig",
        fx: 0.61,
        fy: 0.33,
        rot: 2,
        pinType: "pin",
        handle: "@madhu.edit",
        tiles: ["rg1", "rg3", "rg4", "rg2", "rg5", "rg1"],
        ctaLabel: "Follow the experiments",
        ctaHref: "https://instagram.com",
      },
      {
        id: "colour-test",
        type: "note",
        fx: 0.83,
        fy: 0.41,
        rot: -5,
        pinType: "tape",
        color: "ember",
        kicker: "Colour test",
        text: "Teal × ember grade — cool shadows, warm skin.",
      },
      {
        id: "coastal-run",
        type: "polaroid",
        fx: 0.05,
        fy: 0.72,
        rot: 4,
        pinType: "pin-signal",
        image: {
          url: placeholderImageUrl("Coastal Run"),
          alt: "Coastal run Gokarna",
        },
        tint: "rg3",
        tag: "Travel",
        caption: "Coastal run · Gokarna",
        subCaption: "Mangalore → Gokarna",
      },
      {
        id: "off-hours",
        type: "tags",
        fx: 0.31,
        fy: 0.76,
        rot: -3,
        pinType: "pin",
        kicker: "What fills the off-hours",
        tags: [
          { label: "Bikes", tint: "ember" },
          { label: "Coffee", tint: "default" },
          { label: "Colour", tint: "signal" },
          { label: "Travel", tint: "default" },
          { label: "B-roll", tint: "ember" },
          { label: "Sound design", tint: "signal" },
        ],
      },
      {
        id: "pour-slow-mo",
        type: "polaroid",
        fx: 0.59,
        fy: 0.73,
        rot: 5,
        pinType: "pin",
        image: {
          url: placeholderImageUrl("Pour Slow Mo"),
          alt: "Pour slow-mo",
        },
        tint: "rg1",
        tag: "Coffee",
        caption: "Pour, slow-mo",
        subCaption: "Practice · 9.6k",
      },
      {
        id: "bike-pov",
        type: "note",
        fx: 0.82,
        fy: 0.73,
        rot: -4,
        pinType: "pin-signal",
        color: "signal",
        kicker: "One-shot",
        text: "Bike POV, no cuts — the whole ride in a single take.",
      },
    ],
  }),
  contact: ContactSchema.parse({
    availableForFreelance: true,
    availabilityLabel: "Available",
    footerStatus: "Available for freelance",
    email: "hello@madhu.edit",
    location: "Bengaluru, Karnataka, India",
    socials: {
      linkedin: "https://www.linkedin.com/in/nmadhukumar",
      instagram: "https://instagram.com",
      youtube: "https://example.com/videos/showreel",
    },
    footerTagline: "Video editor & visual storyteller in Bengaluru. Every frame holds a feeling.",
  }),
  settings: SettingsSchema.parse({
    seo: {
      title: "N Madhu Kumar — Video Editor & Visual Storyteller",
      description:
        "N Madhu Kumar, a Bengaluru video editor driven by emotion and storytelling. Podcasts, TV ads, events and documentary work for Jar and The 1% Club.",
      ogImage: { url: placeholderImageUrl("Madhu Edit", 1200, 630) },
    },
    appearance: {
      defaultTheme: "suite",
      showThemeToggle: true,
      motion: true,
    },
    domain: "madhu.edit",
  }),
} satisfies Record<SectionKey, Prisma.InputJsonObject>;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    for (const key of sectionKeys) {
      const data = sectionData[key];

      for (const status of [Status.DRAFT, Status.PUBLISHED]) {
        await db.section.upsert({
          where: { key_status: { key, status } },
          create: { key, status, data },
          update: { data },
        });
      }
    }
  } finally {
    await db.$disconnect();
  }
}

const isSeedCommand = process.argv[1]?.replaceAll("\\", "/").endsWith("/prisma/seed.ts");

if (isSeedCommand) {
  void main();
}
