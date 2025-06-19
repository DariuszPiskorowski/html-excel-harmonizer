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
        console.log("=== JIRA EXCEL PARSING START ===");
        console.log("Reading Jira Excel file...");
        console.log("File name:", file.name);
        console.log("File size:", file.size);
        console.log("File type:", file.type);
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log("Workbook sheet names:", workbook.SheetNames);
        
        // Szukaj arkusza o nazwie "Exporter"
        const exporterSheetName = workbook.SheetNames.find(name => name === "Exporter");
        
        if (!exporterSheetName) {
          console.error("Sheet 'Exporter' not found in Jira Excel file!");
          console.log("Available sheets:", workbook.SheetNames);
          reject(new Error("Sheet 'Exporter' not found in Jira Excel file"));
          return;
        }
        
        const worksheet = workbook.Sheets[exporterSheetName];
        console.log(`Processing Jira sheet: ${exporterSheetName}`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`Jira Excel total rows: ${jsonData.length}`);
        console.log("Jira Excel FIRST 10 raw rows:", jsonData.slice(0, 10));
        
        // Sprawdź strukturę nagłówka
        if (jsonData.length > 0) {
          console.log("JIRA EXCEL HEADER ROW:", jsonData[0]);
        }
        
        // Przetwarzaj WSZYSTKIE wiersze (pomijając tylko nagłówek)
        const result = jsonData.slice(1).map((row: any[], index) => {
          const parsedRow = {
            rowIndex: index,
            columnA: row[0], // Creation date
            columnB: row[1], // Link
            columnC: row[2], // Column C
            columnD: row[3], // Description (hex number search)
            columnE: row[4], // Status
            columnF: row[5], // Column F
            columnG: row[6], // Fix
            fullRow: row    // Całe row dla debugowania
          };
          
          console.log(`Parsed Jira row ${index}:`, parsedRow);
          return parsedRow;
        });
        
        console.log(`=== JIRA PARSING COMPLETE: ${result.length} rows ===`);
        console.log("ALL parsed Jira rows:", result);
        
        // Pokaż wszystkie unikalne wartości z kolumny D (hex values)
        const columnDValues = result.map(row => row.columnD).filter(val => val !== undefined && val !== null && val !== '');
        console.log("ALL COLUMN D VALUES (hex candidates):", columnDValues);
        console.log("UNIQUE COLUMN D VALUES:", [...new Set(columnDValues)]);
        
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
  console.log("=== JIRA MATCHING START ===");
  console.log(`HTML groups to match: ${htmlGroups.length}`);
  console.log(`Jira rows to search: ${jiraData.length}`);
  
  console.log("COMPLETE HTML groups data:", htmlGroups);
  console.log("COMPLETE Jira data:", jiraData);
  
  // Pokaż wszystkie hex values z HTML
  const htmlHexValues = htmlGroups.map(g => g.number2.replace('$', '0x').toUpperCase());
  console.log("HTML HEX VALUES TO FIND:", htmlHexValues);
  
  // Pokaż wszystkie hex values z Jira
  const jiraHexValues = jiraData.map(row => String(row.columnD || '').trim()).filter(val => val);
  console.log("JIRA HEX VALUES AVAILABLE:", jiraHexValues);
  
  console.log("HTML groups hex values:", htmlGroups.map(g => ({ 
    id: g.id, 
    number2: g.number2,
    number2Clean: g.number2.replace('$', '0x').toUpperCase()
  })));
  
  const matchedResults = htmlGroups.map(group => {
    // Zamień prefix $ na 0x przed przeszukiwaniem
    const htmlHex = group.number2.replace('$', '0x').toUpperCase();
    console.log(`\n--- SEARCHING FOR HEX "${htmlHex}" (converted from "${group.number2}") ---`);
    console.log(`Group data:`, group);
    
    // Znajdź WSZYSTKIE pasujące wiersze
    const matchingRows = jiraData.filter((row, index) => {
      const jiraHexRaw = String(row.columnD || '').trim();
      console.log(`  Checking Jira row ${index}:`);
      console.log(`    Full row data:`, row);
      console.log(`    columnD raw value: "${jiraHexRaw}" (type: ${typeof row.columnD})`);
      
      if (!jiraHexRaw) {
        console.log(`    ❌ Empty columnD value`);
        return false;
      }
      
      // Test different hex matching variations
      const jiraHexVariations = [
        jiraHexRaw.toUpperCase(),
        jiraHexRaw.replace('$', '0x').toUpperCase(),
        jiraHexRaw.replace('0x', '').toUpperCase(),
        jiraHexRaw.replace('0X', '').toUpperCase(),
        jiraHexRaw.replace(/[^A-Fa-f0-9]/g, '').toUpperCase(),
        jiraHexRaw.replace(/\s+/g, '').toUpperCase()
      ];
      
      console.log(`    Testing variations: [${jiraHexVariations.join(', ')}]`);
      console.log(`    Looking for: "${htmlHex}"`);
      
      const match = jiraHexVariations.some(variation => {
        const exactMatch = variation === htmlHex;
        const variationContainsHtml = variation.includes(htmlHex);
        const htmlContainsVariation = htmlHex.includes(variation);
        const isMatch = exactMatch || variationContainsHtml || htmlContainsVariation;
        
        console.log(`      "${variation}" vs "${htmlHex}"`);
        console.log(`        exact match: ${exactMatch}`);
        console.log(`        variation contains html: ${variationContainsHtml}`);
        console.log(`        html contains variation: ${htmlContainsVariation}`);
        console.log(`        final result: ${isMatch}`);
        
        return isMatch;
      });
      
      if (match) {
        console.log(`    ✅ MATCH FOUND: HTML "${htmlHex}" matches Jira "${jiraHexRaw}"`);
      } else {
        console.log(`    ❌ NO MATCH: HTML "${htmlHex}" does not match Jira "${jiraHexRaw}"`);
      }
      
      return match;
    });
    
    console.log(`Found ${matchingRows.length} Jira matches for ${group.number2}`);
    console.log(`Matching rows:`, matchingRows);
    
    if (matchingRows.length > 0) {
      const jiraMatches = matchingRows.map(row => {
        const jiraMatch = {
          creationDate: row.columnA ? formatJiraDate(row.columnA.toString()) : undefined,
          link: row.columnB?.toString() || undefined,
          description: row.columnD?.toString() || undefined,
          status: row.columnE?.toString() || undefined,
          fix: row.columnG?.toString() || undefined
        };
        console.log(`Created Jira match:`, jiraMatch);
        return jiraMatch;
      });
      
      const resultWithJira = {
        ...group,
        jiraData: jiraMatches
      };
      
      console.log(`✅ Group ${group.id} now has ${jiraMatches.length} Jira entries`);
      console.log("Final group with Jira data:", resultWithJira);
      
      return resultWithJira;
    } else {
      console.log(`❌ No Jira matches found for ${group.number2}`);
      console.log(`Returning original group:`, group);
      return group;
    }
  });
  
  console.log("=== JIRA MATCHING COMPLETE ===");
  console.log("Final matched results:", matchedResults);
  console.log("Results with Jira data count:", matchedResults.filter(r => r.jiraData && r.jiraData.length > 0).length);
  
  return matchedResults;
};

const formatJiraDate = (dateValue: string | number): string => {
  try {
    console.log(`Formatting date value: "${dateValue}" (type: ${typeof dateValue})`);
    
    // Convert to number if it's a string
    const numValue = typeof dateValue === 'string' ? parseFloat(dateValue) : dateValue;
    
    // Check if it's an Excel serial date (typically > 40000 for dates after 2009)
    if (!isNaN(numValue) && numValue > 40000) {
      // Excel serial date: days since January 1, 1900
      // But Excel incorrectly treats 1900 as a leap year, so we subtract 2 days
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
      const jsDate = new Date(excelEpoch.getTime() + (numValue * 24 * 60 * 60 * 1000));
      
      console.log(`Converted Excel serial date ${numValue} to: ${jsDate.toLocaleDateString('pl-PL')}`);
      return jsDate.toLocaleDateString('pl-PL');
    }
    
    // Try to parse as regular date string
    if (typeof dateValue === 'string' && (dateValue.includes('/') || dateValue.includes('-') || dateValue.includes('.'))) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        console.log(`Parsed regular date string "${dateValue}" to: ${date.toLocaleDateString('pl-PL')}`);
        return date.toLocaleDateString('pl-PL');
      }
    }
    
    console.log(`Could not format date, returning original: "${dateValue}"`);
    return String(dateValue);
  } catch (error) {
    console.error(`Error formatting date "${dateValue}":`, error);
    return String(dateValue);
  }
};
