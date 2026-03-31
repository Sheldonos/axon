import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function RiskAnalysis() {
  const [, params] = useRoute("/term-sheets/:id/risk");
  const [, navigate] = useLocation();
  const termSheetId = params?.id ? parseInt(params.id) : 0;
  
  const { data: termSheet, isLoading: loadingTermSheet } = trpc.termSheets.getById.useQuery(
    { id: termSheetId },
    { enabled: termSheetId > 0 }
  );
  
  const { data: existingRisk, refetch: refetchRisk } = trpc.risk.getByTermSheetId.useQuery(
    { termSheetId },
    { enabled: termSheetId > 0 }
  );
  
  const [riskData, setRiskData] = useState<any>(null);
  
  const calculateMutation = trpc.risk.calculate.useMutation({
    onSuccess: (data) => {
      setRiskData(data);
      toast.success("Risk analysis completed");
      refetchRisk();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to calculate risk");
    },
  });
  
  useEffect(() => {
    if (existingRisk) {
      setRiskData(existingRisk);
    }
  }, [existingRisk]);
  
  const handleCalculate = () => {
    calculateMutation.mutate({ termSheetId });
  };
  
  if (loadingTermSheet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!termSheet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Term Sheet Not Found</h2>
          <Button onClick={() => navigate('/term-sheets')}>Back to Term Sheets</Button>
        </div>
      </div>
    );
  }
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: termSheet.currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };
  
  const formatPercent = (bps: number) => {
    return `${(bps / 100).toFixed(2)}%`;
  };
  
  const getRiskBadge = (level: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      low: { variant: 'default', icon: CheckCircle2 },
      medium: { variant: 'secondary', icon: AlertTriangle },
      high: { variant: 'destructive', icon: AlertTriangle },
      critical: { variant: 'destructive', icon: AlertTriangle },
    };
    
    const config = variants[level] || variants.medium;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {level.toUpperCase()}
      </Badge>
    );
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/term-sheets/${termSheetId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight">Pre-Trade Risk Analysis</h1>
              <p className="text-muted-foreground mt-1">
                Calculate exposure, collateral requirements, and P&L scenarios
              </p>
            </div>
            <Button onClick={handleCalculate} disabled={calculateMutation.isPending}>
              <Calculator className="h-4 w-4 mr-2" />
              {calculateMutation.isPending ? 'Calculating...' : riskData ? 'Recalculate' : 'Calculate Risk'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        {!riskData ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Risk Analysis Available</h3>
              <p className="text-muted-foreground mb-6">
                Run the risk engine to calculate exposure, collateral requirements, and P&L scenarios
              </p>
              <Button onClick={handleCalculate} disabled={calculateMutation.isPending}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Risk Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Exposure Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Current Exposure</CardDescription>
                  <CardTitle className="text-3xl font-mono">
                    {formatCurrency(riskData.exposureAmount)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(riskData.exposureAmount / termSheet.notionalAmount) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {((riskData.exposureAmount / termSheet.notionalAmount) * 100).toFixed(1)}% of notional
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Potential Exposure</CardDescription>
                  <CardTitle className="text-3xl font-mono">
                    {formatCurrency(riskData.potentialExposure)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(riskData.potentialExposure / termSheet.notionalAmount) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {((riskData.potentialExposure / termSheet.notionalAmount) * 100).toFixed(1)}% of notional
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Collateral Required</CardDescription>
                  <CardTitle className="text-3xl font-mono">
                    {formatCurrency(riskData.collateralRequired)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(riskData.collateralRequired / termSheet.notionalAmount) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {((riskData.collateralRequired / termSheet.notionalAmount) * 100).toFixed(1)}% of notional
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Risk Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Indicators</CardTitle>
                <CardDescription>Assessment of different risk dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Credit Risk</span>
                      {getRiskBadge(riskData.creditRisk)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Risk of counterparty default
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Market Risk</span>
                      {getRiskBadge(riskData.marketRisk)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Risk from market movements
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Liquidity Risk</span>
                      {getRiskBadge(riskData.liquidityRisk)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Risk of inability to exit position
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* P&L Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>P&L Scenarios</CardTitle>
                <CardDescription>Potential profit and loss under different market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Bull Scenario</p>
                        <p className="text-xs text-muted-foreground">Favorable market conditions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-mono font-semibold ${riskData.bullScenarioPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {riskData.bullScenarioPnL >= 0 ? '+' : ''}{formatCurrency(riskData.bullScenarioPnL)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <div className="h-5 w-5 rounded-full border-2 border-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Base Scenario</p>
                        <p className="text-xs text-muted-foreground">Expected market conditions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-semibold">
                        {formatCurrency(riskData.baseScenarioPnL)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Bear Scenario</p>
                        <p className="text-xs text-muted-foreground">Adverse market conditions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-mono font-semibold ${riskData.bearScenarioPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {riskData.bearScenarioPnL >= 0 ? '+' : ''}{formatCurrency(riskData.bearScenarioPnL)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-destructive/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">Stress Scenario</p>
                        <p className="text-xs text-muted-foreground">Extreme market stress</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-mono font-semibold ${riskData.stressScenarioPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {riskData.stressScenarioPnL >= 0 ? '+' : ''}{formatCurrency(riskData.stressScenarioPnL)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Value at Risk */}
            <Card>
              <CardHeader>
                <CardTitle>Value at Risk (VaR)</CardTitle>
                <CardDescription>Maximum expected loss at different confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">95% Confidence VaR</span>
                      <span className="text-2xl font-mono font-semibold text-orange-600">
                        {formatCurrency(riskData.valueAtRisk95 || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      95% probability that losses will not exceed this amount
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">99% Confidence VaR</span>
                      <span className="text-2xl font-mono font-semibold text-red-600">
                        {formatCurrency(riskData.valueAtRisk99 || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      99% probability that losses will not exceed this amount
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
