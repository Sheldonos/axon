import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Calculator } from "lucide-react";
import { format } from "date-fns";

export default function TermSheets() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: termSheets = [], isLoading } = trpc.termSheets.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      pending_approval: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace(/_/g, ' ')}</Badge>;
  };
  
  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Term Sheets</h1>
              <p className="text-muted-foreground mt-1">
                Smart contracts for OTC derivatives
              </p>
            </div>
            
            <Button onClick={() => navigate('/term-sheets/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Term Sheet
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Term Sheets</CardTitle>
                <CardDescription>View and manage derivative contracts</CardDescription>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading term sheets...</div>
            ) : termSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Term Sheets Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first smart term sheet to get started
                </p>
                <Button onClick={() => navigate('/term-sheets/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Term Sheet
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Instrument Type</TableHead>
                    <TableHead>Notional Amount</TableHead>
                    <TableHead>Maturity Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termSheets.map((ts) => (
                    <TableRow 
                      key={ts.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/term-sheets/${ts.id}`)}
                    >
                      <TableCell className="font-mono">#{ts.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {ts.instrumentType.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {ts.underlyingAsset && (
                            <span className="text-xs text-muted-foreground">
                              {ts.underlyingAsset}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(ts.notionalAmount, ts.currency)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(ts.maturityDate), 'PP')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ts.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ts.createdAt), 'PP')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/term-sheets/${ts.id}/risk`);
                            }}
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            Risk
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/term-sheets/${ts.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
