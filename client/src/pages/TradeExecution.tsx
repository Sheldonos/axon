import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FileText,
  Users,
  Shield,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function TradeExecution() {
  const [, params] = useRoute("/trades/:id");
  const [, navigate] = useLocation();
  const tradeId = params?.id ? parseInt(params.id) : 0;
  
  const { data: tradeData, isLoading } = trpc.trades.getById.useQuery(
    { id: tradeId },
    { enabled: tradeId > 0 }
  );
  
  const { data: events = [] } = trpc.trades.getEvents.useQuery(
    { id: tradeId },
    { enabled: tradeId > 0 }
  );
  
  const utils = trpc.useUtils();
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  
  const updateStatusMutation = trpc.trades.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Trade status updated");
      utils.trades.getById.invalidate({ id: tradeId });
      utils.trades.getEvents.invalidate({ id: tradeId });
      setStatusDialogOpen(false);
      setStatusNotes('');
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
  
  const confirmCounterpartyMutation = trpc.trades.confirmCounterparty.useMutation({
    onSuccess: () => {
      toast.success("Counterparty confirmation recorded");
      utils.trades.getById.invalidate({ id: tradeId });
      utils.trades.getEvents.invalidate({ id: tradeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm");
    },
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!tradeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Trade Not Found</h2>
          <Button onClick={() => navigate('/trades')}>Back to Trades</Button>
        </div>
      </div>
    );
  }
  
  const { trade, termSheet } = tradeData;
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: termSheet.currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };
  
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      negotiating: { color: 'bg-blue-500', icon: Clock, label: 'Negotiating' },
      pending_approval: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Pending Approval' },
      approved: { color: 'bg-green-500', icon: CheckCircle2, label: 'Approved' },
      executing: { color: 'bg-purple-500', icon: TrendingUp, label: 'Executing' },
      executed: { color: 'bg-green-600', icon: CheckCircle2, label: 'Executed' },
      settling: { color: 'bg-blue-600', icon: Clock, label: 'Settling' },
      settled: { color: 'bg-green-700', icon: CheckCircle2, label: 'Settled' },
      cancelled: { color: 'bg-gray-500', icon: AlertCircle, label: 'Cancelled' },
      failed: { color: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
    };
    return configs[status] || configs.negotiating;
  };
  
  const statusConfig = getStatusConfig(trade.tradeStatus);
  const StatusIcon = statusConfig.icon;
  
  const workflowSteps = [
    { status: 'negotiating', label: 'Negotiating', description: 'Terms under discussion' },
    { status: 'pending_approval', label: 'Pending Approval', description: 'Awaiting approval' },
    { status: 'approved', label: 'Approved', description: 'Ready for execution' },
    { status: 'executing', label: 'Executing', description: 'Trade in execution' },
    { status: 'executed', label: 'Executed', description: 'Trade completed' },
    { status: 'settling', label: 'Settling', description: 'Settlement in progress' },
    { status: 'settled', label: 'Settled', description: 'Fully settled' },
  ];
  
  const currentStepIndex = workflowSteps.findIndex(s => s.status === trade.tradeStatus);
  
  const handleStatusUpdate = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };
  
  const confirmStatusUpdate = () => {
    updateStatusMutation.mutate({
      id: tradeId,
      status: newStatus as any,
      notes: statusNotes || undefined,
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/trades')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">Trade #{trade.id}</h1>
                <Badge variant="outline" className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {termSheet.instrumentType.replace(/_/g, ' ').toUpperCase()} • {formatCurrency(termSheet.notionalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Execution Workflow</CardTitle>
              <CardDescription>Track the progress of this trade through the execution lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" style={{ width: 'calc(100% - 40px)', marginLeft: '20px' }} />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500" 
                  style={{ 
                    width: `calc(${(currentStepIndex / (workflowSteps.length - 1)) * 100}% - 40px)`,
                    marginLeft: '20px'
                  }} 
                />
                
                <div className="relative flex justify-between">
                  {workflowSteps.map((step, index) => {
                    const isComplete = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div key={step.status} className="flex flex-col items-center" style={{ width: '120px' }}>
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            isComplete ? 'bg-primary border-primary text-primary-foreground' :
                            isCurrent ? 'bg-background border-primary text-primary' :
                            'bg-background border-border text-muted-foreground'
                          }`}
                        >
                          {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Counterparty Confirmations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Counterparty Confirmations
              </CardTitle>
              <CardDescription>Both parties must confirm before execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Counterparty A</span>
                    {trade.counterpartyAConfirmed ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  {trade.counterpartyAConfirmedAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.counterpartyAConfirmedAt), 'PPp')}
                    </p>
                  )}
                  {!trade.counterpartyAConfirmed && (
                    <Button 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => confirmCounterpartyMutation.mutate({ id: tradeId, counterparty: 'A' })}
                      disabled={confirmCounterpartyMutation.isPending}
                    >
                      Confirm as Counterparty A
                    </Button>
                  )}
                </div>
                
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Counterparty B</span>
                    {trade.counterpartyBConfirmed ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  {trade.counterpartyBConfirmedAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.counterpartyBConfirmedAt), 'PPp')}
                    </p>
                  )}
                  {!trade.counterpartyBConfirmed && (
                    <Button 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => confirmCounterpartyMutation.mutate({ id: tradeId, counterparty: 'B' })}
                      disabled={confirmCounterpartyMutation.isPending}
                    >
                      Confirm as Counterparty B
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Actions</CardTitle>
              <CardDescription>Update trade status and manage execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trade.tradeStatus === 'negotiating' && (
                  <Button onClick={() => handleStatusUpdate('pending_approval')}>
                    Submit for Approval
                  </Button>
                )}
                {trade.tradeStatus === 'pending_approval' && (
                  <>
                    <Button onClick={() => handleStatusUpdate('approved')}>
                      Approve Trade
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusUpdate('cancelled')}>
                      Reject Trade
                    </Button>
                  </>
                )}
                {trade.tradeStatus === 'approved' && (
                  <Button onClick={() => handleStatusUpdate('executing')}>
                    Begin Execution
                  </Button>
                )}
                {trade.tradeStatus === 'executing' && (
                  <Button onClick={() => handleStatusUpdate('executed')}>
                    Mark as Executed
                  </Button>
                )}
                {trade.tradeStatus === 'executed' && (
                  <Button onClick={() => handleStatusUpdate('settling')}>
                    Begin Settlement
                  </Button>
                )}
                {trade.tradeStatus === 'settling' && (
                  <Button onClick={() => handleStatusUpdate('settled')}>
                    Mark as Settled
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>Complete audit trail of trade lifecycle events</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        {index < events.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.eventType.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.createdAt), 'PPp')}
                          </p>
                        </div>
                        {event.eventData && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {JSON.stringify(JSON.parse(event.eventData), null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Trade Status</DialogTitle>
            <DialogDescription>
              Confirm status change to {newStatus.replace(/_/g, ' ').toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusUpdate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
