
import { ParsedGroup } from "@/types/ParsedGroup";
import { parseDtcMaskGroups, parsePCodeGroups } from "./dtcParser";

export const parseHtmlContent = (htmlContent: string): ParsedGroup[] => {
  console.log("Starting HTML parsing...");
  
  // Zamień &nbsp; na spacje i usuń HTML tagi
  const textContent = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Text content preview:", textContent.substring(0, 2000));
  
  // Próbuj parsować DTC_MASK grupy
  let groups = parseDtcMaskGroups(textContent);
  
  // Jeśli nie znaleziono żadnych grup DTC_MASK, spróbuj alternatywnego formatu
  if (groups.length === 0) {
    groups = parsePCodeGroups(textContent);
  }
  
  console.log(`Parsed ${groups.length} groups total`);
  console.log("Sample groups with date/odometer:", groups.filter(g => g.date || g.odometer));
  return groups;
};
