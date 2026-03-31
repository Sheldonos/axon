import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Plus,
  FileText,
  Activity
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: trades = [], isLoading } = trpc.trades.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });
  
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; icon: any }> = {
      negotiating: { variant: 'secondary', icon: Clock },
      pending_approval: { variant: 'secondary', icon: AlertCircle },
      approved: { variant: 'default', icon: CheckCircle2 },
      executing: { variant: 'default', icon: Activity },
      executed: { variant: 'default', icon: CheckCircle2 },
      settling: { variant: 'default', icon: Clock },
      settled: { variant: 'default', icon: CheckCircle2 },
      cancelled: { variant: 'outline', icon: AlertCircle },
      failed: { variant: 'destructive', icon: AlertCircle },
    };
    
    const config = configs[status] || configs.negotiating;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };
  
  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };
  
  // Filter trades by tab
  const filteredTrades = trades.filter(item => {
    const status = item.trade.tradeStatus;
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['negotiating', 'pending_approval', 'approved', 'executing'].includes(status);
    if (activeTab === 'pending') return ['negotiating', 'pending_approval'].includes(status);
    if (activeTab === 'executed') return ['executed', 'settling', 'settled'].includes(status);
    return true;
  });
  
  // Calculate statistics
  const stats = {
    total: trades.length,
    active: trades.filter(t => ['negotiating', 'pending_approval', 'approved', 'executing'].includes(t.trade.tradeStatus)).length,
    pending: trades.filter(t => ['negotiating', 'pending_approval'].includes(t.trade.tradeStatus)).length,
    executed: trades.filter(t => ['executed', 'settling', 'settled'].includes(t.trade.tradeStatus)).length,
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Trade Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage all OTC derivative trades
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/term-sheets/new')}>
                <FileText className="h-4 w-4 mr-2" />
                New Term Sheet
              </Button>
              <Button onClick={() => navigate('/term-sheets')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Trade
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Trades</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Trades</CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.active}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Approval</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Executed</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.executed}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Trades Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Trades</CardTitle>
                  <CardDescription>View and manage trade execution</CardDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search trades..."
                      className="pl-9 w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="executing">Executing</SelectItem>
                      <SelectItem value="executed">Executed</SelectItem>
                      <SelectItem value="settling">Settling</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="executed">Executed ({stats.executed})</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-6">
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading trades...</div>
                  ) : filteredTrades.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Trades Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {search ? "Try adjusting your search criteria" : "Get started by creating your first trade"}
                      </p>
                      {!search && (
                        <Button onClick={() => navigate('/term-sheets/new')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Term Sheet
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trade ID</TableHead>
                          <TableHead>Instrument Type</TableHead>
                          <TableHead>Notional Amount</TableHead>
                          <TableHead>Counterparties</TableHead>
                          <TableHead>Maturity Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTrades.map((item) => {
                          const { trade, termSheet, counterpartyA } = item;
                          
                          return (
                            <TableRow 
                              key={trade.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/trades/${trade.id}`)}
                            >
                              <TableCell className="font-mono font-medium">#{trade.id}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {termSheet.instrumentType.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                  {termSheet.underlyingAsset && (
                                    <span className="text-xs text-muted-foreground">
                                      {termSheet.underlyingAsset}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">
                                {formatCurrency(termSheet.notionalAmount, termSheet.currency)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {counterpartyA?.name || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(new Date(termSheet.maturityDate), 'PP')}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(trade.tradeStatus)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(trade.createdAt), 'PP')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/trades/${trade.id}`);
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
