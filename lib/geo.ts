// Best-effort: mapea el campo "location" (texto libre) del perfil de GitHub
// a una bandera + nombre de país. No es exhaustivo, cubre países comunes (en
// inglés/español), códigos ISO2 sueltos, algunas ciudades, y el caso donde
// GitHub ya devuelve directamente el emoji de bandera como location.

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
  BR: "Brasil",
  CL: "Chile",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  PE: "Perú",
  CO: "Colombia",
  VE: "Venezuela",
  EC: "Ecuador",
  MX: "México",
  US: "Estados Unidos",
  CA: "Canadá",
  ES: "España",
  PT: "Portugal",
  FR: "Francia",
  DE: "Alemania",
  IT: "Italia",
  GB: "Reino Unido",
  IE: "Irlanda",
  NL: "Países Bajos",
  BE: "Bélgica",
  CH: "Suiza",
  AT: "Austria",
  PL: "Polonia",
  SE: "Suecia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlandia",
  RU: "Rusia",
  UA: "Ucrania",
  CN: "China",
  JP: "Japón",
  KR: "Corea del Sur",
  IN: "India",
  PK: "Pakistán",
  BD: "Bangladesh",
  ID: "Indonesia",
  VN: "Vietnam",
  TH: "Tailandia",
  SG: "Singapur",
  MY: "Malasia",
  PH: "Filipinas",
  AU: "Australia",
  NZ: "Nueva Zelanda",
  IL: "Israel",
  TR: "Turquía",
  EG: "Egipto",
  ZA: "Sudáfrica",
  NG: "Nigeria",
  KE: "Kenia",
  MA: "Marruecos",
  CZ: "República Checa",
  GR: "Grecia",
  RO: "Rumania",
  HU: "Hungría",
  CU: "Cuba",
  CR: "Costa Rica",
  PA: "Panamá",
  SV: "El Salvador",
  HN: "Honduras",
  NI: "Nicaragua",
  GT: "Guatemala",
  DO: "República Dominicana",
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
  "new york": "US",
  "san francisco": "US",
  seattle: "US",
  austin: "US",
  chicago: "US",
  boston: "US",
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

function isoToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Un emoji de bandera son dos "regional indicator symbols" (U+1F1E6-U+1F1FF).
// Si el location ya viene como emoji (como pasa seguido en GitHub), lo
// leemos directamente en vez de intentar matchear texto.
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

function isoFromFreeText(text: string): string | null {
  const normalized = text.toLowerCase().trim();

  // Código ISO2 suelto ("AR", "US") como token exacto, no substring, para
  // evitar falsos positivos con palabras cortas.
  const bareIso = text.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(bareIso) && ISO2_TO_NAME[bareIso]) return bareIso;

  for (const [name, iso] of Object.entries(COUNTRY_TO_ISO)) {
    if (normalized.includes(name)) return iso;
  }
  for (const [city, iso] of Object.entries(CITY_TO_ISO)) {
    if (normalized.includes(city)) return iso;
  }
  return null;
}

export interface Nationality {
  flag: string;
  countryName: string | null;
}

export function resolveNationality(location: string | null): Nationality {
  if (!location) return { flag: "🌐", countryName: null };

  const isoFromFlag = flagEmojiToIso(location);
  if (isoFromFlag && ISO2_TO_NAME[isoFromFlag]) {
    return { flag: isoToFlagEmoji(isoFromFlag), countryName: ISO2_TO_NAME[isoFromFlag] };
  }

  const iso = isoFromFreeText(location);
  if (iso) {
    return { flag: isoToFlagEmoji(iso), countryName: ISO2_TO_NAME[iso] ?? null };
  }

  return { flag: "🌐", countryName: null };
}

export function locationToFlag(location: string | null): string {
  return resolveNationality(location).flag;
}

// Texto a mostrar como "lugar de nacimiento": si el location del perfil es
// directamente un emoji de bandera (sin texto), mostramos el nombre del país
// en vez del emoji suelto o un código ISO.
export function resolveBirthPlace(location: string | null): string {
  if (!location) return "Localhost";

  const withoutFlag = location.replace(FLAG_EMOJI_RE, "").trim();
  if (withoutFlag.length === 0) {
    const nationality = resolveNationality(location);
    return nationality.countryName ?? location;
  }

  return location;
}
