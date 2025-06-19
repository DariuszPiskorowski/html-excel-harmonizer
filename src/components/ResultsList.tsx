
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";

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
  excelData?: {
    dtcText?: string;
    suspensionPeriod?: string;
    troubleshootingTime?: string;
    qualificationCondition?: string;
    resetCondition?: string;
    enableCondition?: string;
  };
  jiraData?: Array<{
    creationDate?: string;
    link?: string;
    description?: string;
    status?: string;
    fix?: string;
  }>;
}

interface ResultsListProps {
  groups: ParsedGroup[];
}

export const ResultsList = ({ groups }: ResultsListProps) => {
  // Sort: first groups with date and odometer, then others
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
        <h2 className="text-2xl font-semibold">Analysis Results</h2>
        <p className="text-muted-foreground">
          Found {groups.length} diagnostic error groups
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
                      {group.date && group.odometer ? "Complete data" : "Incomplete"}
                    </Badge>
                    {group.excelData && (
                      <Badge variant="outline" className="bg-green-50">
                        DTC Excel ✓
                      </Badge>
                    )}
                    {group.jiraData && group.jiraData.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50">
                        Jira Excel ({group.jiraData.length})
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Identifiers:</span>
                    <div className="space-y-1">
                      <p><span className="font-medium">Code:</span> {group.number1}</p>
                      <p><span className="font-medium">Hex:</span> ${group.number2}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Diagnostic data:</span>
                    <div className="space-y-1">
                      <p><span className="font-medium">Date:</span> {group.date || "No data"}</p>
                      <p><span className="font-medium">Odometer:</span> {group.odometer || "No data"}</p>
                      {group.priority && <p><span className="font-medium">Priority:</span> {group.priority}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-medium text-muted-foreground">Status and frequency:</span>
                    <div className="space-y-1">
                      {group.frequency && <p><span className="font-medium">Frequency:</span> {group.frequency}</p>}
                      {group.dtcStatus && <p><span className="font-medium">DTC Status:</span> {group.dtcStatus}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg">
                  <span className="font-medium text-sm">Description:</span>
                  <p className="text-sm mt-1">{group.description}</p>
                </div>
                
                {group.excelData && (
                  <>
                    <Separator />
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <span className="font-medium text-sm text-green-800 mb-3 block">
                        DTC Excel data for Hex ${group.number2}:
                      </span>
                      <div className="space-y-2 text-sm">
                        {group.excelData.suspensionPeriod && (
                          <div className="flex justify-between">
                            <span className="font-medium text-green-700">Suspension period:</span>
                            <span className="text-green-600">{group.excelData.suspensionPeriod}</span>
                          </div>
                        )}
                        {group.excelData.troubleshootingTime && (
                          <div className="flex justify-between">
                            <span className="font-medium text-green-700">Troubleshooting/qualification time:</span>
                            <span className="text-green-600">{group.excelData.troubleshootingTime}</span>
                          </div>
                        )}
                        {group.excelData.qualificationCondition && (
                          <div className="flex justify-between">
                            <span className="font-medium text-green-700">Qualification / error setting condition:</span>
                            <span className="text-green-600">{group.excelData.qualificationCondition}</span>
                          </div>
                        )}
                        {group.excelData.resetCondition && (
                          <div className="flex justify-between">
                            <span className="font-medium text-green-700">Reset condition:</span>
                            <span className="text-green-600">{group.excelData.resetCondition}</span>
                          </div>
                        )}
                        {group.excelData.enableCondition && (
                          <div className="flex justify-between">
                            <span className="font-medium text-green-700">EnableCondition:</span>
                            <span className="text-green-600">{group.excelData.enableCondition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {group.jiraData && group.jiraData.length > 0 && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <span className="font-medium text-sm text-blue-800 mb-3 block">
                        Jira Excel data for Hex ${group.number2} ({group.jiraData.length} entries):
                      </span>
                      <div className="space-y-4">
                        {group.jiraData.map((jiraEntry, jiraIndex) => (
                          <div key={jiraIndex} className="bg-white p-3 rounded border border-blue-200">
                            <div className="space-y-2 text-sm">
                              {jiraEntry.creationDate && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-blue-700">Creation Date:</span>
                                  <span className="text-blue-600">{jiraEntry.creationDate}</span>
                                </div>
                              )}
                              {jiraEntry.description && (
                                <div>
                                  <span className="font-medium text-blue-700">Description:</span>
                                  <p className="text-blue-600 mt-1">{jiraEntry.description}</p>
                                </div>
                              )}
                              {jiraEntry.status && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-blue-700">Status:</span>
                                  <span className="text-blue-600">{jiraEntry.status}</span>
                                </div>
                              )}
                              {jiraEntry.fix && (
                                <div>
                                  <span className="font-medium text-blue-700">Fix:</span>
                                  <p className="text-blue-600 mt-1">{jiraEntry.fix}</p>
                                </div>
                              )}
                              {jiraEntry.link && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-blue-700">Link:</span>
                                  <a 
                                    href={jiraEntry.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                  >
                                    Open Jira Issue
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
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
