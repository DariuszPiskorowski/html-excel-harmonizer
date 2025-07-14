
import { ParsedGroup } from "@/types/ParsedGroup";
import { parseDtcMaskGroups, parsePCodeGroups } from "./dtcParser";

export const parseHtmlContent = (htmlContent: string): ParsedGroup[] => {
  console.log("=== STARTING HTML PARSING ===");
  console.log("Original HTML length:", htmlContent.length);
  
  // Zamień &nbsp; na spacje i usuń HTML tagi
  const textContent = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Processed text length:", textContent.length);
  
  // SZCZEGÓŁOWE DEBUGOWANIE - szukamy konkretnych błędów
  console.log("=== SEARCHING FOR SPECIFIC MISSING ERRORS ===");
  
  // Szukamy E10300 z pozycji 1
  const e10300Search = textContent.indexOf("E10300");
  if (e10300Search !== -1) {
    const contextStart = Math.max(0, e10300Search - 100);
    const contextEnd = Math.min(textContent.length, e10300Search + 200);
    const context = textContent.substring(contextStart, contextEnd);
    console.log("FOUND E10300 at position:", e10300Search);
    console.log("E10300 context:", context);
  } else {
    console.log("E10300 NOT FOUND in text content");
  }
  
  // Szukamy 102C03 z pozycji 16
  const c102c03Search = textContent.indexOf("102C03");
  if (c102c03Search !== -1) {
    const contextStart = Math.max(0, c102c03Search - 100);
    const contextEnd = Math.min(textContent.length, c102c03Search + 200);
    const context = textContent.substring(contextStart, contextEnd);
    console.log("FOUND 102C03 at position:", c102c03Search);
    console.log("102C03 context:", context);
  } else {
    console.log("102C03 NOT FOUND in text content");
  }
  
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
