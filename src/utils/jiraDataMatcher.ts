
import { JiraExcelRow, JiraExcelData } from '@/types/jira';
import { formatJiraDate } from './jiraDateFormatter';

export const matchJiraExcelData = (htmlGroups: any[], jiraData: JiraExcelRow[]): any[] => {
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
        // TWORZENIE LINKU: https://jira.kostal.com/browse/ + numer z pliku
        const jiraNumber = row.columnB;
        let finalLink = undefined;
        
        console.log(`NUMER JIRA Z EXCELA (columnB): "${jiraNumber}"`);
        console.log(`TYP NUMERU: ${typeof jiraNumber}`);
        
        if (jiraNumber !== undefined && jiraNumber !== null && jiraNumber !== '') {
          const cleanNumber = String(jiraNumber).trim();
          finalLink = `https://jira.kostal.com/browse/${cleanNumber}`;
          console.log(`UTWORZONY LINK: "${finalLink}"`);
        }
        
        const jiraMatch: JiraExcelData = {
          creationDate: row.columnA ? formatJiraDate(row.columnA.toString()) : undefined,
          link: finalLink,
          description: row.columnD?.toString() || undefined,
          status: row.columnE?.toString() || undefined,
          fix: row.columnG?.toString() || undefined
        };
        
        console.log(`KOŃCOWY JIRA MATCH Z NOWYM LINKIEM:`, jiraMatch);
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
