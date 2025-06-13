
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Wyniki analizy ({groups.length} grup)</h2>
      
      <div className="space-y-4">
        {sortedGroups.map((group, index) => (
          <Card key={group.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{group.firstLine}</span>
                <Badge variant={group.date && group.odometer ? "default" : "secondary"}>
                  {group.date && group.odometer ? "Kompletne dane" : "Niekompletne"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Numery:</span>
                  <p>Numer1: {group.number1}</p>
                  <p>Numer2: {group.number2}</p>
                  <p>Numer3: {group.number3}</p>
                </div>
                
                <div>
                  <span className="font-medium">Dane diagnostyczne:</span>
                  {group.date && <p>Date: {group.date}</p>}
                  {group.odometer && <p>Odometer: {group.odometer}</p>}
                  {group.priority && <p>Priority: {group.priority}</p>}
                </div>
                
                <div>
                  <span className="font-medium">Status:</span>
                  {group.frequency && <p>Frequency: {group.frequency}</p>}
                  {group.dtcStatus && <p>DTC Status: {group.dtcStatus}</p>}
                </div>
              </div>
              
              {group.excelData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm">Dane z Excel:</span>
                  <pre className="text-xs mt-1 overflow-x-auto">
                    {JSON.stringify(group.excelData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
