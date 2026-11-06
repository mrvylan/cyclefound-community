export type ItemStatus = "For sale" | "Open to offers" | "Trade only" | "Not for sale";
export type Level = "RIDER" | "PRO" | "MASTER" | "LEGEND";

export type Person = {
  handle: string;
  name: string;
  init: string;
  bg: string;
  role: string;
  loc: string;
  level: Level;
  rating: string;
  reviews: number;
  spokes: string;
  spokesNum: number;
  accepted: number;
  /** Display hint only — prefer getItemsByOwner(handle).length for live counts. */
  items: number;
  reply: string;
  bio: string;
  skills: string[];
  consult: string;
  verified: boolean;
  /** Optional manual badge shown when verifiedBadges feature is off (e.g. "Founding expert"). */
  roleBadge?: string;
  memberSince: string;
  /** Optional profile photo URL (data URL or storage public URL). */
  avatarUrl?: string;
  /** Optional profile cover / workshop banner. */
  coverUrl?: string;
};

export type Garage = {
  ownerHandle: string;
  name: string;
  description: string;
  location: string;
  updated: string;
};

export type GarageItem = {
  id: string;
  ownerHandle: string;
  catShort: string;
  cat: string;
  year: string;
  name: string;
  cond: string;
  mkt: string;
  ask: string;
  status: ItemStatus;
  links: string;
  trend: string;
  photo?: string;
};

export type WantedRequest = {
  id: string;
  part: string;
  /** Exactly one owner — a member handle. */
  ownerHandle: string;
};

export type Question = {
  id: string;
  votes: number;
  tags: string[];
  title: string;
  excerpt: string;
  body?: string[];
  asker: string;
  askerHandle?: string;
  init: string;
  bg: string;
  time: string;
  /** Derived from answers[] — use enrichQuestion / getQuestions. */
  answers: number;
  solved: boolean;
  expert: string;
  linked: string;
  views?: number;
  following?: number;
  bounty?: number;
  linkedItemId?: string;
};

export type Answer = {
  id: string;
  questionId: string;
  name: string;
  handle: string;
  init: string;
  bg: string;
  rating: string;
  spokes: string;
  badge: string;
  time: string;
  votes: number;
  accepted: boolean;
  body: string[];
};

const MARKET_STATUSES: ItemStatus[] = ["For sale", "Open to offers", "Trade only"];

export const people: Person[] = [
  {
    handle: "lugged_marco",
    name: "Marco Reyes",
    init: "MR",
    bg: "#527D31",
    role: "Vintage steel restorer · Oakland",
    loc: "Oakland, CA · 31 mi",
    level: "MASTER",
    rating: "4.9",
    reviews: 128,
    spokes: "12.4k",
    spokesNum: 12480,
    accepted: 214,
    items: 8,
    reply: "within 2 hrs",
    bio: "Restoring lugged Italian steel since 1998. Specializes in Colnago, De Rosa and Masi from the 70s–80s. I answer questions for free, lend tools locally, and do a handful of full restorations a year.",
    skills: ["Vintage restoration", "Valuation", "Italian steel"],
    consult: "$40 / 30 min",
    verified: true,
    roleBadge: "Founding expert",
    memberSince: "2019",
  },
  {
    handle: "jen_whitlock",
    name: "Jen Whitlock",
    init: "JW",
    bg: "#3F6B5C",
    role: "Pro mechanic, electronic shifting",
    loc: "Sacramento, CA · remote",
    level: "MASTER",
    rating: "4.9",
    reviews: 210,
    spokes: "15.8k",
    spokesNum: 15820,
    accepted: 388,
    items: 1,
    reply: "within 1 hr",
    bio: "Former race mechanic. Di2, AXS and EPS troubleshooting, plus brake bleeds that actually stay bled.",
    skills: ["Electronic shifting", "Hydraulic brakes", "Valuation"],
    consult: "$35 / 30 min",
    verified: true,
    roleBadge: "Founding expert",
    memberSince: "2018",
  },
  {
    handle: "priya_wheels",
    name: "Priya Natarajan",
    init: "PN",
    bg: "#1E40AF",
    role: "Wheelbuilder · San Jose",
    loc: "San Jose, CA · 4 mi",
    level: "PRO",
    rating: "5.0",
    reviews: 86,
    spokes: "9.2k",
    spokesNum: 9200,
    accepted: 167,
    items: 2,
    reply: "within 4 hrs",
    bio: "Hand-built over 1,500 wheels. Ask me about spoke math, rim choice and why your wheel keeps going out of true.",
    skills: ["Wheelbuilding", "Tubeless", "Hub service"],
    consult: "",
    verified: true,
    roleBadge: "Founding expert",
    memberSince: "2020",
  },
  {
    handle: "dale_frames",
    name: "Dale Okafor",
    init: "DO",
    bg: "#6D28D9",
    role: "Frame builder · Santa Cruz",
    loc: "Santa Cruz, CA · 28 mi",
    level: "PRO",
    rating: "4.8",
    reviews: 54,
    spokes: "6.1k",
    spokesNum: 6140,
    accepted: 92,
    items: 1,
    reply: "within 1 day",
    bio: "Custom steel frames, TIG and fillet-brazed. Happy to review geometry before you commit to a build.",
    skills: ["Frame building", "Brazing", "Geometry"],
    consult: "$60 / 45 min",
    verified: true,
    roleBadge: "Founding expert",
    memberSince: "2021",
  },
  {
    handle: "campy_tomas",
    name: "Tomás Lindqvist",
    init: "TL",
    bg: "#0E7490",
    role: "Campagnolo collector · Berkeley",
    loc: "Berkeley, CA · 38 mi",
    level: "PRO",
    rating: "4.9",
    reviews: 41,
    spokes: "7.3k",
    spokesNum: 7300,
    accepted: 104,
    items: 2,
    reply: "within 1 day",
    bio: "Collector with a 112-item Campagnolo archive. If it was made in Vicenza, I can probably date it.",
    skills: ["Vintage restoration", "Campagnolo", "Valuation"],
    consult: "",
    verified: true,
    memberSince: "2019",
  },
  {
    handle: "kai_suspension",
    name: "Kai Yamamoto",
    init: "KY",
    bg: "#B45309",
    role: "Suspension tuner · Marin",
    loc: "Marin, CA · 52 mi",
    level: "PRO",
    rating: "4.7",
    reviews: 63,
    spokes: "4.9k",
    spokesNum: 4900,
    accepted: 71,
    items: 1,
    reply: "within 3 hrs",
    bio: "Fork and shock rebuilds, spring rates and tuning for real trails. Fox, RockShox, Öhlins.",
    skills: ["Suspension", "Bike fit", "MTB setup"],
    consult: "$30 / 30 min",
    verified: true,
    memberSince: "2022",
  },
  {
    handle: "ben_carver",
    name: "Ben Carver",
    init: "BC",
    bg: "#475569",
    role: "Member · Oakland",
    loc: "Oakland, CA",
    level: "RIDER",
    rating: "New",
    reviews: 0,
    spokes: "180",
    spokesNum: 180,
    accepted: 0,
    items: 1,
    reply: "within 1 day",
    bio: "Learning vintage steel restoration one seized part at a time.",
    skills: ["Vintage restoration"],
    consult: "",
    verified: false,
    memberSince: "2025",
  },
  {
    handle: "lena_ortiz",
    name: "Lena Ortiz",
    init: "LO",
    bg: "#BE185D",
    role: "Member · Berkeley",
    loc: "Berkeley, CA",
    level: "RIDER",
    rating: "New",
    reviews: 2,
    spokes: "420",
    spokesNum: 420,
    accepted: 1,
    items: 0,
    reply: "within 1 day",
    bio: "Restoring an ’82 Bianchi Specialissima.",
    skills: ["Rare parts", "Campagnolo"],
    consult: "",
    verified: false,
    memberSince: "2024",
  },
  {
    handle: "ari_patel",
    name: "Ari Patel",
    init: "AP",
    bg: "#0F766E",
    role: "Member · Palo Alto",
    loc: "Palo Alto, CA",
    level: "RIDER",
    rating: "4.5",
    reviews: 4,
    spokes: "610",
    spokesNum: 610,
    accepted: 2,
    items: 1,
    reply: "within 2 days",
    bio: "Weekend wrench, collecting 80s Italian road bikes.",
    skills: ["Valuation"],
    consult: "",
    verified: false,
    memberSince: "2023",
  },
  {
    handle: "nate_gomez",
    name: "Nate Gomez",
    init: "NG",
    bg: "#4A4F57",
    role: "Member · Oakland",
    loc: "Oakland, CA",
    level: "RIDER",
    rating: "4.6",
    reviews: 3,
    spokes: "390",
    spokesNum: 390,
    accepted: 1,
    items: 1,
    reply: "within 1 day",
    bio: "Framesets and head badges.",
    skills: ["Framesets"],
    consult: "",
    verified: false,
    memberSince: "2024",
  },
  {
    handle: "rob_fenn",
    name: "Rob Fenn",
    init: "RF",
    bg: "#A16207",
    role: "Member · San Jose",
    loc: "San Jose, CA",
    level: "RIDER",
    rating: "New",
    reviews: 1,
    spokes: "210",
    spokesNum: 210,
    accepted: 0,
    items: 0,
    reply: "within 2 days",
    bio: "One-owner Stumpjumper in the garage — deciding whether to sell.",
    skills: ["Valuation", "Vintage"],
    consult: "",
    verified: false,
    memberSince: "2025",
  },
  {
    handle: "sam_whitfield",
    name: "Sam Whitfield",
    init: "SW",
    bg: "#0F766E",
    role: "Member · Santa Cruz",
    loc: "Santa Cruz, CA",
    level: "RIDER",
    rating: "New",
    reviews: 0,
    spokes: "95",
    spokesNum: 95,
    accepted: 0,
    items: 0,
    reply: "within 1 day",
    bio: "Planning a loaded gravel frame with a local builder.",
    skills: ["Build", "Geometry"],
    consult: "",
    verified: false,
    memberSince: "2025",
  },
  {
    handle: "kim_duarte",
    name: "Kim Duarte",
    init: "KD",
    bg: "#4338CA",
    role: "Member · San Jose",
    loc: "San Jose, CA",
    level: "RIDER",
    rating: "New",
    reviews: 0,
    spokes: "140",
    spokesNum: 140,
    accepted: 0,
    items: 0,
    reply: "within 1 day",
    bio: "Rebuilding vintage rims onto modern hubs.",
    skills: ["Wheels", "Tubeless"],
    consult: "",
    verified: false,
    memberSince: "2025",
  },
];

export const garages: Garage[] = [
  {
    ownerHandle: "lugged_marco",
    name: "Lugged & Loved",
    description:
      "Italian steel from 1975–1989, kept rideable. Most of it isn’t for sale, but I’ll always talk about any of it — and a few pieces are ready for a new home.",
    location: "Oakland, CA",
    updated: "2 days ago",
  },
  {
    ownerHandle: "priya_wheels",
    name: "The Wheel Room",
    description: "Hubs, rims, and hand-built wheels — shop stock and personal stash.",
    location: "San Jose, CA",
    updated: "1 day ago",
  },
  {
    ownerHandle: "campy_tomas",
    name: "Campy Archive",
    description: "Pre-1990 Campagnolo and the bikes that wear it.",
    location: "Berkeley, CA",
    updated: "4 days ago",
  },
  {
    ownerHandle: "jen_whitlock",
    name: "Jen’s Bench",
    description: "Shop leftovers and electronic shifting spares.",
    location: "Sacramento, CA",
    updated: "3 days ago",
  },
  {
    ownerHandle: "dale_frames",
    name: "Fillet & TIG",
    description: "Jigs, fixtures, and a few personal builds.",
    location: "Santa Cruz, CA",
    updated: "1 week ago",
  },
  {
    ownerHandle: "kai_suspension",
    name: "Trail Tune",
    description: "Forks, shocks, and trail bikes in rotation.",
    location: "Marin, CA",
    updated: "5 days ago",
  },
  {
    ownerHandle: "ben_carver",
    name: "Ben’s corner",
    description: "One project frame and whatever tools fit on the wall.",
    location: "Oakland, CA",
    updated: "3h ago",
  },
  {
    ownerHandle: "ari_patel",
    name: "Ari’s garage",
    description: "A few Italian road bikes and parts I’m thinning out.",
    location: "Palo Alto, CA",
    updated: "1 week ago",
  },
  {
    ownerHandle: "nate_gomez",
    name: "Nate’s shed",
    description: "Framesets waiting for the right build.",
    location: "Oakland, CA",
    updated: "6 days ago",
  },
];

/** Canonical item inventory — every garage page and the Market read from this. */
export const items: GarageItem[] = [
  {
    id: "colnago-super-1984",
    ownerHandle: "lugged_marco",
    catShort: "Complete bikes",
    cat: "COMPLETE BIKE",
    year: "1984",
    name: "Colnago Super, Saronni red, 56 cm",
    cond: "Excellent",
    mkt: "$2.4–3.2k",
    ask: "$3,000",
    status: "Open to offers",
    links: "4 guides · 9 threads",
    trend: "+11% 12mo",
  },
  {
    id: "derosa-pro-1986",
    ownerHandle: "lugged_marco",
    catShort: "Complete bikes",
    cat: "COMPLETE BIKE",
    year: "1986",
    name: "De Rosa Professional, 55 cm",
    cond: "Project",
    mkt: "$900–1.4k",
    ask: "—",
    status: "Not for sale",
    links: "2 guides · 3 threads",
    trend: "+6% 12mo",
  },
  {
    id: "masi-gran-1979",
    ownerHandle: "lugged_marco",
    catShort: "Framesets",
    cat: "FRAMESET",
    year: "1979",
    name: "Masi Gran Criterium, 57 cm",
    cond: "Very good",
    mkt: "$1.8–2.5k",
    ask: "$2,200",
    status: "For sale",
    links: "3 guides · 5 threads",
    trend: "+9% 12mo",
  },
  {
    id: "super-record-group",
    ownerHandle: "lugged_marco",
    catShort: "Groupsets",
    cat: "GROUPSET",
    year: "1982",
    name: "Campagnolo Super Record, complete",
    cond: "Excellent",
    mkt: "$900–1.3k",
    ask: "—",
    status: "Not for sale",
    links: "6 guides · 14 threads",
    trend: "+4% 12mo",
  },
  {
    id: "cinelli-1a",
    ownerHandle: "lugged_marco",
    catShort: "Components",
    cat: "COMPONENT · STEM",
    year: "1980",
    name: "Cinelli 1A stem, 110 mm",
    cond: "Good",
    mkt: "$90–140",
    ask: "Trade",
    status: "Trade only",
    links: "1 guide · 2 threads",
    trend: "Flat",
  },
  {
    id: "mavic-gp4",
    ownerHandle: "lugged_marco",
    catShort: "Wheels",
    cat: "WHEELSET",
    year: "1983",
    name: "Mavic GP4 tubulars, Record hubs",
    cond: "Very good",
    mkt: "$350–500",
    ask: "$420",
    status: "For sale",
    links: "2 guides · 4 threads",
    trend: "+3% 12mo",
  },
  {
    id: "selle-turbo",
    ownerHandle: "lugged_marco",
    catShort: "Components",
    cat: "COMPONENT · SADDLE",
    year: "1985",
    name: "Selle Italia Turbo, white",
    cond: "Good",
    mkt: "$110–160",
    ask: "$140",
    status: "For sale",
    links: "0 guides · 1 thread",
    trend: "+5% 12mo",
  },
  {
    id: "campy-tools",
    ownerHandle: "lugged_marco",
    catShort: "Tools",
    cat: "TOOL",
    year: "1984",
    name: "Campagnolo tool kit, partial",
    cond: "Good",
    mkt: "$600–900",
    ask: "—",
    status: "Not for sale",
    links: "1 guide · 6 threads",
    trend: "+12% 12mo",
  },
  {
    id: "mavic-open-pro-pair",
    ownerHandle: "priya_wheels",
    catShort: "Wheels",
    cat: "WHEELSET",
    year: "1998",
    name: "Mavic Open Pro pair, DT 350 hubs",
    cond: "Excellent",
    mkt: "$280–380",
    ask: "$320",
    status: "For sale",
    links: "1 guide · 2 threads",
    trend: "+2% 12mo",
  },
  {
    id: "cinelli-1a-100",
    ownerHandle: "priya_wheels",
    catShort: "Components",
    cat: "COMPONENT · STEM",
    year: "1981",
    name: "Cinelli 1A stem, 100 mm",
    cond: "Very good",
    mkt: "$90–130",
    ask: "$110",
    status: "For sale",
    links: "1 guide · 1 thread",
    trend: "Flat",
  },
  {
    id: "colnago-super-1983",
    ownerHandle: "campy_tomas",
    catShort: "Complete bikes",
    cat: "COMPLETE BIKE",
    year: "1983",
    name: "Colnago Super, blue, 56 cm",
    cond: "Very good",
    mkt: "$2.2–2.9k",
    ask: "—",
    status: "Not for sale",
    links: "2 guides · 4 threads",
    trend: "+8% 12mo",
  },
  {
    id: "sr-cage-1st-gen",
    ownerHandle: "campy_tomas",
    catShort: "Components",
    cat: "COMPONENT · DERAILLEUR",
    year: "1981",
    name: "Super Record rear derailleur cage, 1st gen",
    cond: "Good",
    mkt: "$50–80",
    ask: "$65",
    status: "Open to offers",
    links: "3 guides · 6 threads",
    trend: "+15% 12mo",
  },
  {
    id: "di2-junction-spares",
    ownerHandle: "jen_whitlock",
    catShort: "Components",
    cat: "COMPONENT · ELECTRONIC",
    year: "2019",
    name: "Shimano Di2 junction box + battery mount",
    cond: "Excellent",
    mkt: "$40–70",
    ask: "$55",
    status: "For sale",
    links: "1 guide · 2 threads",
    trend: "Flat",
  },
  {
    id: "fillet-jig",
    ownerHandle: "dale_frames",
    catShort: "Tools",
    cat: "TOOL",
    year: "2018",
    name: "Fillet-braze frame jig, portable",
    cond: "Excellent",
    mkt: "$800–1.2k",
    ask: "Trade",
    status: "Trade only",
    links: "0 guides · 1 thread",
    trend: "+4% 12mo",
  },
  {
    id: "fox-38-2021",
    ownerHandle: "kai_suspension",
    catShort: "Components",
    cat: "COMPONENT · SUSPENSION",
    year: "2021",
    name: "Fox 38 Float Factory, 170 mm",
    cond: "Very good",
    mkt: "$450–600",
    ask: "$520",
    status: "Open to offers",
    links: "1 guide · 3 threads",
    trend: "−4% 12mo",
  },
  {
    id: "columbus-sl-frame-1984",
    ownerHandle: "ben_carver",
    catShort: "Framesets",
    cat: "FRAMESET",
    year: "1984",
    name: "Columbus SL road frame, 56 cm — original paint",
    cond: "Project",
    mkt: "$400–700",
    ask: "—",
    status: "Not for sale",
    links: "1 guide · 1 thread",
    trend: "Flat",
  },
  {
    id: "colnago-super-1985-saronni",
    ownerHandle: "ari_patel",
    catShort: "Complete bikes",
    cat: "COMPLETE BIKE",
    year: "1985",
    name: "Colnago Super, Saronni, 54 cm",
    cond: "Very good",
    mkt: "$2.3–3.0k",
    ask: "$2,650",
    status: "For sale",
    links: "2 guides · 3 threads",
    trend: "+7% 12mo",
  },
  {
    id: "colnago-super-frameset-1984",
    ownerHandle: "nate_gomez",
    catShort: "Framesets",
    cat: "FRAMESET",
    year: "1984",
    name: "Colnago Super frameset, 55 cm",
    cond: "Good",
    mkt: "$1.2–1.8k",
    ask: "—",
    status: "Open to offers",
    links: "1 guide · 2 threads",
    trend: "+5% 12mo",
  },
];

/** @deprecated Prefer `items` — alias kept for gradual migration. */
export const garageItems = items;

export const wanted: WantedRequest[] = [
  {
    id: "want-cinelli-1a",
    part: "Cinelli 1A stem, 110 mm, 26.4 clamp",
    ownerHandle: "lena_ortiz",
  },
  {
    id: "want-da7400",
    part: "Shimano Dura-Ace 7400 8-speed shifters",
    ownerHandle: "ari_patel",
  },
  {
    id: "want-ritchey",
    part: 'Ritchey Logic headset, 1" threaded',
    ownerHandle: "nate_gomez",
  },
  {
    id: "want-brooks",
    part: "Brooks Team Pro saddle, copper rails",
    ownerHandle: "rob_fenn",
  },
];

export const answers: Answer[] = [
  {
    id: "a-seatpost-marco",
    questionId: "seized-seatpost",
    name: "Marco Reyes",
    handle: "lugged_marco",
    init: "MR",
    bg: "#527D31",
    rating: "4.9",
    spokes: "12,480",
    badge: "Verified · Vintage restoration",
    time: "2h ago",
    votes: 38,
    accepted: true,
    body: [
      "Ammonia soak is safe on steel. I've done it on three Columbus SL frames including one with original Saronni paint. Tape over the head badge and any chrome, then soak the seat cluster overnight with household ammonia poured into the tube.",
      "Work the post gently the next day. If it still won't budge, cut the post a couple inches above the collar and slit it from the inside — never cut toward the tube wall.",
    ],
  },
  {
    id: "a-seatpost-jen",
    questionId: "seized-seatpost",
    name: "Jen Whitlock",
    handle: "jen_whitlock",
    init: "JW",
    bg: "#3F6B5C",
    rating: "4.9",
    spokes: "15,820",
    badge: "Verified · Pro mechanic",
    time: "2h ago",
    votes: 22,
    accepted: false,
    body: [
      "Agree with Marco on ammonia. One extra trick: after the soak, a few seconds of heat from a heat gun on the seat lug (not a torch) expands the steel just enough. Keep it moving so you don’t blister the clear coat.",
    ],
  },
  {
    id: "a-seatpost-dale",
    questionId: "seized-seatpost",
    name: "Dale Okafor",
    handle: "dale_frames",
    init: "DO",
    bg: "#6D28D9",
    rating: "4.8",
    spokes: "6,140",
    badge: "Verified · Frame builder",
    time: "1h ago",
    votes: 9,
    accepted: false,
    body: [
      "If it ever comes to cutting, cut the post 2 inches above the collar and saw two cuts lengthwise from the inside with a hacksaw blade in a handle. Slow, but I’ve never scored a seat tube doing it that way.",
    ],
  },
  {
    id: "a-cage-tomas",
    questionId: "super-record-cage",
    name: "Tomás Lindqvist",
    handle: "campy_tomas",
    init: "TL",
    bg: "#0E7490",
    rating: "4.9",
    spokes: "7,300",
    badge: "Verified · Campagnolo",
    time: "4h ago",
    votes: 11,
    accepted: false,
    body: [
      "I have a 1st-gen cage listed open to offers in my garage. Happy to trade for a clean Record brake caliper if you’d rather not buy.",
    ],
  },
  {
    id: "a-cage-marco",
    questionId: "super-record-cage",
    name: "Marco Reyes",
    handle: "lugged_marco",
    init: "MR",
    bg: "#527D31",
    rating: "4.9",
    spokes: "12,480",
    badge: "Verified · Vintage restoration",
    time: "5h ago",
    votes: 6,
    accepted: false,
    body: [
      "Check the stamping under the pivot bolt — pre-1983 cages have the earlier font. Tomás’s listing looks correct from the photos.",
    ],
  },
  {
    id: "a-chainstay-dale",
    questionId: "chainstay-length",
    name: "Dale Okafor",
    handle: "dale_frames",
    init: "DO",
    bg: "#6D28D9",
    rating: "4.8",
    spokes: "6,140",
    badge: "Verified · Frame builder",
    time: "18h ago",
    votes: 19,
    accepted: true,
    body: [
      "For ~25 lb on the rear I’d go 440. The longer stays keep the loaded bike calmer on descents without making the front end feel vague if you keep the front-center honest.",
    ],
  },
  {
    id: "a-chainstay-kai",
    questionId: "chainstay-length",
    name: "Kai Yamamoto",
    handle: "kai_suspension",
    init: "KY",
    bg: "#B45309",
    rating: "4.7",
    spokes: "4,900",
    badge: "Verified · Bike fit",
    time: "20h ago",
    votes: 7,
    accepted: false,
    body: [
      "Agree with Dale. If you ever run a bigger rear tire packed for bikepacking, the extra 15 mm also helps clearance.",
    ],
  },
  {
    id: "a-stump-marco",
    questionId: "stumpjumper-value",
    name: "Marco Reyes",
    handle: "lugged_marco",
    init: "MR",
    bg: "#527D31",
    rating: "4.9",
    spokes: "12,480",
    badge: "Verified · Valuation",
    time: "12h ago",
    votes: 8,
    accepted: false,
    body: [
      "All-original XT Comp from that year usually lands in the mid four figures locally if the paint is honest. Post garage photos and I can narrow it.",
    ],
  },
  {
    id: "a-stump-jen",
    questionId: "stumpjumper-value",
    name: "Jen Whitlock",
    handle: "jen_whitlock",
    init: "JW",
    bg: "#3F6B5C",
    rating: "4.9",
    spokes: "15,820",
    badge: "Verified · Valuation",
    time: "14h ago",
    votes: 5,
    accepted: false,
    body: [
      "Check the rear derailleur cage length and freehub — swaps there move the price more than cosmetics.",
    ],
  },
  {
    id: "a-mavic-priya",
    questionId: "mavic-spoke-length",
    name: "Priya Natarajan",
    handle: "priya_wheels",
    init: "PN",
    bg: "#1E40AF",
    rating: "5.0",
    spokes: "9,200",
    badge: "Verified · Wheelbuilding",
    time: "1d ago",
    votes: 14,
    accepted: true,
    body: [
      "Trust the calculator that includes the ERD of your specific Open Pros — Mavic blanks varied a bit. The shop’s +2 mm is a safety bias; lace one side and measure before cutting the whole set.",
    ],
  },
  {
    id: "a-mavic-kai",
    questionId: "mavic-spoke-length",
    name: "Kai Yamamoto",
    handle: "kai_suspension",
    init: "KY",
    bg: "#B45309",
    rating: "4.7",
    spokes: "4,900",
    badge: "Verified · MTB setup",
    time: "1d ago",
    votes: 3,
    accepted: false,
    body: [
      "If you’re going tubeless, leave a touch of length for the tape stack — don’t cut to the absolute minimum.",
    ],
  },
];

/** @deprecated Prefer getAnswersForQuestion — alias for the seized-seatpost thread. */
export const questionAnswers = answers.filter((a) => a.questionId === "seized-seatpost");

const questionsRaw: Omit<Question, "answers" | "solved" | "expert">[] = [
  {
    id: "seized-seatpost",
    votes: 48,
    tags: ["repair", "seatpost", "columbus-sl", "vintage-steel"],
    title:
      "Seized aluminum seatpost in a Columbus SL frame — how do I get it out without wrecking the paint?",
    excerpt:
      "Tried penetrating oil for a week. Original 1984 paint I really want to keep. Is the ammonia soak actually safe for steel?",
    body: [
      "Picked up a 1984 frame with original paint and decals. The Campagnolo post hasn't moved in what I'm guessing is 20+ years. I've soaked it with penetrating oil from the top and through the bottom bracket shell for a week and tried twisting with the saddle on — nothing.",
      "I've read about cutting the post and sawing it out from the inside, and also about an ammonia soak to dissolve the corrosion. Is ammonia safe for steel tubing and the paint? Anyone here done this on a frame they cared about?",
    ],
    asker: "Ben Carver",
    askerHandle: "ben_carver",
    init: "BC",
    bg: "#475569",
    time: "3h ago",
    linked: "",
    views: 1204,
    following: 38,
    bounty: 50,
    linkedItemId: "columbus-sl-frame-1984",
  },
  {
    id: "super-record-cage",
    votes: 31,
    tags: ["rare-parts", "campagnolo"],
    title: "Who has a 1st-gen Super Record rear derailleur cage (pre-1983 stamping)?",
    excerpt:
      "Restoring a ’82 Bianchi Specialissima. Mine is bent past saving. Happy to trade or buy.",
    asker: "Lena Ortiz",
    askerHandle: "lena_ortiz",
    init: "LO",
    bg: "#BE185D",
    time: "6h ago",
    linked: "In 3 member garages",
  },
  {
    id: "chainstay-length",
    votes: 26,
    tags: ["build", "gravel", "frame-geometry"],
    title: "Custom gravel build: 425 vs 440 chainstays for loaded bikepacking?",
    excerpt:
      "Planning a steel frame with a builder next spring. Carrying ~25 lb on the rear. What do the builders here recommend?",
    asker: "Sam Whitfield",
    askerHandle: "sam_whitfield",
    init: "SW",
    bg: "#0F766E",
    time: "1d ago",
    linked: "",
  },
  {
    id: "stumpjumper-value",
    votes: 19,
    tags: ["valuation", "vintage"],
    title: "Fair value on a 1987 Specialized Stumpjumper Comp, original Deore XT?",
    excerpt:
      "All original down to the tires, one owner. Not sure if I sell or keep it in the garage.",
    asker: "Rob Fenn",
    askerHandle: "rob_fenn",
    init: "RF",
    bg: "#A16207",
    time: "1d ago",
    linked: "Similar in 8 garages",
  },
  {
    id: "mavic-spoke-length",
    votes: 14,
    tags: ["wheels", "tubeless"],
    title: "Rebuilding Mavic Open Pro rims to modern hubs — spoke length sanity check",
    excerpt:
      "Going to DT 350 hubs, 32h 3-cross. My calculator and the shop disagree by 2 mm.",
    asker: "Kim Duarte",
    askerHandle: "kim_duarte",
    init: "KD",
    bg: "#4338CA",
    time: "2d ago",
    linked: "",
  },
];

export function getAnswersForQuestion(questionId: string): Answer[] {
  return answers
    .filter((a) => a.questionId === questionId)
    .slice()
    .sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      return b.votes - a.votes;
    });
}

export function enrichQuestion(
  q: Omit<Question, "answers" | "solved" | "expert"> | Question,
): Question {
  const thread = getAnswersForQuestion(q.id);
  const accepted = thread.find((a) => a.accepted);
  return {
    ...q,
    answers: thread.length,
    solved: Boolean(accepted),
    expert: accepted?.name ?? "",
  };
}

export const questions: Question[] = questionsRaw.map(enrichQuestion);

export function getQuestions(): Question[] {
  return questionsRaw.map(enrichQuestion);
}

export const leaders = [
  { rank: 1, name: "Jen Whitlock", handle: "jen_whitlock", init: "JW", bg: "#3F6B5C", role: "Pro mechanic", gain: "1,420" },
  { rank: 2, name: "Marco Reyes", handle: "lugged_marco", init: "MR", bg: "#527D31", role: "Vintage restorer", gain: "1,186" },
  { rank: 3, name: "Priya Natarajan", handle: "priya_wheels", init: "PN", bg: "#1E40AF", role: "Wheelbuilder", gain: "904" },
  { rank: 4, name: "Tomás Lindqvist", handle: "campy_tomas", init: "TL", bg: "#0E7490", role: "Campagnolo collector", gain: "611" },
  { rank: 5, name: "Kai Yamamoto", handle: "kai_suspension", init: "KY", bg: "#B45309", role: "Suspension tuner", gain: "532" },
];

export const areas = [
  { label: "Vintage restoration", n: 86 },
  { label: "Wheelbuilding", n: 63 },
  { label: "Frame building", n: 41 },
  { label: "Suspension service", n: 37 },
  { label: "Electronic shifting", n: 52 },
  { label: "Bike fit", n: 29 },
  { label: "Paint & finish", n: 18 },
  { label: "E-bike systems", n: 44 },
  { label: "Valuation", n: 58 },
];

export function getPerson(handle: string) {
  return people.find((p) => p.handle === handle);
}

export function getGarage(ownerHandle: string) {
  return garages.find((g) => g.ownerHandle === ownerHandle);
}

export function getQuestion(id: string) {
  const raw = questionsRaw.find((q) => q.id === id);
  return raw ? enrichQuestion(raw) : undefined;
}

export function getItem(id: string) {
  return items.find((i) => i.id === id);
}

export function getItemsByOwner(ownerHandle: string) {
  return items.filter((i) => i.ownerHandle === ownerHandle);
}

export function getMarketListings() {
  return items.filter((i) => MARKET_STATUSES.includes(i.status));
}

export function getWantedByOwner(ownerHandle: string) {
  return wanted.filter((w) => w.ownerHandle === ownerHandle);
}

export function cityFromLoc(loc: string) {
  return loc.split("·")[0]?.trim() ?? loc;
}

export function formatWantedOwner(w: WantedRequest) {
  const owner = getPerson(w.ownerHandle);
  if (!owner) return w.ownerHandle;
  return `${owner.name} · ${cityFromLoc(owner.loc)}`;
}

/** Naive token overlap against item titles — for wanted-board match labels. */
export function getWantedMatchCount(w: WantedRequest) {
  const tokens = w.part
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  if (!tokens.length) return 0;
  return items.filter((item) => {
    const hay = `${item.name} ${item.cat}`.toLowerCase();
    return tokens.filter((t) => hay.includes(t)).length >= 2;
  }).length;
}

export function formatWantedMatches(w: WantedRequest) {
  const n = getWantedMatchCount(w);
  if (n === 0) return "No matches yet";
  return `${n} garage match${n === 1 ? "" : "es"}`;
}

export const featuredGarages = garages
  .filter((g) =>
    ["lugged_marco", "priya_wheels", "campy_tomas"].includes(g.ownerHandle),
  )
  .map((g) => {
    const owner = getPerson(g.ownerHandle)!;
    const owned = getItemsByOwner(g.ownerHandle);
    return {
      name: g.name,
      handle: g.ownerHandle,
      owner: `${owner.name} · ${cityFromLoc(owner.loc)}`,
      init: owner.init,
      bg: owner.bg,
      photo: owned[0]?.name ?? g.name,
      items: owned.length,
      value:
        g.ownerHandle === "lugged_marco"
          ? "$41k"
          : g.ownerHandle === "priya_wheels"
            ? "$18k"
            : "$63k",
      forSale: owned.filter((i) => MARKET_STATUSES.includes(i.status)).length,
    };
  });

export const topicRoutes: Record<string, number> = {
  "Repair & maintenance": 214,
  "Rare / vintage parts": 86,
  "Frame building": 41,
  Wheels: 63,
  Valuation: 58,
};

export const marcoProfile = {
  skills: [
    { name: "Vintage restoration", endorse: 96, pct: 96 },
    { name: "Campagnolo (pre-1990)", endorse: 81, pct: 84 },
    { name: "Valuation & authenticity", endorse: 64, pct: 72 },
    { name: "Paint & decals", endorse: 38, pct: 55 },
    { name: "Wheel truing", endorse: 22, pct: 40 },
  ],
  spokesBreakdown: [
    { label: "Answers marked useful", n: "5,912" },
    { label: "Accepted answers", n: "3,210" },
    { label: "Garage documentation", n: "1,640" },
    { label: "Guides written", n: "980" },
    { label: "Tips from members", n: "738" },
  ],
  badges: [
    { mark: "214", name: "Fix finder" },
    { mark: "SR", name: "Super Record scholar" },
    { mark: "5Y", name: "Five-year member" },
    { mark: "ID", name: "Authenticator" },
    { mark: "LT", name: "Tool lender" },
    { mark: "★", name: "Top reviewed 2026" },
  ],
  answers: [
    { votes: 64, q: "Seized aluminum seatpost in a Columbus SL frame", meta: "Repair · 2h ago", acc: true, id: "seized-seatpost" },
    { votes: 41, q: "How to date a Colnago by its serial number and lug details", meta: "Valuation · 3d ago", acc: true, id: "seized-seatpost" },
    { votes: 27, q: "Is a 1981 Super Record crankset worth re-polishing?", meta: "Restoration · 1w ago", acc: false, id: "seized-seatpost" },
    { votes: 19, q: "Best decal suppliers for Italian frames in 2026", meta: "Paint & finish · 2w ago", acc: true, id: "seized-seatpost" },
  ],
  builds: [
    { name: "1979 Masi Gran Criterium — full resto", steps: 24, meta: "Completed Mar 2026 · 312 followers" },
    { name: "Saronni-red Colnago Super", steps: 17, meta: "Completed 2025 · 488 followers" },
    { name: "De Rosa Professional, barn find", steps: 6, meta: "In progress · 140 followers" },
  ],
  reviews: [
    {
      who: "Ben Carver",
      ctx: "Community answer",
      stars: 5,
      text: "Walked me through a seized seatpost on a frame I was scared to touch. Paint came through untouched.",
    },
    {
      who: "Lena Ortiz",
      ctx: "Video consult",
      stars: 5,
      text: 'Spotted that my "original" Super Record derailleur was a later replacement in about ten seconds. Saved me from overpaying.',
    },
    {
      who: "Sam Whitfield",
      ctx: "Tool loan",
      stars: 5,
      text: "Lent me his facing tool for a weekend and checked in to see how it went. This is what the community should be.",
    },
  ],
  services: [
    { kind: "Open to questions", detail: "Usually replies within 2 hours" },
    { kind: "Video consult", detail: "$40 / 30 min" },
    { kind: "Tool lending", detail: "Bay Area, local pickup" },
    { kind: "Full restoration", detail: "2–3 projects / year" },
  ],
};

export const itemDetail = {
  specs: [
    { k: "Frame", v: "Colnago Super" },
    { k: "Year", v: "1984 (serial-dated)" },
    { k: "Tubing", v: "Columbus SL" },
    { k: "Lugs", v: "Long-point, pantographed" },
    { k: "Size", v: "56 cm c-t-c / 56 cm TT" },
    { k: "Paint", v: "Saronni red, original" },
    { k: "Groupset", v: "Campagnolo Super Record" },
    { k: "Wheels", v: "Mavic GP4 / Record hubs" },
    { k: "Bars / stem", v: "Cinelli 64 / 1A" },
    { k: "Weight", v: "9.4 kg as pictured" },
    { k: "Condition", v: "Excellent · 2 touch-ups" },
    { k: "Originality", v: "90% · verified by 3 members" },
  ],
  history: [
    { y: "1984", t: "Sold new at a shop in Concord, CA" },
    { y: "1984–2009", t: "Original owner; ridden in Diablo Valley club events" },
    { y: "2011", t: "Acquired by Marco from the owner’s son" },
    { y: "2024", t: "Full overhaul; documented in build log (17 entries)" },
  ],
  /** Same-model cards — ids point at real items in `items`. */
  others: [
    { itemId: "colnago-super-1983" },
    { itemId: "colnago-super-1985-saronni" },
    { itemId: "colnago-super-frameset-1984" },
  ],
  guides: [
    { kind: "GDE", t: "Dating Colnago frames by serial & lug details", by: "Guide by Marco Reyes · 4.9 ★" },
    { kind: "GDE", t: "Super Record service & regrease, step by step", by: "Guide by Jen Whitlock · 312 saves" },
    { kind: "REF", t: "Saronni red paint codes & decal sets", by: "Reference · community maintained" },
    { kind: "Q&A", t: "9 threads mention this bike or model", by: "Latest: 2 days ago" },
  ],
  parts: [
    { itemId: "sr-cage-1st-gen" },
    { itemId: "cinelli-1a-100" },
    { n: "Colnago Super head badge", w: "Nate's garage · trade only", p: "Trade" },
    { n: "Clement Criterium Seta tubular", w: "Resource: sourcing guide", p: "—" },
  ],
  experts: [
    { n: "Tomás Lindqvist", handle: "campy_tomas", i: "TL", bg: "#0E7490", why: "Owns 2 · Campagnolo archive" },
    { n: "Jen Whitlock", handle: "jen_whitlock", i: "JW", bg: "#3F6B5C", why: "Wrote the Super Record service guide" },
    { n: "Dale Okafor", handle: "dale_frames", i: "DO", bg: "#6D28D9", why: "Frame repair & alignment" },
  ],
  photoLabels: ["Drive side", "Lug detail", "Head badge", "Super Record rear", "Serial stamp", "Cockpit"],
  trendBars: {
    "1Y": { l: ["N", "D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O"], v: [70, 71, 72, 72, 74, 76, 78, 79, 80, 82, 84, 86], t: "+11% past year" },
    "5Y": { l: ["22", "", "23", "", "24", "", "25", "", "26", ""], v: [52, 55, 58, 60, 63, 68, 72, 77, 82, 86], t: "+38% past 5 years" },
    All: { l: ["10", "12", "14", "16", "18", "20", "22", "24", "26", ""], v: [30, 32, 35, 38, 41, 48, 55, 66, 80, 86], t: "+180% since 2010" },
  },
};

export function resolveSameModelCards() {
  return itemDetail.others
    .map(({ itemId }) => {
      const item = getItem(itemId);
      const owner = item ? getPerson(item.ownerHandle) : undefined;
      if (!item || !owner) return null;
      const statusLabel =
        item.status === "For sale" && item.ask !== "—"
          ? `${item.status} · ${item.ask}`
          : item.status;
      const color =
        item.status === "For sale"
          ? "#527D31"
          : item.status === "Open to offers"
            ? "#1E40AF"
            : "#4A4F57";
      return {
        id: item.id,
        name: item.name,
        owner: `${owner.name} · ${cityFromLoc(owner.loc)}`,
        status: statusLabel,
        color,
      };
    })
    .filter(Boolean);
}

export function resolveCompatibleParts() {
  return itemDetail.parts.map((p) => {
    if ("itemId" in p && p.itemId) {
      const item = getItem(p.itemId);
      const owner = item ? getPerson(item.ownerHandle) : undefined;
      const garage = item ? getGarage(item.ownerHandle) : undefined;
      if (item && owner) {
        return {
          n: item.name,
          w: `${garage?.name ?? owner.name} · ${item.status.toLowerCase()}`,
          p: item.ask,
        };
      }
    }
    return p as { n: string; w: string; p: string };
  });
}

/** Experts directory — verified members only (excludes casual members). */
export function getExperts() {
  return people.filter((p) => p.verified);
}
