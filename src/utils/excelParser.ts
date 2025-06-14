
import * as XLSX from 'xlsx';

export interface ExcelData {
  [key: string]: any;
}

export interface ExcelMatchData {
  dtcText?: string;
  suspensionPeriod?: string;
  troubleshootingTime?: string;
  qualificationCondition?: string;
  resetCondition?: string;
  enableCondition?: string;
}

export const parseExcelFile = async (file: File): Promise<ExcelData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log("Reading Excel file...");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Take first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log(`Processing sheet: ${firstSheetName}`);
        
        // Convert to JSON with row arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log("Excel data preview:", jsonData.slice(0, 5));
        
        // Transform to objects with column indices
        const result = jsonData.slice(1).map((row: any[], index) => {
          const obj: ExcelData = { 
            rowIndex: index,
            columnA: row[0], // DTC-DFCC (Hex number for comparison)
            columnH: row[7], // DTC-DFCC Text (error description)
            columnK: row[10], // Suspension period
            columnL: row[11], // Troubleshooting/qualification time
            columnP: row[15], // Qualification / error setting condition
            columnQ: row[16], // Reset condition
            columnR: row[17]  // EnableCondition
          };
          return obj;
        });
        
        console.log(`Parsed ${result.length} Excel rows`);
        resolve(result);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsArrayBuffer(file);
  });
};

export const matchExcelData = (htmlGroups: any[], excelData: ExcelData[]): any[] => {
  console.log("Starting Excel data matching...");
  
  return htmlGroups.map(group => {
    // Extract hex number without $ prefix from HTML
    const htmlHex = group.number2.replace('$', '').toUpperCase();
    console.log(`Searching for hex ${htmlHex} in Excel data...`);
    
    const matchingRow = excelData.find(row => {
      // Extract hex number without 0x prefix from Excel column A
      const excelHex = row.columnA?.toString().replace('0x', '').replace('0X', '').toUpperCase();
      const match = excelHex === htmlHex;
      
      if (match) {
        console.log(`Found exact match: HTML ${htmlHex} matches Excel ${excelHex}`);
      }
      
      return match;
    });
    
    if (matchingRow) {
      console.log(`Match found for ${group.number2}:`, matchingRow);
      
      // Extract Excel data according to specifications
      const excelMatchData: ExcelMatchData = {
        dtcText: matchingRow.columnH?.toString() || undefined,
        suspensionPeriod: matchingRow.columnK?.toString() || undefined,
        troubleshootingTime: matchingRow.columnL?.toString() || undefined,
        qualificationCondition: matchingRow.columnP?.toString() || undefined,
        resetCondition: matchingRow.columnQ?.toString() || undefined,
        enableCondition: matchingRow.columnR?.toString() || undefined
      };
      
      return {
        ...group,
        // Replace description with Excel DTC Text if available
        description: excelMatchData.dtcText || group.description,
        excelData: excelMatchData
      };
    } else {
      console.log(`No match found for ${group.number2} (${htmlHex})`);
      return group;
    }
  });
};
