
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ExcelUploader } from "@/components/ExcelUploader";
import { JiraExcelUploader } from "@/components/JiraExcelUploader";
import { ResultsList } from "@/components/ResultsList";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const { toast } = useToast();

  // Helper function to allow browser to "breathe" during heavy operations
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    setProcessingProgress(0);
    
    try {
      console.log("=== Starting file processing ===");
      
      // Step 1: Parse HTML file
      setProcessingStep("Parsing HTML file...");
      setProcessingProgress(10);
      await sleep(10); // Allow UI to update
      
      const htmlContent = await htmlFile.text();
      console.log("HTML content loaded, starting parsing...");
      
      const groups = parseHtmlContent(htmlContent);
      console.log(`HTML parsing complete. Found ${groups.length} groups.`);
      
      setProcessingProgress(30);
      await sleep(10);
      
      let finalGroups = groups;
      
      // Step 2: Process DTC Excel file if available
      if (excelFile) {
        setProcessingStep("Processing DTC Excel file...");
        setProcessingProgress(40);
        await sleep(10);
        
        try {
          const excelData = await parseExcelFile(excelFile);
          console.log(`DTC Excel parsing complete. Found ${excelData.length} rows.`);
          
          setProcessingStep("Matching DTC Excel data...");
          setProcessingProgress(60);
          await sleep(10);
          
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

      // Step 3: Process Jira Excel file if available
      if (jiraExcelFile) {
        setProcessingStep("Processing Jira Excel file...");
        setProcessingProgress(70);
        await sleep(10);
        
        try {
          const jiraData = await parseJiraExcelFile(jiraExcelFile);
          console.log(`Jira Excel parsing complete. Found ${jiraData.length} rows.`);
          
          setProcessingStep("Matching Jira Excel data...");
          setProcessingProgress(85);
          await sleep(10);
          
          // Break up the heavy Jira matching operation
          finalGroups = await matchJiraExcelDataAsync(finalGroups, jiraData);
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
      
      setProcessingStep("Finalizing results...");
      setProcessingProgress(95);
      await sleep(10);
      
      setParsedGroups(finalGroups);
      setProcessingProgress(100);
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
      setProcessingStep("");
      setProcessingProgress(0);
    }
  };

  // Async version of Jira matching to prevent browser timeout
  const matchJiraExcelDataAsync = async (htmlGroups: ParsedGroup[], jiraData: any[]): Promise<ParsedGroup[]> => {
    const result: ParsedGroup[] = [];
    
    for (let i = 0; i < htmlGroups.length; i++) {
      // Process in batches and allow browser to breathe
      if (i % 5 === 0 && i > 0) {
        await sleep(1); // Very short pause every 5 items
        setProcessingProgress(85 + (i / htmlGroups.length) * 10); // Update progress
      }
      
      const group = htmlGroups[i];
      const processedGroup = matchJiraExcelData([group], jiraData)[0];
      result.push(processedGroup);
    }
    
    return result;
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

        {isProcessing && (
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={processingProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {processingStep}
            </p>
          </div>
        )}

        {parsedGroups.length > 0 && (
          <ResultsList groups={parsedGroups} />
        )}
      </div>
    </div>
  );
};

export default Index;
