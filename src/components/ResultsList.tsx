import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, EyeOff, Eye, FileDown } from "lucide-react";
import jsPDF from "jspdf";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Sort: groups with a date first, then the rest
  const sortedGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const aHasDate = a.date ? 1 : 0;
        const bHasDate = b.date ? 1 : 0;
        if (aHasDate !== bHasDate) return bHasDate - aHasDate;
        const aHasOdo = a.odometer ? 1 : 0;
        const bHasOdo = b.odometer ? 1 : 0;
        return bHasOdo - aHasOdo;
      }),
    [groups]
  );

  const visibleGroups = sortedGroups.filter((g) => !hiddenIds.has(g.id));

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const hideSelected = () => {
    setHiddenIds((prev) => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
  };

  const showAll = () => setHiddenIds(new Set());

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    const write = (text: string, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += size + 4;
      });
    };

    write("Analysis Results", 16, true);
    write(`Groups: ${visibleGroups.length}`, 10);
    y += 6;

    visibleGroups.forEach((group, i) => {
      y += 8;
      write(`${i + 1}. ${group.firstLine}`, 12, true);
      write(`Code: ${group.number1}   Hex: $${group.number2}`);
      write(`Date: ${group.date || "No data"}   Odometer: ${group.odometer || "No data"}`);
      if (group.priority) write(`Priority: ${group.priority}`);
      if (group.frequency) write(`Frequency: ${group.frequency}`);
      if (group.dtcStatus) write(`DTC Status: ${group.dtcStatus}`);
      if (group.description) write(`Description: ${group.description}`);

      const e = group.excelData;
      if (e) {
        write("DTC Excel data:", 10, true);
        if (e.suspensionPeriod) write(`  Suspension period: ${e.suspensionPeriod}`);
        if (e.troubleshootingTime) write(`  Troubleshooting time: ${e.troubleshootingTime}`);
        if (e.qualificationCondition) write(`  Qualification condition: ${e.qualificationCondition}`);
        if (e.resetCondition) write(`  Reset condition: ${e.resetCondition}`);
        if (e.enableCondition) write(`  Enable condition: ${e.enableCondition}`);
      }

      if (group.jiraData && group.jiraData.length > 0) {
        write(`Jira entries (${group.jiraData.length}):`, 10, true);
        group.jiraData.forEach((j, idx) => {
          if (j.creationDate) write(`  [${idx + 1}] Creation Date: ${j.creationDate}`);
          if (j.status) write(`  [${idx + 1}] Status: ${j.status}`);
          if (j.description) write(`  [${idx + 1}] Description: ${j.description}`);
          if (j.fix) write(`  [${idx + 1}] Fix: ${j.fix}`);
          if (j.link) write(`  [${idx + 1}] Link: ${j.link}`);
        });
      }
    });

    doc.save("analysis-results.pdf");
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Analysis Results</h2>
        <p className="text-muted-foreground">
          Showing {visibleGroups.length} of {groups.length} diagnostic error groups
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={hideSelected} disabled={selectedIds.size === 0}>
          <EyeOff className="h-4 w-4 mr-2" />
          Hide selected ({selectedIds.size})
        </Button>
        <Button variant="outline" onClick={showAll} disabled={hiddenIds.size === 0}>
          <Eye className="h-4 w-4 mr-2" />
          Show all ({hiddenIds.size} hidden)
        </Button>
        <Button onClick={exportPdf} disabled={visibleGroups.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Save as PDF
        </Button>
      </div>

      <div className="space-y-4">
        {visibleGroups.map((group, index) => {
          return (
            <div key={group.id}>
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(group.id)}
                        onCheckedChange={(checked) => toggleSelected(group.id, checked === true)}
                        aria-label="Select group to hide"
                      />
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {group.firstLine}
                      </span>
                    </div>
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
                          {group.jiraData.map((jiraEntry, jiraIndex) => {
                            console.log(`Rendering Jira entry ${jiraIndex}:`, jiraEntry);
                            console.log(`LINK DO RENDEROWANIA: "${jiraEntry.link}"`);
                            
                            return (
                              <div key={jiraIndex} className="bg-white p-3 rounded border border-blue-200">
                                <div className="space-y-2 text-sm">
                                  {jiraEntry.creationDate && (
                                    <p className="text-blue-600">
                                      <span className="font-medium text-blue-700">Creation Date:</span> {jiraEntry.creationDate}
                                    </p>
                                  )}
                                  {jiraEntry.status && (
                                    <p className="text-blue-600">
                                      <span className="font-medium text-blue-700">Status:</span> {jiraEntry.status}
                                    </p>
                                  )}
                                  {jiraEntry.description && (
                                    <p className="text-blue-600">
                                      <span className="font-medium text-blue-700">Description:</span> {jiraEntry.description}
                                    </p>
                                  )}
                                  {jiraEntry.fix && (
                                    <p className="text-blue-600">
                                      <span className="font-medium text-blue-700">Fix:</span> {jiraEntry.fix}
                                    </p>
                                  )}
                                  {jiraEntry.link && (
                                    <p className="flex items-center gap-2">
                                      <span className="font-medium text-blue-700">Link:</span>
                                      <a 
                                        href={jiraEntry.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                      >
                                        {jiraEntry.link}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
          );
        })}
      </div>
    </div>
  );
};
