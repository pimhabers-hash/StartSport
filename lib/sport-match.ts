export type Sport = { id: string; naam: string; slug: string };

function escapeRegex(tekst: string): string {
  return tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bevatAlsWoord(tekst: string, woord: string): boolean {
  if (!woord) return false;
  const patroon = new RegExp(`\\b${escapeRegex(woord)}s?\\b`, "i");
  return patroon.test(tekst);
}

// Zelfde probleem als bij CATEGORIE_TREFWOORDEN in lib/feed-import.ts:
// Nederlandse productnamen plakken een sportnaam vaak vast aan het
// erop volgende woord ("Handbalsokken", "Voetbalschoen") zonder spatie,
// waardoor het sport-trefwoord zelf er geen eigen woordgrens heeft en
// bevatAlsWoord() het mist — een "Handbalsokken"-product werd zo nooit
// als Handbal herkend en viel terug op een andere, minder passende
// sport. Zelfde voorvoegsellijst als in feed-import.ts, hier apart
// gehouden i.p.v. geïmporteerd om deze twee losstaande matchers
// (sport vs. categorie) niet aan elkaar te koppelen.
const SPORT_VOORVOEGSELS = [
  "padel", "tennis", "voetbal", "volleybal", "hockey", "hardloop", "fitness", "pickleball", "basketbal", "golf", "boks", "kickboks", "thaiboks",
  "zwem", "fiets", "badminton", "tafeltennis", "handbal", "klim", "duik", "skateboard", "trampoline", "surf", "paardrijd",
];

function loskoppelSportVoorvoegsel(tekst: string): string {
  let resultaat = tekst;
  for (const voorvoegsel of SPORT_VOORVOEGSELS) {
    resultaat = resultaat.replace(new RegExp(`\\b(${voorvoegsel})([a-z])`, "gi"), "$1 $2");
  }
  return resultaat;
}

/**
 * Trefwoorden per sport-slug (Engels/Nederlands/Duits/Spaans, feeds zijn
 * internationaal) — zelfde aanpak als CATEGORIE_TREFWOORDEN in
 * lib/feed-import.ts. Nodig omdat productnamen in universele feeds
 * (bijv. Sportsprofi) zelden letterlijk "padel" of "hardlopen" bevatten,
 * maar vaak wel een herkenbaar los woord als "running", "voetbalschoen"
 * of "yoga". Handmatig onderhouden lijst, alleen voor sporten die we nu
 * kennen — een nieuwe, nog niet hierin opgenomen sport valt terug op de
 * directe naam/slug-match hieronder.
 */
const SPORT_TREFWOORDEN: Record<string, string[]> = {
  padel:      ["padel"],
  tennis:     ["tennis"],
  pickleball: ["pickleball", "pickle ball"],
  hardlopen:  ["hardlopen", "hardloop", "running", "run", "jogging", "trailrunning", "trail running", "marathon", "atletiek", "triathlon", "swimrun"],
  fitness:    ["fitness", "gym", "yoga", "dumbbell", "kettlebell", "crossfit", "workout", "krachttraining", "pilates", "crosstraining"],
  volleybal:  ["volleybal", "volleyball", "beachvolley"],
  voetbal:    ["voetbal", "football", "soccer", "voetbalschoen", "zaalvoetbal"],
  wandelen:   ["wandelen", "wandel", "hiking", "hike", "trekking", "nordic walking", "walking pole"],
  wintersport: ["wintersport", "ski", "skiën", "snowboard", "ski touring", "skitour", "schaatsen", "schaatswinkel", "ijshockey"],
  golf:       ["golf", "golfstok", "golfstokken", "golfbal", "golfballen", "golftas", "golftassen"],
  hockey:     ["hockey", "hockeystick", "veldhockey"],
  zwemmen:    ["zwemmen", "zwemkleding", "aquagym", "openwaterzwemmen"],
  fietsen:    ["wielrennen", "fietsen", "mountainbike", "mountainbiken", "racefiets", "stadsfiets", "stadsfietsen", "kinderfiets", "fietsaccessoire", "fietsaccessoires"],
  basketbal:  ["basketbal", "basketball"],
  zeilen:     ["zeilen", "zeilboot", "sailing"],
  badminton:  ["badminton"],
  turnen:     ["turnen", "gymnastiek", "gymnastics"],
  tafeltennis: ["tafeltennis", "pingpong", "ping pong", "table tennis"],
  handbal:    ["handbal", "handball"],
  klimmen:    ["klimmen", "boulderen", "klimmen en boulderen", "climbing", "bouldering"],
  duiken:     ["duiken", "snorkelen", "freediving", "canyoning"],
  suppen:     ["stand up paddle", "suppen", "supboard", "sup"],
  skateboarden: ["skateboarden", "skateboard", "skeeleren"],
  trampolinespringen: ["trampoline", "trampolinespringen"],
  surfen:     ["surfen", "surfplank", "kitesurfen", "windsurfen", "wakeboarden", "wing foilen", "surfing"],
  paardrijden: ["paardrijden", "ruitersport", "paardensport", "equestrian"],
  // Losse woorden ("boksen", "kickboksen") én de meestvoorkomende
  // samengestelde productnamen expliciet — in het Nederlands plakken die
  // vast aan elkaar ("bokshandschoenen", "boksschoenen"), waardoor het
  // woord "boks" er middenin geen eigen woordgrens heeft en dus niet zou
  // matchen via het gewone \bwoord\b-patroon.
  boksen: [
    "boksen", "kickboksen", "thaiboksen", "boks", "kickboks", "thaiboks",
    "boksbroek", "boksbroeken", "kickboksbroek", "thaiboksbroek",
    "boksershandschoenen", "bokshandschoenen", "kickbokshandschoenen",
    "thaibokshandschoenen", "kinderbokshandschoenen", "minibokshandschoenen",
    "bokstrainingshandschoenen", "boksersweater", "bokshelm",
    "boksschoenen", "kickboksschoenen", "multiboksschoenen",
    "boksschopbroek", "boksshorts", "thaiboksshort", "thaiboksshorts",
    "bokstraining", "bokszak",
  ],
};

/**
 * Probeert een sport te herkennen in vrije tekst (bijv. productnaam +
 * ruwe feed-categorie) — voor universele feeds/imports zonder vaste
 * sport_id. Checkt eerst het trefwoorden-woordenboek (herkent bijv. een
 * "running shoe" als Hardlopen, ook zonder dat "hardlopen" letterlijk in
 * de tekst staat), en valt daarna terug op een directe match van de
 * sportnaam/-slug zelf — zo werkt het ook voor sporten die nog niet in
 * de trefwoordenlijst staan. Bij de directe match wint de langste
 * sportnaam eerst, zodat een specifiekere naam (bijv. "beachvolleybal")
 * voorrang krijgt boven een kortere naam die er toevallig ook in
 * voorkomt (bijv. "volleybal").
 */
export function matchSport(tekst: string, sporten: Sport[]): string | null {
  if (!tekst) return null;

  // Zowel de originele tekst als de voorvoegsel-losgeknipte variant
  // proberen (zie loskoppelSportVoorvoegsel hierboven) — anders mist een
  // aaneengeschreven productnaam als "Handbalsokken" het sport-trefwoord
  // "handbal" volledig, omdat dat er middenin geen eigen woordgrens heeft.
  const kandidaten = [tekst, loskoppelSportVoorvoegsel(tekst)];

  for (const kandidaat of kandidaten) {
    for (const sport of sporten) {
      const trefwoorden = SPORT_TREFWOORDEN[sport.slug];
      if (!trefwoorden) continue;
      if (trefwoorden.some((woord) => bevatAlsWoord(kandidaat, woord))) {
        return sport.id;
      }
    }

    const gesorteerdeSporten = [...sporten].sort((a, b) => b.naam.length - a.naam.length);
    for (const sport of gesorteerdeSporten) {
      const slugAlsTekst = sport.slug.replace(/-/g, " ");
      if (bevatAlsWoord(kandidaat, sport.naam) || bevatAlsWoord(kandidaat, slugAlsTekst)) {
        return sport.id;
      }
    }
  }

  return null;
}
