
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ExcelUploader } from "@/components/ExcelUploader";
import { ResultsList } from "@/components/ResultsList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ParsedGroup {
  id: string;
  firstLine: string;
  number1: string;
  number2: string;
  number3: string;
  description: string;
  date?: string;
  odometer?: string;
  priority?: string;
  frequency?: string;
  dtcStatus?: string;
  excelData?: any;
}

const Index = () => {
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!htmlFile) {
      toast({
        title: "Błąd",
        description: "Proszę wybrać plik HTML",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const htmlContent = await htmlFile.text();
      console.log("HTML content loaded, starting parsing...");
      
      // Tutaj będzie logika parsowania
      const groups = parseHtmlContent(htmlContent);
      
      if (excelFile) {
        console.log("Processing Excel file...");
        // Tutaj będzie logika dopasowywania z Excelem
      }
      
      setParsedGroups(groups);
      toast({
        title: "Sukces",
        description: `Przetworzono ${groups.length} grup danych`,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas przetwarzania plików",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseHtmlContent = (content: string): ParsedGroup[] => {
    // Podstawowa implementacja parsera - będzie rozwijana
    const groups: ParsedGroup[] = [];
    
    // Symulacja parsowania - na razie zwracam przykładowe dane
    console.log("Parsing HTML content...", content.substring(0, 200));
    
    return groups;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">HTML Excel Harmonizer</h1>
          <p className="text-muted-foreground">
            Aplikacja do analizy plików HTML z błędami diagnostycznymi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Plik HTML</h2>
            <FileUploader
              onFileSelect={setHtmlFile}
              selectedFile={htmlFile}
              accept=".html,.htm"
              title="Przeciągnij plik HTML tutaj"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Plik Excel (opcjonalny)</h2>
            <ExcelUploader
              onFileSelect={setExcelFile}
              selectedFile={excelFile}
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
            {isProcessing ? "Przetwarzanie..." : "Search"}
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
