import { ParsedGroup } from "@/types/ParsedGroup";
import { datePatterns, odometerPatterns, dtcPattern, pCodePattern } from "./patterns";

export const extractAdditionalInfo = (groupContent: string, group: ParsedGroup): void => {
  // Priority
  const priorityMatch = groupContent.match(/Priority\s+(\d+)/i);
  if (priorityMatch) {
    group.priority = priorityMatch[1];
    console.log(`Found priority: ${group.priority}`);
  }

  // Malfunction frequency counter
  const frequencyMatch = groupContent.match(/Malfunction frequency counter\s+(\d+)/i);
  if (frequencyMatch) {
    group.frequency = frequencyMatch[1];
    console.log(`Found frequency: ${group.frequency}`);
  }

  // DTC status - szukamy linii z numerem statusu i opisem
  const statusMatch = groupContent.match(/DTC status\s+(\d+)\s+([^0-9\s][^0-9]*?)(?=\s+\d+\s+|$)/i);
  if (statusMatch) {
    group.dtcStatus = `${statusMatch[1]} ${statusMatch[2].trim()}`;
    console.log(`Found DTC status: ${group.dtcStatus}`);
  }

  // Date reading - różne możliwe formaty, teraz z obsługą czasu
  for (const pattern of datePatterns) {
    const dateMatch = groupContent.match(pattern);
    if (dateMatch) {
      group.date = dateMatch[1];
      console.log(`Found date with time: ${group.date}`);
      break;
    }
  }

  // Odometer reading - różne możliwe formaty
  for (const pattern of odometerPatterns) {
    const odometerMatch = groupContent.match(pattern);
    if (odometerMatch) {
      group.odometer = odometerMatch[1];
      console.log(`Found odometer: ${group.odometer}`);
      break;
    }
  }
};

export const parseDtcMaskGroups = (textContent: string): ParsedGroup[] => {
  const groups: ParsedGroup[] = [];
  let groupCounter = 0;
  
  console.log("=== STARTING DTC_MASK PARSING ===");
  console.log("DTC_MASK is at the END of each group, using as separator");
  
  // Sprawdź ile razy występuje DTC_MASK w tekście
  const dtcMaskOccurrences = (textContent.match(/DTC_MASK/g) || []).length;
  console.log(`TOTAL DTC_MASK occurrences in text: ${dtcMaskOccurrences}`);
  console.log(`Expected groups should be: ${dtcMaskOccurrences}`);
  
  // Podziel tekst używając DTC_MASK jako separatora - prosty split
  const groupSections = textContent.split('DTC_MASK');
  console.log(`Found ${groupSections.length} potential groups after splitting by DTC_MASK`);
  
  // Sprawdź długość każdej sekcji
  groupSections.forEach((section, index) => {
    console.log(`Section ${index}: length=${section.length}, starts with: "${section.substring(0, 50)}"`);
  });
  
  // Parsuj każdą sekcję jako osobną grupę
  groupSections.forEach((section, index) => {
    const trimmedSection = section.trim();
    if (trimmedSection.length < 10) {
      console.log(`Section ${index} too short, skipping`);
      return; // Pomiń zbyt krótkie sekcje
    }
    
    console.log(`=== Processing group section ${index + 1} ===`);
    console.log(`Section preview:`, trimmedSection.substring(0, 100));
    console.log(`Section first 20 chars for regex test:`, trimmedSection.substring(0, 20));
    
    // Szukaj wzorca DTC na początku sekcji - grupy mogą zaczynać się od różnych liter i cyfr
    const dtcMatch = trimmedSection.match(/^([A-Z0-9]+)\s*\(\s*\$?\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/);
    console.log(`DTC match result for section ${index}:`, dtcMatch ? `FOUND: ${dtcMatch[1]}` : "NOT FOUND");
    
    if (dtcMatch) {
      groupCounter++;
      const [, dtcCode, hexNumber, decNumber] = dtcMatch;
      
      console.log(`Found group ${groupCounter}: ${dtcCode} (${hexNumber})`);
      
      // Szukamy opisu w treści grupy
      let description = "Not Available";
      const descriptionMatch = trimmedSection.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
      }
      
      const group: ParsedGroup = {
        id: `group-${groupCounter}`,
        firstLine: `${dtcCode} (${hexNumber}) ${description}`,
        number1: dtcCode,
        number2: hexNumber,
        description: description
      };
      
      extractAdditionalInfo(trimmedSection, group);
      console.log(`Group ${groupCounter} firstLine: "${group.firstLine}"`);
      groups.push(group);
    } else {
      console.log(`No DTC pattern found in section ${index + 1}`);
    }
  });
  
  return groups;
};

// Nowa funkcja do parsowania alternatywnych formatów DTC
const parseAlternativeDtcFormat = (section: string, sectionNumber: number): ParsedGroup | null => {
  console.log(`=== ALTERNATIVE PARSING for section ${sectionNumber} ===`);
  
  // Różne możliwe wzorce dla DTC_MASK
  const patterns = [
    // Standardowy format
    /\s*[:\$]*\s*([A-Fa-f0-9]+)\s*[\/\\]\s*([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s*\(\s*[\$]*\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/,
    // Format bez dolara
    /\s*([A-Fa-f0-9]+)\s*[\/\\]\s*([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s*\(\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/,
    // Format z dwukropkiem
    /\s*:\s*([A-Fa-f0-9]+)\s*[\/\\]\s*([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s*\(\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/
  ];
  
  for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
    const pattern = patterns[patternIndex];
    const match = section.match(pattern);
    
    if (match) {
      console.log(`Matched with pattern ${patternIndex + 1}:`, match[0]);
      
      const [, mask1, mask2, dtcCode, hexNumber, decNumber] = match;
      
      // Szukamy opisu
      let description = "Not Available";
      const descriptionMatch = section.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
      }
      
      const firstLine = `${dtcCode} (${hexNumber}) ${description}`;
      
      const group: ParsedGroup = {
        id: `group-${sectionNumber}`,
        firstLine: firstLine,
        number1: dtcCode,
        number2: hexNumber,
        description: description
      };
      
      extractAdditionalInfo(section, group);
      
      console.log(`Successfully created group:`, {
        dtcCode,
        hexNumber,
        description: description.substring(0, 50) + "..."
      });
      
      return group;
    }
  }
  
  console.log(`No pattern matched for section ${sectionNumber}`);
  return null;
};

export const parsePCodeGroups = (textContent: string): ParsedGroup[] => {
  const groups: ParsedGroup[] = [];
  let groupCounter = 0;
  
  console.log("No DTC_MASK groups found, trying alternative P-code format...");
  
  // Szukamy wzorców P-kodów bezpośrednio - używamy z patterns.ts
  console.log("Using P-code pattern:", pCodePattern.source);
  const pMatches = Array.from(textContent.matchAll(pCodePattern));
  
  console.log(`Found ${pMatches.length} P-code patterns`);
  
  // DEBUG: Pokaż wszystkie znalezione P-code matches
  pMatches.forEach((match, index) => {
    console.log(`P-code Match ${index + 1}:`, {
      fullMatch: match[0],
      pCode: match[1],
      position: match.index
    });
  });
  
  for (let i = 0; i < pMatches.length; i++) {
    const pMatch = pMatches[i];
    const nextPMatch = pMatches[i + 1];
    
    groupCounter++;
    
    const [, pCode, hexCode, decCode] = pMatch;
    
    console.log(`Processing P-code group ${groupCounter}:`, {
      pCode, hexCode, decCode
    });
    
    // Wyznacz granice grupy P-code
    const startIndex = pMatch.index!;
    const endIndex = nextPMatch ? nextPMatch.index! : textContent.length;
    const content = textContent.substring(startIndex, endIndex);
    
    let description = "Unknown";
    const descMatch = content.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
    if (descMatch) {
      description = descMatch[1].trim();
    }
    
    const group: ParsedGroup = {
      id: `group-${groupCounter}`,
      firstLine: `${pCode} (${hexCode}) ${description}`,
      number1: pCode,
      number2: hexCode,
      description: description
    };
    
    // Dodawanie dodatkowych informacji
    extractAdditionalInfo(content, group);
    
    groups.push(group);
  }
  
  return groups;
};
