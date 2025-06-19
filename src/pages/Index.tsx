
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ExcelUploader } from "@/components/ExcelUploader";
import { JiraExcelUploader } from "@/components/JiraExcelUploader";
import { ResultsList } from "@/components/ResultsList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseHtmlContent } from "@/utils/htmlParser";
import { parseExcelFile, matchExcelData, ExcelData } from "@/utils/excelParser";
import { parseJiraExcelFile, matchJiraExcelData } from "@/utils/jiraExcelParser";

interface ParsedGroup {
  id: string;
  firstLine: string;
  number1: string;
  number2: string;
  description: string;
  date?: string;
  odometer?: string;
  priority?: string;
  frequency?: string;
  dtcStatus?: string;
  excelData?: any;
  jiraData?: Array<{
    creationDate?: string;
    link?: string;
    description?: string;
    status?: string;
    fix?: string;
  }>;
}

const Index = () => {
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [jiraExcelFile, setJiraExcelFile] = useState<File | null>(null);
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!htmlFile) {
      toast({
        title: "Error",
        description: "Please select an HTML file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log("=== Starting file processing ===");
      
      // Parsuj plik HTML
      const htmlContent = await htmlFile.text();
      console.log("HTML content loaded, starting parsing...");
      
      const groups = parseHtmlContent(htmlContent);
      console.log(`HTML parsing complete. Found ${groups.length} groups.`);
      
      let finalGroups = groups;
      
      // Jeśli jest plik DTC Excel, parsuj go i dopasuj dane
      if (excelFile) {
        console.log("Processing DTC Excel file...");
        try {
          const excelData = await parseExcelFile(excelFile);
          console.log(`DTC Excel parsing complete. Found ${excelData.length} rows.`);
          
          finalGroups = matchExcelData(finalGroups, excelData);
          console.log("DTC Excel data matching complete.");
        } catch (excelError) {
          console.error("DTC Excel processing error:", excelError);
          toast({
            title: "Warning",
            description: "Error processing DTC Excel file. Continuing without DTC Excel data.",
            variant: "destructive",
          });
        }
      }

      // Jeśli jest plik Jira Excel, parsuj go i dopasuj dane
      if (jiraExcelFile) {
        console.log("Processing Jira Excel file...");
        try {
          const jiraData = await parseJiraExcelFile(jiraExcelFile);
          console.log(`Jira Excel parsing complete. Found ${jiraData.length} rows.`);
          
          finalGroups = matchJiraExcelData(finalGroups, jiraData);
          console.log("Jira Excel data matching complete.");
        } catch (jiraError) {
          console.error("Jira Excel processing error:", jiraError);
          toast({
            title: "Warning",
            description: "Error processing Jira Excel file. Continuing without Jira Excel data.",
            variant: "destructive",
          });
        }
      }
      
      setParsedGroups(finalGroups);
      console.log("=== Processing complete ===");
      
      toast({
        title: "Success",
        description: `Processed ${finalGroups.length} data groups`,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">HTML Excel Harmonizer</h1>
          <p className="text-muted-foreground">
            Application for analyzing HTML files with diagnostic errors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">HTML File</h2>
            <FileUploader
              onFileSelect={setHtmlFile}
              selectedFile={htmlFile}
              accept=".html,.htm"
              title="Drag HTML file here"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">DTC Excel File</h2>
            <ExcelUploader
              onFileSelect={setExcelFile}
              selectedFile={excelFile}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Jira Excel (optional)</h2>
            <JiraExcelUploader
              onFileSelect={setJiraExcelFile}
              selectedFile={jiraExcelFile}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSearch}
            disabled={!htmlFile || isProcessing}
            size="lg"
            className="px-8"
          >
            {isProcessing ? "Processing..." : "Search"}
          </Button>
        </div>

        {parsedGroups.length > 0 && (
          <ResultsList groups={parsedGroups} />
        )}
      </div>
    </div>
  );
};

export default Index;
