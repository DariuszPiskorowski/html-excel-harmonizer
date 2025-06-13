
import * as XLSX from 'xlsx';

export interface ExcelData {
  [key: string]: any;
}

export const parseExcelFile = async (file: File): Promise<ExcelData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log("Reading Excel file...");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Weź pierwszy arkusz
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log(`Processing sheet: ${firstSheetName}`);
        
        // Konwertuj na JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log("Excel data preview:", jsonData.slice(0, 5));
        
        // Przekształć na obiekty z kluczami
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const result = rows.map((row, index) => {
          const obj: ExcelData = { rowIndex: index };
          headers.forEach((header, colIndex) => {
            obj[header || `col_${colIndex}`] = row[colIndex];
          });
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
    // Szukaj dopasowania na podstawie number2 ($Hex) vs 0xHex w pierwszej kolumnie Excel
    const searchValue = `0x${group.number2.toUpperCase()}`;
    console.log(`Searching for ${searchValue} in Excel data...`);
    
    const matchingRow = excelData.find(row => {
      // Sprawdź pierwszą kolumnę (lub kolumny z kluczami zawierającymi '0x')
      const firstColValue = Object.values(row)[1]?.toString().toUpperCase(); // [0] to rowIndex
      return firstColValue === searchValue || firstColValue === group.number2.toUpperCase();
    });
    
    if (matchingRow) {
      console.log(`Found match for ${group.number2}:`, matchingRow);
      return {
        ...group,
        excelData: matchingRow
      };
    } else {
      console.log(`No match found for ${group.number2}`);
      return group;
    }
  });
};
