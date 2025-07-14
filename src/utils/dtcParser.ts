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
  
  console.log("=== STARTING MULTI-SECTION PARSING ===");
  
  // Znajdź pozycję startu - "Primary results (xx):" lub "Primary events (xx):"
  const startMatch = textContent.match(/(Primary\s+(?:results|events)\s*\(\d+\)\s*:)/);
  if (!startMatch) {
    console.log("No Primary results/events found!");
    return groups;
  }
  
  const startPos = textContent.indexOf(startMatch[0]) + startMatch[0].length;
  let workingText = textContent.substring(startPos);
  console.log(`Starting parsing after ${startMatch[1]}`);
  
  // Znajdź wszystkie pozycje "Information (xx):" - te dzielą sekcje
  const informationPattern = /Information\s*\(\d+\)\s*:/g;
  const informationMatches = [];
  let match;
  
  while ((match = informationPattern.exec(workingText)) !== null) {
    informationMatches.push({
      position: match.index,
      text: match[0]
    });
  }
  
  console.log(`Found ${informationMatches.length} Information sections`);
  console.log(`Total expected sections: ${informationMatches.length + 1}`); // +1 bo pierwsza sekcja jest przed pierwszym Information
  
  // Dodaj sekcję na samym końcu (po ostatnim Information)
  let sections = [];
  
  // Pierwsza sekcja: od początku do pierwszego Information
  if (informationMatches.length > 0) {
    sections.push({
      start: 0,
      end: informationMatches[0].position,
      text: workingText.substring(0, informationMatches[0].position)
    });
  } else {
    // Jeśli nie ma Information, cały tekst to jedna sekcja
    sections.push({
      start: 0,
      end: workingText.length,
      text: workingText
    });
  }
  
  // Kolejne sekcje: od końca każdego Information do następnego Information
  for (let i = 0; i < informationMatches.length; i++) {
    const currentInfo = informationMatches[i];
    const nextInfo = informationMatches[i + 1];
    
    const sectionStart = currentInfo.position + currentInfo.text.length;
    const sectionEnd = nextInfo ? nextInfo.position : workingText.length;
    
    sections.push({
      start: sectionStart,
      end: sectionEnd,
      text: workingText.substring(sectionStart, sectionEnd)
    });
  }
  
  console.log(`Created ${sections.length} sections to parse`);
  
  // Parsuj każdą sekcję osobno
  sections.forEach((section, sectionIndex) => {
    console.log(`=== PARSING SECTION ${sectionIndex + 1} ===`);
    console.log(`Section length: ${section.text.length}`);
    console.log(`Section preview: "${section.text.substring(0, 100)}"`);
    
    if (section.text.trim().length < 20) {
      console.log(`Section ${sectionIndex + 1} too short, skipping`);
      return;
    }
    
    // Parsuj grupy w tej sekcji używając DTC_MASK jako separatora
    const sectionGroups = parseSectionGroups(section.text, groupCounter);
    groups.push(...sectionGroups);
    groupCounter += sectionGroups.length;
    
    console.log(`Section ${sectionIndex + 1} produced ${sectionGroups.length} groups`);
  });
  
  console.log(`=== TOTAL PARSING RESULT: ${groups.length} groups ===`);
  return groups;
};

// Funkcja do parsowania grup w jednej sekcji
const parseSectionGroups = (sectionText: string, startingCounter: number): ParsedGroup[] => {
  const groups: ParsedGroup[] = [];
  let groupCounter = startingCounter;
  
  // Parsuj grupy w sekcji - każda kończy się na DTC_MASK
  let currentPos = 0;
  
  while (currentPos < sectionText.length) {
    const dtcMaskPos = sectionText.indexOf('DTC_MASK', currentPos);
    
    if (dtcMaskPos === -1) {
      // Ostatnia grupa w sekcji
      const lastGroupText = sectionText.substring(currentPos).trim();
      if (lastGroupText.length > 10) {
        const group = parseGroupContent(lastGroupText, ++groupCounter);
        if (group) groups.push(group);
      }
      break;
    }
    
    // Wyciągnij tekst grupy
    const groupEndPos = dtcMaskPos + 8; // "DTC_MASK".length = 8
    const groupText = sectionText.substring(currentPos, groupEndPos).trim();
    
    if (groupText.length > 10) {
      const group = parseGroupContent(groupText, ++groupCounter);
      if (group) groups.push(group);
    }
    
    currentPos = groupEndPos;
  }
  
  return groups;
};

// Pomocnicza funkcja do parsowania zawartości pojedynczej grupy
const parseGroupContent = (groupText: string, groupNumber: number): ParsedGroup | null => {
  // Szukaj wzorca DTC na początku grupy
  const dtcMatch = groupText.match(/^\s*([A-Z0-9]+)\s*\(\s*\$?\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/);
  
  if (!dtcMatch) {
    console.log(`No DTC pattern found in group ${groupNumber}`);
    return null;
  }
  
  const [, dtcCode, hexNumber, decNumber] = dtcMatch;
  
  // Szukamy opisu
  let description = "Not Available";
  const descriptionMatch = groupText.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
  if (descriptionMatch) {
    description = descriptionMatch[1].trim();
  }
  
  const group: ParsedGroup = {
    id: `group-${groupNumber}`,
    firstLine: `${dtcCode} (${hexNumber}) ${description}`,
    number1: dtcCode,
    number2: hexNumber,
    description: description
  };
  
  extractAdditionalInfo(groupText, group);
  console.log(`Created group ${groupNumber}: ${group.firstLine.substring(0, 50)}...`);
  
  return group;
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
