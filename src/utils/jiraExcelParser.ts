
import * as XLSX from 'xlsx';

export interface JiraExcelData {
  creationDate?: string;
  link?: string;
  description?: string;
  status?: string;
  fix?: string;
}

export const parseJiraExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log("Reading Jira Excel file...");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log(`Processing Jira sheet: ${firstSheetName}`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`Jira Excel total rows: ${jsonData.length}`);
        console.log("Jira Excel raw data preview (first 5 rows):", jsonData.slice(0, 5));
        
        // Przetwarzaj WSZYSTKIE wiersze (pomijając tylko nagłówek)
        const result = jsonData.slice(1).map((row: any[], index) => {
          const parsedRow = {
            rowIndex: index,
            columnA: row[0], // Creation date
            columnB: row[1], // Link
            columnD: row[3], // Description (hex number search)
            columnE: row[4], // Status
            columnG: row[6]  // Fix
          };
          
          return parsedRow;
        });
        
        console.log(`Parsed ${result.length} Jira Excel rows (wszystkie wiersze)`);
        
        // Pokazuj wszystkie wartości columnD dla diagnostyki
        const columnDValues = result.map((r, i) => ({ 
          rowIndex: i, 
          columnD: r.columnD,
          columnDType: typeof r.columnD,
          columnDString: String(r.columnD || '').trim()
        }));
        
        console.log("Wszystkie wartości columnD z Jira Excel:", columnDValues);
        
        return resolve(result);
      } catch (error) {
        console.error("Error parsing Jira Excel file:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error reading Jira file"));
    reader.readAsArrayBuffer(file);
  });
};

export const matchJiraExcelData = (htmlGroups: any[], jiraData: any[]): any[] => {
  console.log("=== ROZPOCZYNAM DOPASOWYWANIE DANYCH JIRA EXCEL ===");
  console.log(`Grupy HTML do dopasowania: ${htmlGroups.length}`);
  console.log(`Wiersze Jira do przeszukania: ${jiraData.length}`);
  
  console.log("HTML groups number2 values:", htmlGroups.map(g => ({ 
    id: g.id, 
    number2: g.number2,
    number2Clean: g.number2.replace('$', '').toUpperCase()
  })));
  
  console.log("Wszystkie wartości Jira columnD:", jiraData.map((j, i) => ({ 
    rowIndex: i,
    columnD: j.columnD,
    columnDType: typeof j.columnD,
    columnDString: String(j.columnD || '').trim(),
    columnDUpper: String(j.columnD || '').trim().toUpperCase()
  })));
  
  return htmlGroups.map(group => {
    const htmlHex = group.number2.replace('$', '').toUpperCase();
    console.log(`\n--- SZUKAM HEX "${htmlHex}" (z "${group.number2}") ---`);
    
    // Znajdź WSZYSTKIE pasujące wiersze (nie tylko pierwszy)
    const matchingRows = jiraData.filter((row, index) => {
      const jiraHexRaw = String(row.columnD || '').trim();
      console.log(`  Sprawdzam wiersz ${index}: columnD = "${jiraHexRaw}" (typ: ${typeof row.columnD})`);
      
      if (!jiraHexRaw) {
        console.log(`    ❌ Pusta wartość columnD`);
        return false;
      }
      
      // Wypróbuj różne warianty dopasowania hex
      const jiraHexVariations = [
        jiraHexRaw.toUpperCase(),
        jiraHexRaw.replace('$', '').toUpperCase(),
        jiraHexRaw.replace('0x', '').toUpperCase(),
        jiraHexRaw.replace('0X', '').toUpperCase(),
        jiraHexRaw.replace(/[^A-Fa-f0-9]/g, '').toUpperCase(),
        jiraHexRaw.replace(/\s+/g, '').toUpperCase()
      ];
      
      console.log(`    Warianty do testowania: [${jiraHexVariations.join(', ')}]`);
      console.log(`    Szukam: "${htmlHex}"`);
      
      const match = jiraHexVariations.some(variation => {
        const isMatch = variation === htmlHex;
        console.log(`      "${variation}" === "${htmlHex}" ? ${isMatch}`);
        return isMatch;
      });
      
      if (match) {
        console.log(`    ✅ DOPASOWANIE ZNALEZIONE: HTML "${htmlHex}" pasuje do Jira "${jiraHexRaw}"`);
      } else {
        console.log(`    ❌ Brak dopasowania dla "${jiraHexRaw}"`);
      }
      
      return match;
    });
    
    if (matchingRows.length > 0) {
      console.log(`✅ Znaleziono ${matchingRows.length} dopasowań Jira dla ${group.number2}`);
      
      const jiraMatches: JiraExcelData[] = matchingRows.map(row => ({
        creationDate: row.columnA ? formatJiraDate(row.columnA.toString()) : undefined,
        link: row.columnB?.toString() || undefined,
        description: row.columnD?.toString() || undefined,
        status: row.columnE?.toString() || undefined,
        fix: row.columnG?.toString() || undefined
      }));
      
      console.log(`Dane Jira dla ${group.number2}:`, jiraMatches);
      
      return {
        ...group,
        jiraData: jiraMatches
      };
    } else {
      console.log(`❌ Nie znaleziono dopasowań Jira dla ${group.number2} (szukano: ${htmlHex})`);
      return group;
    }
  });
};

const formatJiraDate = (dateValue: string): string => {
  try {
    // Handle various date formats from Excel
    if (dateValue.includes('/') || dateValue.includes('-') || dateValue.includes('.')) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pl-PL');
      }
    }
    return dateValue;
  } catch (error) {
    return dateValue;
  }
};
