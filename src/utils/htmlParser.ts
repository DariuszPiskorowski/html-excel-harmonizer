
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
  
  // Szukamy konkretnych hexNumber kodów (number2)
  console.log("=== SEARCHING FOR SPECIFIC HEX NUMBERS (number2) ===");
  
  const searchHexNumbers = ["E10300", "102C03", "$E10300", "$102C03"];
  searchHexNumbers.forEach(hexNum => {
    const searchIndex = textContent.indexOf(hexNum);
    if (searchIndex !== -1) {
      const contextStart = Math.max(0, searchIndex - 150);
      const contextEnd = Math.min(textContent.length, searchIndex + 300);
      const context = textContent.substring(contextStart, contextEnd);
      console.log(`FOUND ${hexNum} at position:`, searchIndex);
      console.log(`${hexNum} context:`, context);
    } else {
      console.log(`${hexNum} NOT FOUND in text content`);
    }
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
