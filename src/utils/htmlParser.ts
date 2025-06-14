
interface ParsedGroup {
  id: string;
  firstLine: string;
  number1: string;
  number2: string;
  number3: string;
  description: string;
  date?: string;
  odometer?: string;
  priority?: string;
  frequency?: string;
  dtcStatus?: string;
}

export const parseHtmlContent = (htmlContent: string): ParsedGroup[] => {
  console.log("Starting HTML parsing...");
  
  // Zamień &nbsp; na spacje i usuń HTML tagi
  const textContent = htmlContent
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Text content preview:", textContent.substring(0, 2000));
  
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
    
    // Date reading - różne możliwe formaty
    const datePatterns = [
      /Date reading[:\s]*([^\s]+)/i,
      /Date[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      /Date[:\s]*([0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
      /Date[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}\s+[0-9]{1,2}:[0-9]{2})/i
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = groupContent.match(pattern);
      if (dateMatch) {
        group.date = dateMatch[1];
        console.log(`Found date: ${group.date}`);
        break;
      }
    }
    
    // Odometer reading - różne możliwe formaty
    const odometerPatterns = [
      /Odometer reading[:\s]*([^\s]+)/i,
      /Odometer[:\s]*([0-9]+(?:\.[0-9]+)?)/i,
      /Mileage[:\s]*([0-9]+(?:\.[0-9]+)?)/i,
      /Odometer[:\s]*([0-9]+\s*(?:km|miles?))/i
    ];
    
    for (const pattern of odometerPatterns) {
      const odometerMatch = groupContent.match(pattern);
      if (odometerMatch) {
        group.odometer = odometerMatch[1];
        console.log(`Found odometer: ${group.odometer}`);
        break;
      }
    }
    
    groups.push(group);
    console.log(`Added group ${groupCounter} to results`);
  }
  
  // Jeśli nie znaleziono żadnych grup DTC_MASK, spróbuj alternatywnego formatu
  if (groups.length === 0) {
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
      const priorityMatch = content.match(/Priority\s+(\d+)/i);
      if (priorityMatch) group.priority = priorityMatch[1];
      
      const frequencyMatch = content.match(/Malfunction frequency counter\s+(\d+)/i);
      if (frequencyMatch) group.frequency = frequencyMatch[1];
      
      const statusMatch = content.match(/DTC status\s+(\d+)\s+([^0-9\s][^0-9]*?)(?=\s+\d+\s+|$)/i);
      if (statusMatch) group.dtcStatus = `${statusMatch[1]} ${statusMatch[2].trim()}`;
      
      // Date reading dla P-kodów
      for (const pattern of datePatterns) {
        const dateMatch = content.match(pattern);
        if (dateMatch) {
          group.date = dateMatch[1];
          break;
        }
      }
      
      // Odometer reading dla P-kodów
      for (const pattern of odometerPatterns) {
        const odometerMatch = content.match(pattern);
        if (odometerMatch) {
          group.odometer = odometerMatch[1];
          break;
        }
      }
      
      groups.push(group);
    }
  }
  
  console.log(`Parsed ${groups.length} groups total`);
  console.log("Sample groups with date/odometer:", groups.filter(g => g.date || g.odometer));
  return groups;
};
