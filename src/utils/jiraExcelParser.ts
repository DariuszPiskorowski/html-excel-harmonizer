
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
        console.log("Jira Excel raw data preview (first 10 rows):", jsonData.slice(0, 10));
        
        const result = jsonData.slice(1).map((row: any[], index) => {
          const parsedRow = {
            rowIndex: index,
            columnA: row[0], // Creation date
            columnB: row[1], // Link
            columnD: row[3], // Description (hex number search)
            columnE: row[4], // Status
            columnG: row[6]  // Fix
          };
          
          console.log(`Jira Row ${index}:`, parsedRow);
          return parsedRow;
        });
        
        console.log(`Parsed ${result.length} Jira Excel rows`);
        console.log("All Jira data with columnD values:", result.map((r, i) => ({ 
          rowIndex: i, 
          columnD: r.columnD,
          columnDType: typeof r.columnD,
          columnDString: String(r.columnD || '').trim()
        })));
        
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
  console.log("=== STARTING JIRA EXCEL DATA MATCHING ===");
  console.log("HTML groups to match:", htmlGroups.map(g => ({ 
    id: g.id, 
    number2: g.number2,
    number2Clean: g.number2.replace('$', '').toUpperCase()
  })));
  
  console.log("Jira data column D values:", jiraData.map((j, i) => ({ 
    rowIndex: i,
    columnD: j.columnD,
    columnDType: typeof j.columnD,
    columnDString: String(j.columnD || '').trim(),
    columnDUpper: String(j.columnD || '').trim().toUpperCase()
  })));
  
  return htmlGroups.map(group => {
    const htmlHex = group.number2.replace('$', '').toUpperCase();
    console.log(`\n--- Searching for hex "${htmlHex}" (from "${group.number2}") ---`);
    
    // Find all matching rows (not just first one)
    const matchingRows = jiraData.filter((row, index) => {
      const jiraHexRaw = String(row.columnD || '').trim();
      console.log(`  Checking Row ${index}: columnD = "${jiraHexRaw}" (type: ${typeof row.columnD})`);
      
      if (!jiraHexRaw) {
        console.log(`    ❌ Empty columnD value`);
        return false;
      }
      
      // Try different variations of hex matching
      const jiraHexVariations = [
        jiraHexRaw.toUpperCase(),
        jiraHexRaw.replace('$', '').toUpperCase(),
        jiraHexRaw.replace('0x', '').toUpperCase(),
        jiraHexRaw.replace('0X', '').toUpperCase(),
        jiraHexRaw.replace(/[^A-Fa-f0-9]/g, '').toUpperCase(),
        jiraHexRaw.replace(/\s+/g, '').toUpperCase()
      ];
      
      console.log(`    Variations to test: [${jiraHexVariations.join(', ')}]`);
      console.log(`    Looking for: "${htmlHex}"`);
      
      const match = jiraHexVariations.some(variation => {
        const isMatch = variation === htmlHex;
        console.log(`      "${variation}" === "${htmlHex}" ? ${isMatch}`);
        return isMatch;
      });
      
      if (match) {
        console.log(`    ✅ MATCH FOUND: HTML "${htmlHex}" matches Jira "${jiraHexRaw}"`);
      } else {
        console.log(`    ❌ No match for "${jiraHexRaw}"`);
      }
      
      return match;
    });
    
    if (matchingRows.length > 0) {
      console.log(`✅ Found ${matchingRows.length} Jira matches for ${group.number2}`);
      
      const jiraMatches: JiraExcelData[] = matchingRows.map(row => ({
        creationDate: row.columnA ? formatJiraDate(row.columnA.toString()) : undefined,
        link: row.columnB?.toString() || undefined,
        description: row.columnD?.toString() || undefined,
        status: row.columnE?.toString() || undefined,
        fix: row.columnG?.toString() || undefined
      }));
      
      return {
        ...group,
        jiraData: jiraMatches
      };
    } else {
      console.log(`❌ No Jira matches found for ${group.number2} (searching for: ${htmlHex})`);
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
