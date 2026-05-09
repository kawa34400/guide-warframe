// Manual French translations for Nightwave challenge titles, since the
// warframestat /nightwave endpoint returns titles only in English regardless
// of the language query param. Falls back to the original title if missing.
const FR: Record<string, string> = {
  // Daily
  "Trampoline": "Trampoline",
  "Two For One": "Deux pour un",
  "Warning Shot": "Coup de semonce",
  "Friendly Fire": "Tir ami",
  "Show Off": "Frimeur",
  "Shy Guns": "Discret",
  "Make Friends with Nature": "Faire ami avec la nature",
  "Solo Survivalist": "Survivaliste solo",

  // Weekly
  "Synthesist": "Synthétiseur",
  "Eximus Executioner": "Bourreau Eximus",
  "Mod Master": "Maître des Mods",
  "Survivor": "Survivant",
  "Endurance Running": "Course d'endurance",
  "Energy Recharge": "Recharge d'énergie",
  "Sortie Specialist": "Spécialiste des Sorties",
  "Recombobulator": "Recombobulateur",
  "Conservation Volunteer": "Volontaire en conservation",
  "Hot 'n' Cold": "Chaud et froid",
  "Polarization Domination": "Domination de polarisation",
  "Visit a Cetus Lake": "Visiter un lac de Cetus",
  "Speedrunner": "Coureur de vitesse",
  "Squad Goals": "Objectifs d'escouade",
  "Eximus Brawler": "Bagarreur Eximus",
  "Quick on Your Feet": "Rapide sur ses pieds",
  "Wave Cleanup": "Nettoyage de vague",

  // Elite weekly
  "Steel Path Specialist": "Spécialiste Voie d'Acier",
  "Steel Path Mission": "Mission Voie d'Acier",
  "Steel Path Elite": "Élite Voie d'Acier",
  "Treasure Hunter": "Chasseur de trésors",
  "Genocide": "Génocide",
  "Saviour of the Sky": "Sauveur du ciel",
  "Trial by Fire": "Épreuve du feu",
  "The Profit-Taker": "Le Profit-Taker",
  "Eidolon Annihilator": "Annihilateur Eidolon",
  "Spelunker": "Spéléologue",
};

export function nightwaveFr(title: string): string {
  return FR[title] ?? title;
}
