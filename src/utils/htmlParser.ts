
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
  
  // Usuń HTML tagi i pozostaw tylko tekst
  const textContent = htmlContent.replace(/<[^>]*>/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  console.log("Text content preview:", textContent.substring(0, 1000));
  
  const groups: ParsedGroup[] = [];
  const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log("Total lines found:", lines.length);
  console.log("First 10 lines:", lines.slice(0, 10));
  
  let currentGroup: Partial<ParsedGroup> | null = null;
  let groupCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Sprawdź różne możliwe formaty pierwszej linii grupy
    let firstLineMatch = line.match(/^([A-Fa-f0-9]+)\s*\(([A-Fa-f0-9$]+)\s*\/\s*([A-Fa-f0-9]+)\)\s*(.+)$/);
    
    // Alternatywny format z spacjami
    if (!firstLineMatch) {
      firstLineMatch = line.match(/([A-Fa-f0-9]+)\s+\(([A-Fa-f0-9$]+)\s*\/\s*([A-Fa-f0-9]+)\)\s*(.+)/);
    }
    
    // Jeszcze inny format
    if (!firstLineMatch) {
      firstLineMatch = line.match(/([A-Fa-f0-9]{6,})\s*\(\s*([A-Fa-f0-9$]{6,})\s*\/\s*([A-Fa-f0-9]{6,})\s*\)\s*(.+)/);
    }
    
    // Sprawdź czy linia zawiera charakterystyczne elementy
    if (!firstLineMatch && line.includes('(') && line.includes('/') && line.includes(')')) {
      console.log(`Potential group line not matched: ${line}`);
      // Spróbuj bardziej elastycznego dopasowania
      const flexMatch = line.match(/([A-Fa-f0-9]+).*?\(([A-Fa-f0-9$]+).*?\/.*?([A-Fa-f0-9]+)\).*?(.+)/);
      if (flexMatch) {
        firstLineMatch = flexMatch;
        console.log("Flexible match found:", flexMatch);
      }
    }
    
    if (firstLineMatch) {
      // Jeśli mamy poprzednią grupę, dodaj ją do listy
      if (currentGroup && currentGroup.firstLine) {
        groups.push(currentGroup as ParsedGroup);
      }
      
      // Rozpocznij nową grupę
      groupCounter++;
      currentGroup = {
        id: `group-${groupCounter}`,
        firstLine: line,
        number1: firstLineMatch[1].trim(),
        number2: firstLineMatch[2].replace('$', '').trim(),
        number3: firstLineMatch[3].trim(),
        description: firstLineMatch[4].trim()
      };
      
      console.log(`Found new group ${groupCounter}: ${currentGroup.number1} (${currentGroup.number2} / ${currentGroup.number3})`);
      continue;
    }
    
    // Jeśli mamy aktywną grupę, sprawdź kolejne linie
    if (currentGroup) {
      const lowerLine = line.toLowerCase();
      
      // Szukaj Date - różne formaty
      if (lowerLine.includes('date') && !currentGroup.date) {
        const datePatterns = [
          /date[:\s]*([^\s,]+)/i,
          /date[:\s]*reading[:\s]*([^\s,]+)/i,
          /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/,
          /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/
        ];
        
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            currentGroup.date = match[1];
            console.log(`Found date: ${currentGroup.date}`);
            break;
          }
        }
      }
      
      // Szukaj Odometer - różne formaty
      if (lowerLine.includes('odometer') && !currentGroup.odometer) {
        const odometerPatterns = [
          /odometer[:\s]*reading[:\s]*([^\s,]+)/i,
          /odometer[:\s]*([^\s,]+)/i,
          /reading[:\s]*([^\s,]+)/i
        ];
        
        for (const pattern of odometerPatterns) {
          const match = line.match(pattern);
          if (match) {
            currentGroup.odometer = match[1];
            console.log(`Found odometer: ${currentGroup.odometer}`);
            break;
          }
        }
      }
      
      // Szukaj Priority
      if (lowerLine.includes('priority') && !currentGroup.priority) {
        const priorityMatch = line.match(/priority[:\s]*([^\s,]+)/i);
        if (priorityMatch) {
          currentGroup.priority = priorityMatch[1];
          console.log(`Found priority: ${currentGroup.priority}`);
        }
      }
      
      // Szukaj Frequency
      if ((lowerLine.includes('frequency') || lowerLine.includes('counter')) && !currentGroup.frequency) {
        const frequencyPatterns = [
          /frequency[:\s]*counter[:\s]*([^\s,]+)/i,
          /malfunction[:\s]*frequency[:\s]*counter[:\s]*([^\s,]+)/i,
          /frequency[:\s]*([^\s,]+)/i,
          /counter[:\s]*([^\s,]+)/i
        ];
        
        for (const pattern of frequencyPatterns) {
          const match = line.match(pattern);
          if (match) {
            currentGroup.frequency = match[1];
            console.log(`Found frequency: ${currentGroup.frequency}`);
            break;
          }
        }
      }
      
      // Szukaj DTC Status
      if (lowerLine.includes('dtc') && lowerLine.includes('status') && !currentGroup.dtcStatus) {
        const dtcMatch = line.match(/dtc[:\s]*status[:\s]*([^\s,]+)/i);
        if (dtcMatch) {
          currentGroup.dtcStatus = dtcMatch[1];
          console.log(`Found DTC status: ${currentGroup.dtcStatus}`);
        }
      }
    }
  }
  
  // Dodaj ostatnią grupę
  if (currentGroup && currentGroup.firstLine) {
    groups.push(currentGroup as ParsedGroup);
  }
  
  console.log(`Parsed ${groups.length} groups total`);
  console.log("Sample groups:", groups.slice(0, 3));
  return groups;
};
