
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
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Text content preview:", textContent.substring(0, 500));
  
  const groups: ParsedGroup[] = [];
  const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentGroup: Partial<ParsedGroup> | null = null;
  let groupCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Processing line ${i}: ${line.substring(0, 100)}`);
    
    // Sprawdź czy to pierwsza linia grupy (format: numer1 (numer2 / numer3) opis)
    const firstLineMatch = line.match(/^([A-Fa-f0-9]+)\s*\(([A-Fa-f0-9$]+)\s*\/\s*([A-Fa-f0-9]+)\)\s*(.+)$/);
    
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
        number1: firstLineMatch[1],
        number2: firstLineMatch[2].replace('$', ''), // Usuń $ z początku
        number3: firstLineMatch[3],
        description: firstLineMatch[4].trim()
      };
      
      console.log(`Found new group: ${currentGroup.number1} (${currentGroup.number2} / ${currentGroup.number3})`);
      continue;
    }
    
    // Jeśli mamy aktywną grupę, sprawdź kolejne linie
    if (currentGroup) {
      // Szukaj Date
      if (line.toLowerCase().includes('date') && !currentGroup.date) {
        const dateMatch = line.match(/date[:\s]*([^\s]+)/i);
        if (dateMatch) {
          currentGroup.date = dateMatch[1];
          console.log(`Found date: ${currentGroup.date}`);
        }
      }
      
      // Szukaj Odometer
      if (line.toLowerCase().includes('odometer') && !currentGroup.odometer) {
        const odometerMatch = line.match(/odometer[:\s]*reading[:\s]*([^\s]+)/i);
        if (odometerMatch) {
          currentGroup.odometer = odometerMatch[1];
          console.log(`Found odometer: ${currentGroup.odometer}`);
        }
      }
      
      // Szukaj Priority
      if (line.toLowerCase().includes('priority') && !currentGroup.priority) {
        const priorityMatch = line.match(/priority[:\s]*([^\s]+)/i);
        if (priorityMatch) {
          currentGroup.priority = priorityMatch[1];
          console.log(`Found priority: ${currentGroup.priority}`);
        }
      }
      
      // Szukaj Frequency
      if (line.toLowerCase().includes('frequency') && !currentGroup.frequency) {
        const frequencyMatch = line.match(/frequency[:\s]*counter[:\s]*([^\s]+)/i);
        if (frequencyMatch) {
          currentGroup.frequency = frequencyMatch[1];
          console.log(`Found frequency: ${currentGroup.frequency}`);
        }
      }
      
      // Szukaj DTC Status
      if (line.toLowerCase().includes('dtc') && line.toLowerCase().includes('status') && !currentGroup.dtcStatus) {
        const dtcMatch = line.match(/dtc[:\s]*status[:\s]*([^\s]+)/i);
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
  return groups;
};
