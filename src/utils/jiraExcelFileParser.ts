
import * as XLSX from 'xlsx';
import { JiraExcelRow } from '@/types/jira';

export const parseJiraExcelFile = async (file: File): Promise<JiraExcelRow[]> => {
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
          const parsedRow: JiraExcelRow = {
            rowIndex: index,
            columnA: row[0], // Creation date
            columnB: row[1], // NUMER JIRA (np. P06831-25309) - TYLKO NUMER!
            columnC: row[2], // Column C
            columnD: row[3], // Description (hex number search)
            columnE: row[4], // Status
            columnF: row[5], // Column F
            columnG: row[6], // Fix
            fullRow: row    // Całe row dla debugowania
          };
          
          console.log(`Parsed Jira row ${index}:`, parsedRow);
          console.log(`NUMER JIRA Z EXCELA (columnB): "${row[1]}"`);
          console.log(`TYP columnB:`, typeof row[1]);
          
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
