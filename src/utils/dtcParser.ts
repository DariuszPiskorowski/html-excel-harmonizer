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
  console.log("Using DTC pattern:", dtcPattern.source);
  
  // NAJPIERW: Sprawdź czy na początku jest grupa bez "DTC_MASK"
  const firstGroupPattern = /^([A-Z0-9]+)\s*\(\s*\$?\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/;
  const firstGroupMatch = textContent.match(firstGroupPattern);
  if (firstGroupMatch) {
    groupCounter++;
    const [, dtcCode, hexNumber, decNumber] = firstGroupMatch;
    
    console.log(`Found FIRST group without DTC_MASK: ${dtcCode} (${hexNumber})`);
    
    // Znajdź koniec pierwszej grupy (przed pierwszym DTC_MASK)
    const firstDtcMaskPos = textContent.indexOf("DTC_MASK");
    const firstGroupContent = textContent.substring(0, firstDtcMaskPos > 0 ? firstDtcMaskPos : 500);
    
    let description = "Not Available";
    const descriptionMatch = firstGroupContent.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    const firstGroup: ParsedGroup = {
      id: `group-${groupCounter}`,
      firstLine: `${dtcCode} (${hexNumber}) ${description}`,
      number1: dtcCode,
      number2: hexNumber,
      description: description
    };
    
    extractAdditionalInfo(firstGroupContent, firstGroup);
    console.log(`First group firstLine: "${firstGroup.firstLine}"`);
    groups.push(firstGroup);
  }
  
  // POTEM: Parsuj standardowe grupy z DTC_MASK
  let matches = Array.from(textContent.matchAll(dtcPattern));
  console.log(`Found ${matches.length} DTC_MASK patterns with standard regex`);
  
  // Jeśli nie znaleziono wszystkich, spróbuj alternatywnego podejścia
  if (matches.length < 19) {
    console.log("=== TRYING ALTERNATIVE DTC PARSING ===");
    
    // Szukamy wszystkich wystąpień DTC_MASK i parsujemy je ręcznie
    const dtcSections = textContent.split(/DTC_MASK/).slice(1); // Usuń pierwszą pustą część
    console.log(`Found ${dtcSections.length} DTC_MASK sections`);
    
    dtcSections.forEach((section, index) => {
      console.log(`=== Processing DTC section ${index + 1} ===`);
      console.log(`Section preview:`, section.substring(0, 200));
      
      // Szukamy wzorców w każdej sekcji
      const sectionMatches = parseAlternativeDtcFormat(section, index + 1);
      if (sectionMatches) {
        groupCounter++;
        groups.push(sectionMatches);
        console.log(`Successfully parsed section ${index + 1} as group ${groupCounter}`);
      } else {
        console.log(`Failed to parse section ${index + 1}`);
      }
    });
    
    return groups;
  }
  
  // Standardowe parsowanie
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    groupCounter++;
    
    const [fullMatch, mask1, mask2, dtcCode, hexNumber, decNumber] = match;
    
    console.log(`Processing DTC group ${groupCounter}:`, {
      mask1, mask2, dtcCode, hexNumber, decNumber
    });
    
    // Wyznacz granice grupy
    const startIndex = match.index!;
    const endIndex = nextMatch ? nextMatch.index! : textContent.length;
    const groupContent = textContent.substring(startIndex, endIndex);
    
    // Szukamy opisu w treści grupy
    let description = "Not Available";
    const descriptionMatch = groupContent.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    const firstLine = `${dtcCode} (${hexNumber}) ${description}`;
    
    const group: ParsedGroup = {
      id: `group-${groupCounter}`,
      firstLine: firstLine,
      number1: dtcCode,
      number2: hexNumber,
      description: description
    };
    
    extractAdditionalInfo(groupContent, group);
    
    console.log(`Group ${groupCounter} firstLine: "${group.firstLine}"`);
    console.log(`Group ${groupCounter} details: dtcCode="${dtcCode}", hexNumber="${hexNumber}", decNumber="${decNumber}"`);
    
    groups.push(group);
  }
  
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
