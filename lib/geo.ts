// Best-effort: maps the GitHub profile's free-text "location" field to a
// flag + country name. Not exhaustive — covers common countries (English/
// Spanish spellings), loose ISO2 codes, some cities, US "City, ST" format,
// and the case where GitHub already returns the flag emoji directly as the
// location.

const COUNTRY_TO_ISO: Record<string, string> = {
  argentina: "AR",
  brasil: "BR",
  brazil: "BR",
  chile: "CL",
  uruguay: "UY",
  paraguay: "PY",
  bolivia: "BO",
  peru: "PE",
  perú: "PE",
  colombia: "CO",
  venezuela: "VE",
  ecuador: "EC",
  mexico: "MX",
  méxico: "MX",
  "estados unidos": "US",
  "united states": "US",
  usa: "US",
  canada: "CA",
  canadá: "CA",
  spain: "ES",
  españa: "ES",
  portugal: "PT",
  france: "FR",
  francia: "FR",
  germany: "DE",
  alemania: "DE",
  italy: "IT",
  italia: "IT",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  ireland: "IE",
  netherlands: "NL",
  holanda: "NL",
  belgium: "BE",
  bélgica: "BE",
  switzerland: "CH",
  suiza: "CH",
  austria: "AT",
  poland: "PL",
  polonia: "PL",
  sweden: "SE",
  suecia: "SE",
  norway: "NO",
  noruega: "NO",
  denmark: "DK",
  dinamarca: "DK",
  finland: "FI",
  finlandia: "FI",
  russia: "RU",
  rusia: "RU",
  ukraine: "UA",
  ucrania: "UA",
  china: "CN",
  japan: "JP",
  japón: "JP",
  "south korea": "KR",
  "corea del sur": "KR",
  india: "IN",
  pakistan: "PK",
  bangladesh: "BD",
  indonesia: "ID",
  vietnam: "VN",
  thailand: "TH",
  singapore: "SG",
  singapur: "SG",
  malaysia: "MY",
  philippines: "PH",
  filipinas: "PH",
  australia: "AU",
  "new zealand": "NZ",
  "nueva zelanda": "NZ",
  israel: "IL",
  turkey: "TR",
  turquía: "TR",
  egypt: "EG",
  egipto: "EG",
  "south africa": "ZA",
  sudáfrica: "ZA",
  nigeria: "NG",
  kenya: "KE",
  morocco: "MA",
  marruecos: "MA",
  "czech republic": "CZ",
  "república checa": "CZ",
  greece: "GR",
  grecia: "GR",
  romania: "RO",
  rumania: "RO",
  hungary: "HU",
  hungría: "HU",
  cuba: "CU",
  "costa rica": "CR",
  panama: "PA",
  panamá: "PA",
  "el salvador": "SV",
  honduras: "HN",
  nicaragua: "NI",
  guatemala: "GT",
  "republica dominicana": "DO",
  "dominican republic": "DO",
};

const ISO2_TO_NAME: Record<string, string> = {
  AR: "Argentina",
  BR: "Brazil",
  CL: "Chile",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  PE: "Peru",
  CO: "Colombia",
  VE: "Venezuela",
  EC: "Ecuador",
  MX: "Mexico",
  US: "United States",
  CA: "Canada",
  ES: "Spain",
  PT: "Portugal",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  GB: "United Kingdom",
  IE: "Ireland",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  RU: "Russia",
  UA: "Ukraine",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  ID: "Indonesia",
  VN: "Vietnam",
  TH: "Thailand",
  SG: "Singapore",
  MY: "Malaysia",
  PH: "Philippines",
  AU: "Australia",
  NZ: "New Zealand",
  IL: "Israel",
  TR: "Turkey",
  EG: "Egypt",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  MA: "Morocco",
  CZ: "Czech Republic",
  GR: "Greece",
  RO: "Romania",
  HU: "Hungary",
  CU: "Cuba",
  CR: "Costa Rica",
  PA: "Panama",
  SV: "El Salvador",
  HN: "Honduras",
  NI: "Nicaragua",
  GT: "Guatemala",
  DO: "Dominican Republic",
};

const CITY_TO_ISO: Record<string, string> = {
  "buenos aires": "AR",
  córdoba: "AR",
  cordoba: "AR",
  rosario: "AR",
  mendoza: "AR",
  chaco: "AR",
  "são paulo": "BR",
  "sao paulo": "BR",
  "rio de janeiro": "BR",
  santiago: "CL",
  montevideo: "UY",
  asunción: "PY",
  "la paz": "BO",
  lima: "PE",
  bogotá: "CO",
  bogota: "CO",
  caracas: "VE",
  quito: "EC",
  "ciudad de mexico": "MX",
  "ciudad de méxico": "MX",
  "mexico city": "MX",
  guadalajara: "MX",
  monterrey: "MX",
  madrid: "ES",
  barcelona: "ES",
  lisboa: "PT",
  lisbon: "PT",
  paris: "FR",
  berlin: "DE",
  münchen: "DE",
  munich: "DE",
  rome: "IT",
  roma: "IT",
  london: "GB",
  londres: "GB",
  dublin: "IE",
  amsterdam: "NL",
  toronto: "CA",
  vancouver: "CA",
  moscow: "RU",
  moscú: "RU",
  kyiv: "UA",
  kiev: "UA",
  beijing: "CN",
  shanghai: "CN",
  tokyo: "JP",
  tokio: "JP",
  seoul: "KR",
  bangalore: "IN",
  mumbai: "IN",
  "new delhi": "IN",
  sydney: "AU",
  melbourne: "AU",
  "tel aviv": "IL",
  istanbul: "TR",
  cairo: "EG",
  "el cairo": "EG",
  "cape town": "ZA",
  johannesburg: "ZA",
};

// Top ~50 US tech-hub cities. Used both as bare city names and to recognize
// the common GitHub "City, ST" location format (e.g. "Portland, OR").
const US_TECH_CITIES = new Set([
  "new york",
  "san francisco",
  "san jose",
  "oakland",
  "seattle",
  "austin",
  "chicago",
  "boston",
  "cambridge",
  "los angeles",
  "san diego",
  "denver",
  "boulder",
  "portland",
  "atlanta",
  "dallas",
  "houston",
  "washington",
  "washington dc",
  "philadelphia",
  "miami",
  "phoenix",
  "raleigh",
  "durham",
  "charlotte",
  "nashville",
  "minneapolis",
  "detroit",
  "pittsburgh",
  "columbus",
  "salt lake city",
  "las vegas",
  "sacramento",
  "san antonio",
  "orlando",
  "tampa",
  "kansas city",
  "st louis",
  "indianapolis",
  "milwaukee",
  "cincinnati",
  "baltimore",
  "richmond",
  "new orleans",
  "albuquerque",
  "tucson",
  "bellevue",
  "redmond",
  "irvine",
  "santa clara",
  "mountain view",
  "palo alto",
  "menlo park",
  "sunnyvale",
  "berkeley",
  "brooklyn",
  "jersey city",
]);

const US_STATE_ABBREVIATIONS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]);

function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// A flag emoji is two "regional indicator symbols" (U+1F1E6-U+1F1FF). If the
// location already comes as an emoji (common on GitHub), read it directly
// instead of trying to match text.
const FLAG_EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/u;

function flagEmojiToIso(flag: string): string | null {
  const match = flag.match(FLAG_EMOJI_RE);
  if (!match) return null;
  const chars = [...match[0]];
  if (chars.length !== 2) return null;
  return chars
    .map((c) => String.fromCharCode(c.codePointAt(0)! - 127397))
    .join("");
}

// Recognizes the common US "City, ST" format (e.g. "Portland, OR").
function isoFromUsCityState(text: string): string | null {
  const match = text.match(/^\s*([a-zA-Z .]+?)\s*,\s*([a-zA-Z]{2})\s*$/);
  if (!match) return null;
  const state = match[2].toUpperCase();
  if (US_STATE_ABBREVIATIONS.has(state)) return "US";
  return null;
}

function isoFromFreeText(text: string): string | null {
  const normalized = text.toLowerCase().trim();

  const usFromCityState = isoFromUsCityState(text);
  if (usFromCityState) return usFromCityState;

  // Bare ISO2 code ("AR", "US") as an exact token, not a substring, to avoid
  // false positives with short words.
  const bareIso = text.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(bareIso) && ISO2_TO_NAME[bareIso]) return bareIso;

  for (const [name, iso] of Object.entries(COUNTRY_TO_ISO)) {
    if (normalized.includes(name)) return iso;
  }
  for (const [city, iso] of Object.entries(CITY_TO_ISO)) {
    if (normalized.includes(city)) return iso;
  }
  for (const city of US_TECH_CITIES) {
    if (normalized.includes(city)) return "US";
  }
  return null;
}

export interface Nationality {
  flag: string;
  countryName: string | null;
}

export function resolveNationality(location: string | null): Nationality {
  if (!location) return { flag: "🌍", countryName: "Unknown" };

  const isoFromFlag = flagEmojiToIso(location);
  if (isoFromFlag && ISO2_TO_NAME[isoFromFlag]) {
    return { flag: isoToFlagEmoji(isoFromFlag), countryName: ISO2_TO_NAME[isoFromFlag] };
  }

  const iso = isoFromFreeText(location);
  if (iso) {
    return { flag: isoToFlagEmoji(iso), countryName: ISO2_TO_NAME[iso] ?? "Unknown" };
  }

  return { flag: "🌍", countryName: "Unknown" };
}

export function locationToFlag(location: string | null): string {
  return resolveNationality(location).flag;
}

// Text shown as "place of birth": if the profile's location is directly a
// flag emoji with no text, show the country name instead of the bare emoji
// or an ISO code.
export function resolveBirthPlace(location: string | null): string {
  if (!location) return "Localhost";

  const withoutFlag = location.replace(FLAG_EMOJI_RE, "").trim();
  if (withoutFlag.length === 0) {
    const nationality = resolveNationality(location);
    return nationality.countryName ?? location;
  }

  return location;
}
