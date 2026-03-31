import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Calculator, FileText, Save } from "lucide-react";

export default function TermSheetBuilder() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  // Fetch counterparties for selection
  const { data: counterparties = [] } = trpc.counterparties.list.useQuery({ status: 'active' });
  
  // Form state
  const [formData, setFormData] = useState({
    instrumentType: 'interest_rate_swap' as const,
    notionalAmount: '',
    currency: 'USD',
    strikePrice: '',
    fixedRate: '',
    tradeDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    counterpartyAId: '',
    counterpartyBId: '',
    collateralRequired: true,
    collateralType: '',
    collateralAmount: '',
    marginCallThreshold: '',
    paymentFrequency: 'quarterly' as const,
    dayCountConvention: 'ACT/360',
    underlyingAsset: '',
    notes: '',
  });
  
  const createMutation = trpc.termSheets.create.useMutation({
    onSuccess: (data) => {
      toast.success("Term sheet created successfully");
      utils.termSheets.list.invalidate();
      navigate(`/term-sheets/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create term sheet");
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string amounts to cents (integers)
    const notionalCents = Math.round(parseFloat(formData.notionalAmount) * 100);
    const strikeCents = formData.strikePrice ? Math.round(parseFloat(formData.strikePrice) * 100) : undefined;
    const fixedRateBps = formData.fixedRate ? Math.round(parseFloat(formData.fixedRate) * 100) : undefined;
    const collateralCents = formData.collateralAmount ? Math.round(parseFloat(formData.collateralAmount) * 100) : undefined;
    const marginCents = formData.marginCallThreshold ? Math.round(parseFloat(formData.marginCallThreshold) * 100) : undefined;
    
    createMutation.mutate({
      instrumentType: formData.instrumentType,
      notionalAmount: notionalCents,
      currency: formData.currency,
      strikePrice: strikeCents,
      fixedRate: fixedRateBps,
      tradeDate: new Date(formData.tradeDate),
      effectiveDate: new Date(formData.effectiveDate),
      maturityDate: new Date(formData.maturityDate),
      counterpartyAId: parseInt(formData.counterpartyAId),
      counterpartyBId: parseInt(formData.counterpartyBId),
      collateralRequired: formData.collateralRequired,
      collateralType: formData.collateralType || undefined,
      collateralAmount: collateralCents,
      marginCallThreshold: marginCents,
      paymentFrequency: formData.paymentFrequency,
      dayCountConvention: formData.dayCountConvention || undefined,
      underlyingAsset: formData.underlyingAsset || undefined,
      notes: formData.notes || undefined,
    });
  };
  
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/term-sheets')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight">Smart Term Sheet Builder</h1>
              <p className="text-muted-foreground mt-1">
                Create a structured, machine-readable OTC derivative contract
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Instrument Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instrument Details
              </CardTitle>
              <CardDescription>Define the core parameters of the derivative instrument</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instrumentType">Instrument Type</Label>
                  <Select value={formData.instrumentType} onValueChange={(v) => updateField('instrumentType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest_rate_swap">Interest Rate Swap</SelectItem>
                      <SelectItem value="currency_swap">Currency Swap</SelectItem>
                      <SelectItem value="credit_default_swap">Credit Default Swap</SelectItem>
                      <SelectItem value="equity_option">Equity Option</SelectItem>
                      <SelectItem value="commodity_forward">Commodity Forward</SelectItem>
                      <SelectItem value="fx_forward">FX Forward</SelectItem>
                      <SelectItem value="variance_swap">Variance Swap</SelectItem>
                      <SelectItem value="total_return_swap">Total Return Swap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="underlyingAsset">Underlying Asset</Label>
                  <Input
                    id="underlyingAsset"
                    placeholder="e.g., USD LIBOR, EUR/USD, S&P 500"
                    value={formData.underlyingAsset}
                    onChange={(e) => updateField('underlyingAsset', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notionalAmount">Notional Amount</Label>
                  <Input
                    id="notionalAmount"
                    type="number"
                    step="0.01"
                    placeholder="10000000.00"
                    required
                    value={formData.notionalAmount}
                    onChange={(e) => updateField('notionalAmount', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fixedRate">Fixed Rate (%)</Label>
                  <Input
                    id="fixedRate"
                    type="number"
                    step="0.01"
                    placeholder="2.50"
                    value={formData.fixedRate}
                    onChange={(e) => updateField('fixedRate', e.target.value)}
                  />
                </div>
              </div>
              
              {(formData.instrumentType.includes('option')) && (
                <div className="space-y-2">
                  <Label htmlFor="strikePrice">Strike Price</Label>
                  <Input
                    id="strikePrice"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={formData.strikePrice}
                    onChange={(e) => updateField('strikePrice', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Dates and Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Dates and Payment Terms</CardTitle>
              <CardDescription>Specify the timeline and payment structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tradeDate">Trade Date</Label>
                  <Input
                    id="tradeDate"
                    type="date"
                    required
                    value={formData.tradeDate}
                    onChange={(e) => updateField('tradeDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => updateField('effectiveDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maturityDate">Maturity Date</Label>
                  <Input
                    id="maturityDate"
                    type="date"
                    required
                    value={formData.maturityDate}
                    onChange={(e) => updateField('maturityDate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                  <Select value={formData.paymentFrequency} onValueChange={(v: any) => updateField('paymentFrequency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="at_maturity">At Maturity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dayCountConvention">Day Count Convention</Label>
                  <Input
                    id="dayCountConvention"
                    placeholder="ACT/360, 30/360, ACT/365"
                    value={formData.dayCountConvention}
                    onChange={(e) => updateField('dayCountConvention', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Counterparties */}
          <Card>
            <CardHeader>
              <CardTitle>Counterparties</CardTitle>
              <CardDescription>Select the trading parties for this derivative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="counterpartyA">Counterparty A</Label>
                  <Select value={formData.counterpartyAId} onValueChange={(v) => updateField('counterpartyAId', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select counterparty" />
                    </SelectTrigger>
                    <SelectContent>
                      {counterparties.map((cp) => (
                        <SelectItem key={cp.id} value={cp.id.toString()}>
                          {cp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="counterpartyB">Counterparty B</Label>
                  <Select value={formData.counterpartyBId} onValueChange={(v) => updateField('counterpartyBId', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select counterparty" />
                    </SelectTrigger>
                    <SelectContent>
                      {counterparties.map((cp) => (
                        <SelectItem key={cp.id} value={cp.id.toString()}>
                          {cp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Collateral Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Collateral Terms</CardTitle>
              <CardDescription>Define collateral requirements and margin thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="collateralRequired"
                  checked={formData.collateralRequired}
                  onCheckedChange={(checked) => updateField('collateralRequired', checked)}
                />
                <Label htmlFor="collateralRequired">Collateral Required</Label>
              </div>
              
              {formData.collateralRequired && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collateralType">Collateral Type</Label>
                    <Input
                      id="collateralType"
                      placeholder="e.g., Cash, Treasury Bonds"
                      value={formData.collateralType}
                      onChange={(e) => updateField('collateralType', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="collateralAmount">Collateral Amount</Label>
                    <Input
                      id="collateralAmount"
                      type="number"
                      step="0.01"
                      placeholder="1000000.00"
                      value={formData.collateralAmount}
                      onChange={(e) => updateField('collateralAmount', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marginCallThreshold">Margin Call Threshold</Label>
                    <Input
                      id="marginCallThreshold"
                      type="number"
                      step="0.01"
                      placeholder="500000.00"
                      value={formData.marginCallThreshold}
                      onChange={(e) => updateField('marginCallThreshold', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Add any additional terms or comments</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any additional notes or special terms..."
                rows={4}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/term-sheets')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Creating...' : 'Create Term Sheet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
