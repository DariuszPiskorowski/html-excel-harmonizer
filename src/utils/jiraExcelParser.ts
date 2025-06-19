
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
        console.log("Jira Excel data preview:", jsonData.slice(0, 5));
        
        const result = jsonData.slice(1).map((row: any[], index) => {
          return {
            rowIndex: index,
            columnA: row[0], // Creation date
            columnB: row[1], // Link
            columnD: row[3], // Description (hex number search)
            columnE: row[4], // Status
            columnG: row[6]  // Fix
          };
        });
        
        console.log(`Parsed ${result.length} Jira Excel rows`);
        resolve(result);
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
  console.log("Starting Jira Excel data matching...");
  
  return htmlGroups.map(group => {
    const htmlHex = group.number2.replace('$', '').toUpperCase();
    console.log(`Searching for hex ${htmlHex} in Jira Excel data...`);
    
    // Find all matching rows (not just first one)
    const matchingRows = jiraData.filter(row => {
      const jiraHex = row.columnD?.toString().replace('$', '').replace('0x', '').replace('0X', '').toUpperCase();
      const match = jiraHex === htmlHex;
      
      if (match) {
        console.log(`Found Jira match: HTML ${htmlHex} matches Jira ${jiraHex}`);
      }
      
      return match;
    });
    
    if (matchingRows.length > 0) {
      console.log(`Found ${matchingRows.length} Jira matches for ${group.number2}`);
      
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
      console.log(`No Jira matches found for ${group.number2} (${htmlHex})`);
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
