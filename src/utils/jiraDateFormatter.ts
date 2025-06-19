
export const formatJiraDate = (dateValue: string | number): string => {
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
