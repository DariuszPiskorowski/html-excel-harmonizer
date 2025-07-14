
import { ParsedGroup } from "@/types/ParsedGroup";
import { parseDtcMaskGroups, parsePCodeGroups } from "./dtcParser";

export const parseHtmlContent = (htmlContent: string): ParsedGroup[] => {
  console.log("=== STARTING HTML PARSING ===");
  console.log("Original HTML length:", htmlContent.length);
  
  // Zamień &nbsp; na spacje, usuń HTML tagi i usuń tekst "Information (x):" i "Primary events(x):"
  const textContent = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\+\s*Information\s*\(\d+\)\s*:\s*/g, ' ') // Usuń "Information (x):"
    .replace(/Primary\s+events\s*\(\d+\)\s*:\s*/g, ' ') // Usuń "Primary events(x):"
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Processed text length:", textContent.length);
  
  // SZCZEGÓŁOWE DEBUGOWANIE - dlaczego regex nie łapie wszystkich DTC_MASK
  console.log("=== ANALYZING DTC_MASK PARSING ISSUE ===");
  
  // Sprawdź wszystkie pozycje DTC_MASK w tekście
  const dtcPositions = [];
  let searchStart = 0;
  while (true) {
    const pos = textContent.indexOf("DTC_MASK", searchStart);
    if (pos === -1) break;
    dtcPositions.push(pos);
    searchStart = pos + 1;
  }
  
  console.log(`All DTC_MASK positions:`, dtcPositions);
  console.log(`Total found: ${dtcPositions.length}`);
  
  // Pokaż kontekst dla pierwszych 3 DTC_MASK żeby zobaczyć co przeszkadza w parsowaniu
  dtcPositions.slice(0, 3).forEach((pos, index) => {
    const contextStart = Math.max(0, pos - 100);
    const contextEnd = Math.min(textContent.length, pos + 250);
    const context = textContent.substring(contextStart, contextEnd);
    console.log(`DTC_MASK ${index + 1} EXTENDED context:`, context);
    console.log(`DTC_MASK ${index + 1} character analysis:`, {
      beforeDTC: textContent.substring(pos - 20, pos),
      afterDTC: textContent.substring(pos, pos + 100)
    });
  });
  
  // Sprawdź ile potencjalnych DTC_MASK występuje w tekście
  const dtcOccurrences = (textContent.match(/DTC_MASK/g) || []).length;
  console.log(`TOTAL DTC_MASK occurrences in text: ${dtcOccurrences}`);
  
  // Szukamy wszystkich wzorców DTC_MASK w tekście
  console.log("=== SEARCHING ALL DTC_MASK PATTERNS ===");
  const allDtcMatches = textContent.match(/DTC_MASK[^A-Z]*[A-Z0-9]+/g) || [];
  console.log(`Found ${allDtcMatches.length} DTC_MASK patterns:`);
  allDtcMatches.forEach((match, index) => {
    console.log(`Pattern ${index + 1}:`, match);
  });
  
  // Próbuj parsować DTC_MASK grupy
  let groups = parseDtcMaskGroups(textContent);
  
  // Jeśli nie znaleziono żadnych grup DTC_MASK, spróbuj alternatywnego formatu
  if (groups.length === 0) {
    groups = parsePCodeGroups(textContent);
  }
  
  console.log(`Parsed ${groups.length} groups total`);
  console.log("Sample groups with date/odometer:", groups.filter(g => g.date || g.odometer));
  
  // DEBUG: Pokaż wszystkie sparsowane grupy
  groups.forEach((group, index) => {
    console.log(`Final Group ${index + 1} (${group.id}):`, {
      number1: group.number1,
      number2: group.number2,
      firstLine: group.firstLine.substring(0, 50) + "..."
    });
  });
  
  return groups;
};
