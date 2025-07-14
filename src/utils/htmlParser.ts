
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
  console.log("Text content preview:", textContent.substring(0, 2000));
  
  // Sprawdź ile potencjalnych DTC_MASK występuje w tekście
  const dtcOccurrences = (textContent.match(/DTC_MASK/g) || []).length;
  console.log(`TOTAL DTC_MASK occurrences in text: ${dtcOccurrences}`);
  
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
