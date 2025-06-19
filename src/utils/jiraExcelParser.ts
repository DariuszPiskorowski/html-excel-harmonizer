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
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log(`Processing Jira sheet: ${firstSheetName}`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`Jira Excel total rows: ${jsonData.length}`);
        console.log("Jira Excel raw data preview (first 10 rows):", jsonData.slice(0, 10));
        
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
          
          console.log(`Parsed Jira row ${index}:`, parsedRow);
          return parsedRow;
        });
        
        console.log(`=== JIRA PARSING COMPLETE: ${result.length} rows ===`);
        console.log("First 5 parsed Jira rows:", result.slice(0, 5));
        
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
  
  console.log("HTML groups hex values:", htmlGroups.map(g => ({ 
    id: g.id, 
    number2: g.number2,
    number2Clean: g.number2.replace('$', '').toUpperCase()
  })));
  
  const matchedResults = htmlGroups.map(group => {
    const htmlHex = group.number2.replace('$', '').toUpperCase();
    console.log(`\n--- SEARCHING FOR HEX "${htmlHex}" (from "${group.number2}") ---`);
    
    // Znajdź WSZYSTKIE pasujące wiersze
    const matchingRows = jiraData.filter((row, index) => {
      const jiraHexRaw = String(row.columnD || '').trim();
      console.log(`  Checking Jira row ${index}: columnD = "${jiraHexRaw}" (type: ${typeof row.columnD})`);
      
      if (!jiraHexRaw) {
        console.log(`    ❌ Empty columnD value`);
        return false;
      }
      
      // Test different hex matching variations
      const jiraHexVariations = [
        jiraHexRaw.toUpperCase(),
        jiraHexRaw.replace('$', '').toUpperCase(),
        jiraHexRaw.replace('0x', '').toUpperCase(),
        jiraHexRaw.replace('0X', '').toUpperCase(),
        jiraHexRaw.replace(/[^A-Fa-f0-9]/g, '').toUpperCase(),
        jiraHexRaw.replace(/\s+/g, '').toUpperCase()
      ];
      
      console.log(`    Testing variations: [${jiraHexVariations.join(', ')}]`);
      console.log(`    Looking for: "${htmlHex}"`);
      
      const match = jiraHexVariations.some(variation => {
        const isMatch = variation === htmlHex || variation.includes(htmlHex) || htmlHex.includes(variation);
        console.log(`      "${variation}" matches "${htmlHex}" ? ${isMatch}`);
        return isMatch;
      });
      
      if (match) {
        console.log(`    ✅ MATCH FOUND: HTML "${htmlHex}" matches Jira "${jiraHexRaw}"`);
      }
      
      return match;
    });
    
    console.log(`Found ${matchingRows.length} Jira matches for ${group.number2}`);
    
    if (matchingRows.length > 0) {
      const jiraMatches = matchingRows.map(row => {
        const jiraMatch = {
          creationDate: row.columnA ? formatJiraDate(row.columnA.toString()) : undefined,
          link: row.columnB?.toString() || undefined,
          description: row.columnD?.toString() || undefined,
          status: row.columnE?.toString() || undefined,
          fix: row.columnG?.toString() || undefined
        };
        console.log(`Jira match data:`, jiraMatch);
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
      return group;
    }
  });
  
  console.log("=== JIRA MATCHING COMPLETE ===");
  console.log("Final matched results:", matchedResults.map(r => ({
    id: r.id,
    number2: r.number2,
    hasJiraData: !!r.jiraData,
    jiraDataLength: r.jiraData?.length || 0
  })));
  
  return matchedResults;
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
