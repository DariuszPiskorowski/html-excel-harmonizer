
export interface JiraExcelData {
  creationDate?: string;
  link?: string;
  description?: string;
  status?: string;
  fix?: string;
}

export interface JiraExcelRow {
  rowIndex: number;
  columnA: any; // Creation date
  columnB: any; // NUMER JIRA (np. P06831-25309) - TYLKO NUMER!
  columnC: any; // Column C
  columnD: any; // Description (hex number search)
  columnE: any; // Status
  columnF: any; // Column F
  columnG: any; // Fix
  fullRow: any[]; // Całe row dla debugowania
}
