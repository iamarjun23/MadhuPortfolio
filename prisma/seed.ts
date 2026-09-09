import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, Status } from "../src/generated/prisma/client";
import { sectionKeys, type SectionKey } from "../src/lib/sections";
import {
  AboutSchema,
  BoothSchema,
  ContactSchema,
  ExperienceSchema,
  HeroSchema,
  ImpactSchema,
  PraiseSchema,
  ProcessSchema,
  RoomSchema,
  SettingsSchema,
  WorkSchema,
} from "../src/schemas";

export const sectionData = {
  hero: HeroSchema.parse({
    eyebrow: "Video Editor · Podcasts, campaigns & documentary · Bengaluru",
    line1: "Every frame",
    line2: "holds",
    cutWords: ["a story"],
    sub: "Edit it. Take the note. Edit it better. N Madhu Kumar. Three years, five languages, currently editing at Jar.",
    primaryCta: { label: "See the work", href: "#work" },
    secondaryCta: { label: "Enter the Drawing Room", href: "/room" },
    creditLine1: "CUT BY N MADHU KUMAR",
    bgVideo: {
      url: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/3129957/pexels-photo-3129957.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
      duotone: true,
    },
  }),
  about: AboutSchema.parse({
    portrait: null,
    heading: "The edit is invisible. You feel the pace.",
    paragraphs: [
      "I'm a video editor with three years behind me, currently at Jar, where I work with a team of eight across podcasts, campaigns, long form and short form content.",
      "Along the way I've cut reels for Finance With Sharan and worked as assistant editor on the documentary Untouchable: Laughing Out Loud Caste.",
      "A BE in Information Science from Sai Vidya Institute of Technology also happened somewhere in there, probably why I organise a project properly before I touch it. That's where I found my passion in video editing.",
      "One thing I believe: A video gets better with every round of feedback, not worse.",
      "When the timeline's closed I'm on a Dominar 400, somewhere between here and the coast.",
    ],
    currentStatus: "Currently — Video Editor at Jar",
    skills: ["Premiere Pro", "After Effects", "Sound design", "Story & flow", "On set"],
    skillGroups: [
      { label: "Software", items: ["Premiere Pro", "After Effects", "Sound design"] },
      { label: "Also", items: ["Story & flow", "On set"] },
      { label: "Learning", items: ["Motion graphics"] },
    ],
  }),
  impact: ImpactSchema.parse({
    stats: [
      { value: "3+", label: "Years editing" },
      { value: "6", label: "Clients & brands" },
      { value: "5", label: "Languages cut in" },
      { value: "100%", label: "Client satisfaction" },
    ],
    worked: [
      {
        name: "Dulquer Salmaan",
        context: "Jar campaign film",
      },
      {
        name: "Ramesh Arvind",
        context: "Jar campaign film",
      },
      {
        name: "Danish Sait",
        context: "JarXchange, live",
      },
      {
        name: "Ankur Warikoo",
        context: "Jar townhall podcast",
      },
      {
        name: "Sharan Hegde",
        context: "Finance with Sharan",
      },
      {
        name: "Manjeet Sarkar",
        context: "Untouchable — documentary",
      },
      {
        name: "Deepak Shenoy",
        context: "JarXchange podcast",
      },
      {
        name: "Neil Borate",
        context: "JarXchange podcast",
      },
      {
        name: "Ravi Handa",
        context: "JarXchange podcast",
      },
    ],
    campaignsHeading: "Sponsorship campaigns",
    campaignsDescription: "Performance films cut for Jar's sponsorship of each show.",
    campaigns: [
      {
        name: "Mahanati",
        context: "Jar sponsorship performance film",
        href: null,
      },
      {
        name: "Bigg Boss Kannada",
        context: "Jar sponsorship performance film",
        href: null,
      },
      {
        name: "Sa Re Ga Ma Pa",
        context: "Jar sponsorship performance film",
        href: null,
      },
    ],
  }),
  work: WorkSchema.parse({
    eyebrow: "Selected work",
    heading: "Rearrange the room.",
    intro: "Arrange the cards your way, and click any card to preview the video.",
    briefPrompt: "Have a story?",
    briefCta: "Hire me",
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
          },
          {
            id: "ankur-warikoo",
            title: "Ankur Warikoo — Unfiltered",
            subtitle: "JarXchange",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
          },
          {
            id: "kunal-khattar",
            title: "Kunal Khattar — Bike taxi ban",
            subtitle: "JarXchange",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
          },
          {
            id: "deepak-shenoy",
            title: "Deepak Shenoy — Trump, India & Taxes",
            subtitle: "Capitalmind",
            href: "https://youtu.be/PxoYGdcjmt8",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
          },
          {
            id: "ravi-handa",
            title: "Ravi Handa — Retire Early / FIRE",
            subtitle: "JarXchange",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
          },
          {
            id: "neil-borate",
            title: "Neil Borate — Financial news",
            subtitle: "JarXchange",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-1",
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
          },
          {
            id: "ramesh-arvind",
            title: "Start Saving on #JarApp",
            subtitle: "ft. Ramesh Arvind",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-2",
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
          },
          {
            id: "kannada-rajyotsava",
            title: "Jar Auto — Kannada Rajyotsava 2025",
            subtitle: "Event",
            href: "https://www.linkedin.com/posts/jarapp_kannada-rajyotsava-2025-x-jar-activity-7402319420766928896-YQV4",
            hrefLabel: "LinkedIn",
            thumbHint: "bd-3",
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
          },
          {
            id: "rule-for-2025",
            title: "Rule for 2025",
            subtitle: "Kannada · Informative",
            href: "https://youtu.be/I3CrnWFsaks",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
          },
          {
            id: "second-airport",
            title: "Second Airport — Where?",
            subtitle: "Kannada · Explainer",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
          },
          {
            id: "ktm-bankrupt",
            title: "Is KTM going bankrupt?",
            subtitle: "Jar · Explainer",
            href: "https://youtu.be/AfsFyze0c7I",
            hrefLabel: "YouTube",
            thumbHint: "bd-4",
          },
        ],
      },
    ],
  }),
  booth: BoothSchema.parse({
    slots: [
      {
        id: "ramesh-arvind",
        image: null,
        title: "Ramesh Arvind",
        subtitle: "Jar · Start Saving",
        lightboxCaption: "On set with Ramesh Arvind for Jar · Start Saving",
        hasTape: true,
        tile: "a",
      },
      {
        id: "danish-sait",
        image: null,
        title: "Danish Sait",
        subtitle: "JarXchange podcast",
        lightboxCaption: "JarXchange podcast with Danish Sait",
        hasTape: false,
        tile: "b",
      },
      {
        id: "ankur-warikoo",
        image: null,
        title: "Ankur Warikoo",
        subtitle: "Jar townhall",
        lightboxCaption: "Jar townhall with Ankur Warikoo",
        hasTape: true,
        tile: "c",
      },
      {
        id: "ananth-sriram",
        image: null,
        title: "Ananth Sriram",
        subtitle: "Jar performance shoot",
        lightboxCaption: "Jar performance shoot with Ananth Sriram",
        hasTape: false,
        tile: "d",
      },
      {
        id: "manjeet-sarkar",
        image: null,
        title: "Manjeet Sarkar",
        subtitle: "Untouchable: Laughing Out Loud Caste",
        lightboxCaption: "Untouchable: Laughing Out Loud Caste with Manjeet Sarkar",
        hasTape: true,
        tile: "e",
      },
      {
        id: "varun-grover",
        image: null,
        title: "Varun Grover",
        subtitle: "Untouchable: Laughing Out Loud Caste",
        lightboxCaption: "Untouchable: Laughing Out Loud Caste project with Varun Grover",
        hasTape: false,
        tile: "f",
      },
      {
        id: "jarxchange-podcast",
        image: null,
        title: "JXC Podcast",
        subtitle: "Guests across finance",
        lightboxCaption: "JarXchange podcast guests across the finance field",
        hasTape: false,
        tile: "g",
      },
    ],
  }),
  praise: PraiseSchema.parse({
    visible: true,
    quotes: [
      {
        id: "sample-1",
        quote:
          "Madhu turns a pile of raw footage into a story with rhythm. Every cut lands exactly where it should.",
        name: "Creative Director",
        role: "Production House",
        initials: "CD",
        isSample: true,
      },
      {
        id: "sample-2",
        quote:
          "Fast, precise, and always finds the emotional beat in a scene. Our campaign turnaround time got so much better.",
        name: "Brand Manager",
        role: "Marketing Agency",
        initials: "BM",
        isSample: true,
      },
      {
        id: "sample-3",
        quote:
          "Handles everything from documentary pacing to punchy short-form without missing a beat. A rare range.",
        name: "Podcast Producer",
        role: "Media Company",
        initials: "PP",
        isSample: true,
      },
    ],
  }),
  experience: ExperienceSchema.parse({
    eyebrow: "Experience",
    heading: "A career cut into scenes.",
    intro:
      "Move through the rooms that shaped the way I find rhythm, build tension, and land a story.",
    reelLabel: "Career reel",
    roles: [
      {
        id: "jar-editor",
        company: "Jar",
        role: "Video Editor",
        logoHint: "l-jar",
        initials: "jar",
        start: "Mar 2025",
        end: "Present",
        duration: "Current",
        location: "Creative room",
        description:
          "Campaign films with Dulquer Salmaan and Ramesh Arvind, JarXchange podcasts, live events, and documentary-style explainers in English and Kannada. Took on the projects that were bigger than my brief, and now lead a team of eight editors.",
      },
      {
        id: "jar-intern",
        company: "Jar",
        role: "Video Editor Intern → Associate Video Editor",
        logoHint: "l-jar",
        initials: "jar",
        start: "Sep 2024",
        end: "Mar 2025",
        duration: "Sep 2024 - Mar 2025",
        location: "The edit bay",
        description:
          "Came in as an intern on short-form and performance assets. Went full-time in March.",
      },
      {
        id: "one-percent-club",
        company: "The 1% Club",
        role: "Video Editor Intern",
        logoHint: "l-onep",
        initials: "1%",
        start: "Apr 2024",
        end: "Jun 2024",
        duration: "Apr 2024 - Jun 2024",
        location: "The reel room",
        description:
          "Short-form reels for Finance With Sharan - Instagram and YouTube. Roughly 25 of them.",
      },
      {
        id: "untouchable",
        company: "Untouchable: Laughing Out Loud Caste",
        role: "Assistant Video Editor",
        logoHint: "l-ulc",
        initials: "ULC",
        start: "Nov 2023",
        end: "Apr 2024",
        duration: "Nov 2023 - Apr 2024",
        location: "The cutting room",
        description:
          "My first documentary. The senior editor, Mike Noone, is American - brilliant on craft, but the caste context wasn't his to call. So Manjeet and I sat down, went through it properly, and worked out the flow and the final cut between us. I was the assistant. I learned more in those five months than in the two years before it.",
      },
      {
        id: "dhrupad-crew",
        company: "Dhrupad Crew",
        role: "Shooter & Editor",
        logoHint: "custom",
        initials: "DC",
        start: "Aug 2023",
        end: "Aug 2023",
        duration: "First paid work",
        location: "First room",
        description:
          "A band starting a YouTube channel. I shot the music videos and cut them. First money I ever made from a timeline.",
      },
    ],
  }),
  process: ProcessSchema.parse({
    eyebrow: "Studio",
    heading: "The work behind the cut.",
    intro:
      "A clear process, realistic turnaround, and a few frames from the rooms where the work happened.",
    method: {
      eyebrow: "How I work",
      heading: "Five passes. One better film.",
      steps: [
        {
          id: "organise",
          number: "01",
          title: "Organise",
          description:
            "Files named, bins built, script read twice. Nothing hits the timeline until I know where everything lives.",
        },
        {
          id: "assemble",
          number: "02",
          title: "Assemble",
          description:
            "A rough pass for structure - where the story turns, where it drags, what can go. Structure before polish, always.",
        },
        {
          id: "cut",
          number: "03",
          title: "Cut",
          description:
            "Dialogue-led, cut on meaning rather than beat. Sound design in the same pass, not bolted on after.",
        },
        {
          id: "feedback",
          number: "04",
          title: "Feedback",
          description:
            "Send it, take the notes, cut again. This is the part most editors resist and the part that makes the video good.",
        },
        {
          id: "deliver",
          number: "05",
          title: "Deliver",
          description: "Every format the campaign needs, named properly, on time.",
        },
      ],
    },
    turnaround: {
      eyebrow: "Turnaround",
      heading: "Know the rhythm before we start.",
      rows: [
        { id: "short-form", format: "Short-form reel", timing: "1 day" },
        { id: "long-form", format: "Long-form / explainer", timing: "2-3 days" },
        { id: "podcast", format: "Podcast episode", timing: "4-5 days" },
        { id: "campaign", format: "Campaign", timing: "~1 month, script to live ads" },
      ],
      notes: [
        {
          id: "podcast-note",
          text: "Podcasts run longer because they're multicam and cut to reference.",
        },
        {
          id: "freelance-note",
          text: "Freelance work starts within a week of the brief. Rates depend on scope - ask.",
        },
      ],
    },
    showPhotobooth: true,
    seo: {
      title: "Studio",
      description: "How N Madhu Kumar organises, edits, reviews, and delivers video work.",
    },
  }),
  room: RoomSchema.parse({
    teaser: {
      eyebrow: "Off the clock",
      kicker: "A small side door in the portfolio",
      heading: "There's more in the",
      headingAccent: "cutting room.",
      description:
        "Not a reel. A living shelf of bike rides, half-finished thoughts, frames worth keeping, and the things that feed the work when the timeline is closed.",
      ctaLabel: "Open the Drawing Room",
      stamp: "Private archive",
      note: "01 / The reel between reels",
      invitation: "YOU'RE INVITED",
      invitationNote: "Open when curious",
    },
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
        image: null,
        tint: "rg3",
        tag: "Ride",
        caption: "Bengaluru → Varkala → Kanyakumari → Bengaluru",
        subCaption: "Five days",
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
        type: "note",
        fx: 0.55,
        fy: 0.05,
        rot: -3,
        pinType: "pin-signal",
        color: "signal",
        kicker: "Last ride",
        text: "Drone footage from the last ride.",
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
        text: "Take the note. The video gets better every single time.",
        attribution: "N Madhu Kumar",
      },
      {
        id: "chain-throttle",
        type: "polaroid",
        fx: 0.35,
        fy: 0.37,
        rot: -4,
        pinType: "pin",
        image: null,
        tint: "rg4",
        tag: "Bikes",
        caption: "Dominar 400",
        subCaption: "Somewhere between here and the coast",
      },
      {
        id: "instagram",
        type: "ig",
        fx: 0.61,
        fy: 0.33,
        rot: 2,
        pinType: "pin",
        handle: "@madhu_on_run",
        tiles: ["rg1", "rg3", "rg4", "rg2", "rg5", "rg1"],
        ctaLabel: "Follow the experiments",
        ctaHref: "https://instagram.com/madhu_on_run",
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
        image: null,
        tint: "rg3",
        tag: "Bike",
        caption: "Cockpit view of my bike",
        subCaption: "Still the best frame",
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
          { label: "Zero to Viral", tint: "ember" },
          { label: "Romance novels", tint: "default" },
          { label: "Motion graphics", tint: "signal" },
          { label: "Bike rides", tint: "default" },
        ],
      },
      {
        id: "pour-slow-mo",
        type: "polaroid",
        fx: 0.59,
        fy: 0.73,
        rot: 5,
        pinType: "pin",
        image: null,
        tint: "rg1",
        tag: "Ride",
        caption: "Nandi Hills",
        subCaption: "5:40 AM",
      },
      {
        id: "bike-pov",
        type: "note",
        fx: 0.82,
        fy: 0.73,
        rot: -4,
        pinType: "pin-signal",
        color: "signal",
        kicker: "In the saddle",
        text: "Six or seven hours in the saddle is where the edit problems get solved.",
      },
      {
        id: "kun-faya-kun",
        type: "note",
        fx: 0.14,
        fy: 0.55,
        rot: -2,
        pinType: "tape",
        color: "ember",
        kicker: "Recorded",
        text: "Kun Faya Kun - sung and recorded.",
      },
      {
        id: "mast-malang",
        type: "note",
        fx: 0.47,
        fy: 0.56,
        rot: 3,
        pinType: "pin",
        color: "signal",
        kicker: "Recorded",
        text: "Mast Malang - sung and recorded.",
      },
      {
        id: "gerua",
        type: "note",
        fx: 0.73,
        fy: 0.57,
        rot: -3,
        pinType: "pin-signal",
        color: "ember",
        kicker: "Title to confirm",
        text: "Gerua - sung and recorded.",
      },
    ],
  }),
  contact: ContactSchema.parse({
    availableForFreelance: true,
    availabilityLabel: "Available for freelance ·",
    footerStatus: "Available for freelance",
    projectCtaLabel: "Book a call",
    callbackCtaLabel: "Request a callback",
    email: "nmadhuk456@gmail.com",
    location: "Bengaluru, Karnataka, India",
    socials: {
      linkedin: "https://www.linkedin.com/in/nmadhukumar",
      instagram: "https://instagram.com/madhu_on_run",
      youtube: null,
    },
    footerTagline:
      "Video editor in Bengaluru. Podcasts, campaigns, documentary, and the stories between them.",
  }),
  settings: SettingsSchema.parse({
    seo: {
      title: "N Madhu Kumar — Video Editor & Visual Storyteller",
      description:
        "N Madhu Kumar, a Bengaluru video editor driven by emotion and storytelling. Podcasts, TV ads, events and documentary work for Jar and The 1% Club.",
      ogImage: null,
    },
    appearance: {
      defaultTheme: "suite",
      showThemeToggle: true,
      motion: true,
    },
    fallbackImage: null,
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
