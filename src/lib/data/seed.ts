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
  items: number;
  reply: string;
  bio: string;
  skills: string[];
  consult: string;
  verified: boolean;
  memberSince: string;
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
  answers: number;
  solved: boolean;
  expert: string;
  linked: string;
  views?: number;
  following?: number;
  bounty?: number;
};

export type GarageItem = {
  id: string;
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

export const people: Person[] = [
  {
    handle: "lugged_marco",
    name: "Marco Reyes",
    init: "MR",
    bg: "#9A3412",
    role: "Vintage steel restorer · Oakland",
    loc: "Oakland, CA · 31 mi",
    level: "MASTER",
    rating: "4.9",
    reviews: 128,
    spokes: "12.4k",
    spokesNum: 12480,
    accepted: 214,
    items: 34,
    reply: "within 2 hrs",
    bio: "Restoring lugged Italian steel since 1998. Specializes in Colnago, De Rosa and Masi from the 70s–80s. I answer questions for free, lend tools locally, and do a handful of full restorations a year.",
    skills: ["Vintage restoration", "Valuation", "Italian steel"],
    consult: "$40 / 30 min",
    verified: true,
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
    items: 19,
    reply: "within 1 hr",
    bio: "Former race mechanic. Di2, AXS and EPS troubleshooting, plus brake bleeds that actually stay bled.",
    skills: ["Electronic shifting", "Hydraulic brakes", "Valuation"],
    consult: "$35 / 30 min",
    verified: true,
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
    items: 58,
    reply: "within 4 hrs",
    bio: "Hand-built over 1,500 wheels. Ask me about spoke math, rim choice and why your wheel keeps going out of true.",
    skills: ["Wheelbuilding", "Tubeless", "Hub service"],
    consult: "",
    verified: true,
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
    items: 22,
    reply: "within 1 day",
    bio: "Custom steel frames, TIG and fillet-brazed. Happy to review geometry before you commit to a build.",
    skills: ["Frame building", "Brazing", "Geometry"],
    consult: "$60 / 45 min",
    verified: true,
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
    items: 112,
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
    items: 15,
    reply: "within 3 hrs",
    bio: "Fork and shock rebuilds, spring rates and tuning for real trails. Fox, RockShox, Öhlins.",
    skills: ["Suspension", "Bike fit", "MTB setup"],
    consult: "$30 / 30 min",
    verified: true,
    memberSince: "2022",
  },
];

export const questions: Question[] = [
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
    answers: 7,
    solved: true,
    expert: "Marco Reyes",
    linked: "",
    views: 1204,
    following: 38,
    bounty: 50,
  },
  {
    id: "super-record-cage",
    votes: 31,
    tags: ["rare-parts", "campagnolo"],
    title: "Who has a 1st-gen Super Record rear derailleur cage (pre-1983 stamping)?",
    excerpt:
      "Restoring a ’82 Bianchi Specialissima. Mine is bent past saving. Happy to trade or buy.",
    asker: "Lena Ortiz",
    init: "LO",
    bg: "#BE185D",
    time: "6h ago",
    answers: 4,
    solved: false,
    expert: "",
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
    init: "SW",
    bg: "#0F766E",
    time: "1d ago",
    answers: 12,
    solved: true,
    expert: "Dale Okafor",
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
    init: "RF",
    bg: "#A16207",
    time: "1d ago",
    answers: 5,
    solved: false,
    expert: "",
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
    init: "KD",
    bg: "#4338CA",
    time: "2d ago",
    answers: 3,
    solved: true,
    expert: "Priya Natarajan",
    linked: "",
  },
];

export const leaders = [
  { rank: 1, name: "Jen Whitlock", handle: "jen_whitlock", init: "JW", bg: "#3F6B5C", role: "Pro mechanic", gain: "1,420" },
  { rank: 2, name: "Marco Reyes", handle: "lugged_marco", init: "MR", bg: "#9A3412", role: "Vintage restorer", gain: "1,186" },
  { rank: 3, name: "Priya Natarajan", handle: "priya_wheels", init: "PN", bg: "#1E40AF", role: "Wheelbuilder", gain: "904" },
  { rank: 4, name: "Tomás Lindqvist", handle: "campy_tomas", init: "TL", bg: "#0E7490", role: "Campagnolo collector", gain: "611" },
  { rank: 5, name: "Kai Yamamoto", handle: "kai_suspension", init: "KY", bg: "#B45309", role: "Suspension tuner", gain: "532" },
];

export const wanted = [
  { part: "Cinelli 1A stem, 110 mm, 26.4 clamp", who: "Lena O. · Berkeley", matches: "2 garage matches" },
  { part: "Shimano Dura-Ace 7400 8-speed shifters", who: "Ari P. · Palo Alto", matches: "5 garage matches" },
  { part: "Ritchey Logic headset, 1\" threaded", who: "Nate G. · Oakland", matches: "No matches yet" },
  { part: "Brooks Team Pro saddle, copper rails", who: "Rob F. · San Jose", matches: "1 garage match" },
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

export const featuredGarages = [
  {
    name: "Lugged & Loved",
    handle: "lugged_marco",
    owner: "Marco Reyes · Oakland",
    init: "MR",
    bg: "#9A3412",
    photo: "Colnago Super, workshop wall",
    items: 34,
    value: "$41k",
    forSale: 6,
  },
  {
    name: "The Wheel Room",
    handle: "priya_wheels",
    owner: "Priya Natarajan · San Jose",
    init: "PN",
    bg: "#1E40AF",
    photo: "Hub & rim shelves",
    items: 58,
    value: "$18k",
    forSale: 14,
  },
  {
    name: "Campy Archive",
    handle: "campy_tomas",
    owner: "Tomás Lindqvist · Berkeley",
    init: "TL",
    bg: "#0E7490",
    photo: "Groupset display case",
    items: 112,
    value: "$63k",
    forSale: 9,
  },
];

export const garageItems: GarageItem[] = [
  {
    id: "colnago-super-1984",
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
];

export const topicRoutes: Record<string, number> = {
  "Repair & maintenance": 214,
  "Rare / vintage parts": 86,
  "Frame building": 41,
  Wheels: 63,
  Valuation: 58,
};

export function getPerson(handle: string) {
  return people.find((p) => p.handle === handle);
}

export function getQuestion(id: string) {
  return questions.find((q) => q.id === id);
}

export function getItem(id: string) {
  return garageItems.find((i) => i.id === id);
}

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
  others: [
    { name: "1983 Colnago Super, blue", owner: "Tomás Lindqvist · Berkeley", status: "Not for sale", color: "#4A4F57" },
    { name: "1985 Colnago Super, Saronni", owner: "Ari Patel · Palo Alto", status: "For sale · $2,650", color: "#C2410C" },
    { name: "1984 Colnago Super frameset", owner: "Nate Gomez · Oakland", status: "Open to offers", color: "#1E40AF" },
  ],
  guides: [
    { kind: "GDE", t: "Dating Colnago frames by serial & lug details", by: "Guide by Marco Reyes · 4.9 ★" },
    { kind: "GDE", t: "Super Record service & regrease, step by step", by: "Guide by Jen Whitlock · 312 saves" },
    { kind: "REF", t: "Saronni red paint codes & decal sets", by: "Reference · community maintained" },
    { kind: "Q&A", t: "9 threads mention this bike or model", by: "Latest: 2 days ago" },
  ],
  parts: [
    { n: "Super Record rear derailleur cage", w: "Tomás's garage · open to offers", p: "$65" },
    { n: "Cinelli 1A stem, 100 mm", w: "Priya's garage · for sale", p: "$110" },
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

export const questionAnswers = [
  {
    name: "Marco Reyes",
    handle: "lugged_marco",
    init: "MR",
    bg: "#9A3412",
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
];
