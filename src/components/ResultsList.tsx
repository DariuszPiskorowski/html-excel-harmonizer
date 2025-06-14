
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

interface ResultsListProps {
  groups: ParsedGroup[];
}

export const ResultsList = ({ groups }: ResultsListProps) => {
  // Sortowanie: najpierw grupy z date i odometer, potem reszta
  const sortedGroups = [...groups].sort((a, b) => {
    const aHasDateOdometer = a.date && a.odometer;
    const bHasDateOdometer = b.date && b.odometer;
    
    if (aHasDateOdometer && !bHasDateOdometer) return -1;
    if (!aHasDateOdometer && bHasDateOdometer) return 1;
    return 0;
  });

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Wyniki analizy</h2>
        <p className="text-muted-foreground">
          Znaleziono {groups.length} grup błędów diagnostycznych
        </p>
      </div>
      
      <div className="space-y-4">
        {sortedGroups.map((group, index) => (
          <div key={group.id}>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {group.firstLine}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant={group.date && group.odometer ? "default" : "secondary"}>
                      {group.date && group.odometer ? "Kompletne dane" : "Niekompletne"}
                    </Badge>
                    {group.excelData && (
                      <Badge variant="outline" className="bg-green-50">
                        Excel ✓
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Identyfikatory:</span>
                    <div className="space-y-1">
                      <p><span className="font-medium">Numer1:</span> {group.number1}</p>
                      <p><span className="font-medium">Numer2:</span> ${group.number2}</p>
                      <p><span className="font-medium">Numer3:</span> {group.number3}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Dane diagnostyczne:</span>
                    <div className="space-y-1">
                      <p><span className="font-medium">Date:</span> {group.date || "Brak danych"}</p>
                      <p><span className="font-medium">Odometer:</span> {group.odometer || "Brak danych"}</p>
                      {group.priority && <p><span className="font-medium">Priority:</span> {group.priority}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Status i częstotliwość:</span>
                    <div className="space-y-1">
                      {group.frequency && <p><span className="font-medium">Frequency:</span> {group.frequency}</p>}
                      {group.dtcStatus && <p><span className="font-medium">DTC Status:</span> {group.dtcStatus}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg">
                  <span className="font-medium text-sm">Opis:</span>
                  <p className="text-sm mt-1">{group.description}</p>
                </div>
                
                {group.excelData && (
                  <>
                    <Separator />
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <span className="font-medium text-sm text-green-800">Dane z Excel (0x{group.number2}):</span>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {Object.entries(group.excelData)
                          .filter(([key, value]) => key !== 'rowIndex' && value !== null && value !== undefined && value !== '')
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium text-green-700">{key}:</span>
                              <span className="text-green-600">{String(value)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {index < sortedGroups.length - 1 && (
              <Separator className="my-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
