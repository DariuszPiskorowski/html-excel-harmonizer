export const datePatterns = [
  // Główny wzorzec dla formatu "Date [czas] - [data]"
  /Date\s+([0-9]{1,2}:[0-9]{2}:[0-9]{2}\s*-\s*[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4})/i,
  // Alternatywne wzorce dla różnych formatów
  /Date\s+([0-9]{1,2}:[0-9]{2}:[0-9]{2}\s*-\s*[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i,
  /Date\s+([0-9]{1,2}:[0-9]{2}:[0-9]{2}\s*-\s*[0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/i,
  // Fallback wzorce dla przypadków bez czasu
  /Date reading[:\s]*([^\s]+)/i,
  /Date[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
  /Date[:\s]*([0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
  /Date[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}\s+[0-9]{1,2}:[0-9]{2})/i
];

export const odometerPatterns = [
  /Odometer reading[:\s]*([^\s]+)/i,
  /Odometer[:\s]*([0-9]+(?:\.[0-9]+)?)/i,
  /Mileage[:\s]*([0-9]+(?:\.[0-9]+)?)/i,
  /Odometer[:\s]*([0-9]+\s*(?:km|miles?))/i
];

// Wzorzec DTC obsługujący różne formaty hex kodów (z $ i bez $)
export const dtcPattern = /DTC_MASK\s*[:\$]*\s*([A-Fa-f0-9]+)\s*[\/\\]\s*([A-Fa-f0-9]+)\s+([A-Z0-9]+)\s*\(\s*\$?\s*([A-Fa-f0-9]+)\s*[\/\\]\s*(\d+)\s*\)/g;

export const pCodePattern = /([P][A-Z0-9]{6})\s*\(\$([A-Fa-f0-9]+)\s*\/\s*(\d+)\)/g;
