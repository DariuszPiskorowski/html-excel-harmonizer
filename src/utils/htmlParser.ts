
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
  
  // Szukamy wzorców DTC_MASK z kodami w formacie ($xxxxx / xxxxxx)
  const dtcPattern = /DTC_MASK\s+\$([A-Fa-f0-9]+)\/([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s+\(\$([A-Fa-f0-9]+)\s*\/\s*(\d+)\)\s*([^D]*?)(?=DTC_MASK|$)/g;
  
  let match;
  while ((match = dtcPattern.exec(textContent)) !== null) {
    groupCounter++;
    
    const [fullMatch, mask1, mask2, dtcCode, hexNumber, decNumber, restOfContent] = match;
    
    console.log(`Found DTC group ${groupCounter}:`, {
      mask1, mask2, dtcCode, hexNumber, decNumber
    });
    
    // Szukamy opisu w treści
    let description = "Unknown";
    const descriptionMatch = restOfContent.match(/DTC text:\s*([^&\s][^&]*?)(?=\s+DTC|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    } else {
      // Alternatywnie szukamy opisu przed "DTC text:"
      const altDescMatch = restOfContent.match(/([A-Za-z][^D]*?)(?=\s+DTC text|$)/);
      if (altDescMatch) {
        description = altDescMatch[1].trim();
      }
    }
    
    // Tworzenie pierwszej linii w oczekiwanym formacie
    const firstLine = `${hexNumber} (${mask1}/${mask2}) ${description}`;
    
    const group: ParsedGroup = {
      id: `group-${groupCounter}`,
      firstLine: firstLine,
      number1: hexNumber,
      number2: mask1,
      number3: mask2,
      description: description
    };
    
    // Szukamy dodatkowych informacji w treści grupy
    const groupContent = restOfContent;
    
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
    
    // DTC status - szukamy linii z numerem statusu
    const statusMatch = groupContent.match(/DTC status\s+(\d+)\s+([^0-9]+)/i);
    if (statusMatch) {
      group.dtcStatus = `${statusMatch[1]} ${statusMatch[2].trim()}`;
      console.log(`Found DTC status: ${group.dtcStatus}`);
    }
    
    // Date reading (jeśli jest)
    const dateMatch = groupContent.match(/Date reading:\s*([^\s]+)/i);
    if (dateMatch) {
      group.date = dateMatch[1];
      console.log(`Found date: ${group.date}`);
    }
    
    // Odometer reading (jeśli jest)
    const odometerMatch = groupContent.match(/Odometer reading:\s*([^\s]+)/i);
    if (odometerMatch) {
      group.odometer = odometerMatch[1];
      console.log(`Found odometer: ${group.odometer}`);
    }
    
    groups.push(group);
  }
  
  // Jeśli nie znaleziono żadnych grup DTC_MASK, spróbuj alternatywnego formatu
  if (groups.length === 0) {
    console.log("No DTC_MASK groups found, trying alternative format...");
    
    // Szukamy wzorców P-kodów bezpośrednio
    const pCodePattern = /([P][A-Z0-9]{6})\s*\(\$([A-Fa-f0-9]+)\s*\/\s*(\d+)\)\s*([^P]*?)(?=[P][A-Z0-9]{6}|$)/g;
    
    let pMatch;
    while ((pMatch = pCodePattern.exec(textContent)) !== null) {
      groupCounter++;
      
      const [, pCode, hexCode, decCode, content] = pMatch;
      
      console.log(`Found P-code group ${groupCounter}:`, {
        pCode, hexCode, decCode
      });
      
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
      
      // Dodawanie dodatkowych informacji jak wcześniej
      const priorityMatch = content.match(/Priority\s+(\d+)/i);
      if (priorityMatch) group.priority = priorityMatch[1];
      
      const frequencyMatch = content.match(/Malfunction frequency counter\s+(\d+)/i);
      if (frequencyMatch) group.frequency = frequencyMatch[1];
      
      const statusMatch = content.match(/DTC status\s+(\d+)\s+([^0-9]+)/i);
      if (statusMatch) group.dtcStatus = `${statusMatch[1]} ${statusMatch[2].trim()}`;
      
      groups.push(group);
    }
  }
  
  console.log(`Parsed ${groups.length} groups total`);
  console.log("Sample groups:", groups.slice(0, 3));
  return groups;
};
