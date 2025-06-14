
import { ParsedGroup } from "@/types/ParsedGroup";
import { datePatterns, odometerPatterns } from "./patterns";

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
  
  // Główny wzorzec DTC_MASK - używamy globalnego flag i reset regex
  const dtcPattern = /DTC_MASK\s+\$([A-Fa-f0-9]+)\/([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s+\(\$([A-Fa-f0-9]+)\s*\/\s*(\d+)\)/g;
  
  // Znajdź wszystkie dopasowania DTC_MASK
  const matches = Array.from(textContent.matchAll(dtcPattern));
  console.log(`Found ${matches.length} DTC_MASK patterns`);
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    groupCounter++;
    
    const [fullMatch, mask1, mask2, dtcCode, hexNumber, decNumber] = match;
    
    console.log(`Processing DTC group ${groupCounter}:`, {
      mask1, mask2, dtcCode, hexNumber, decNumber
    });
    
    // Wyznacz granice grupy - od aktualnego dopasowania do następnego (lub końca tekstu)
    const startIndex = match.index!;
    const endIndex = nextMatch ? nextMatch.index! : textContent.length;
    const groupContent = textContent.substring(startIndex, endIndex);
    
    console.log(`Group ${groupCounter} content length:`, groupContent.length);
    
    // Szukamy opisu w treści grupy
    let description = "not Available";
    const descriptionMatch = groupContent.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    // Tworzenie pierwszej linii w oczekiwanym formacie
    const firstLine = `${dtcCode} (${hexNumber}/${decNumber}) ${description}`;
    
    const group: ParsedGroup = {
      id: `group-${groupCounter}`,
      firstLine: firstLine,
      number1: dtcCode,
      number2: hexNumber,
      number3: decNumber,
      description: description
    };
    
    // Szukamy dodatkowych informacji w treści grupy
    extractAdditionalInfo(groupContent, group);
    
    groups.push(group);
    console.log(`Added group ${groupCounter} to results`);
  }
  
  return groups;
};

export const parsePCodeGroups = (textContent: string): ParsedGroup[] => {
  const groups: ParsedGroup[] = [];
  let groupCounter = 0;
  
  console.log("No DTC_MASK groups found, trying alternative P-code format...");
  
  // Szukamy wzorców P-kodów bezpośrednio
  const pCodePattern = /([P][A-Z0-9]{6})\s*\(\$([A-Fa-f0-9]+)\s*\/\s*(\d+)\)/g;
  const pMatches = Array.from(textContent.matchAll(pCodePattern));
  
  console.log(`Found ${pMatches.length} P-code patterns`);
  
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
      firstLine: `${pCode} (${hexCode}/${decCode}) ${description}`,
      number1: pCode,
      number2: hexCode,
      number3: decCode,
      description: description
    };
    
    // Dodawanie dodatkowych informacji
    extractAdditionalInfo(content, group);
    
    groups.push(group);
  }
  
  return groups;
};
