import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  FileText, 
  Calculator, 
  Activity,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              The API for Institutional Finance
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              The Trading Floor for
              <br />
              <span className="text-primary">OTC Derivatives</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A protocol and platform for structuring, negotiating, and executing over-the-counter trades. 
              Bringing transparency and speed to the multi-trillion dollar derivatives market.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/about')}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Transforming OTC Trade Execution
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Replace phone calls and chat messages with a structured, secure, and instantaneous trading platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Term Sheets</CardTitle>
              <CardDescription>
                Digital, standardized framework for defining any type of derivative. Machine-readable contracts 
                that both parties build together in real-time.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle>Pre-Trade Risk Engine</CardTitle>
              <CardDescription>
                Run term sheets through a universal risk simulator before execution. See exact financial 
                exposure and collateral requirements before committing.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Atomic Settlement</CardTitle>
              <CardDescription>
                Execute trades, register with clearinghouses, and handle collateral management automatically. 
                Turn multi-hour processes into secure, instantaneous events.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">
                Why Axon is Untouchable
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Bringing transparency to the largest "dark" market in the world. Axon doesn't compete with 
                banks or funds—it serves them all, becoming the essential, neutral infrastructure they rely on.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Eliminate Fat-Finger Errors</h3>
                    <p className="text-muted-foreground">
                      Replace manual entry with structured, validated data that prevents costly mistakes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Real-Time Transparency</h3>
                    <p className="text-muted-foreground">
                      Both parties see the same data simultaneously, eliminating post-trade surprises
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Instant Execution</h3>
                    <p className="text-muted-foreground">
                      Turn hours of manual processing into secure, automated settlement in seconds
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Neutral Infrastructure</h3>
                    <p className="text-muted-foreground">
                      Platform-agnostic solution that serves all market participants equally
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold">$1T+</CardTitle>
                      <CardDescription>Daily OTC derivatives volume</CardDescription>
                    </div>
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold">Hours → Seconds</CardTitle>
                      <CardDescription>Trade execution time reduction</CardDescription>
                    </div>
                    <Activity className="h-12 w-12 text-accent-foreground" />
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-4xl font-bold">100%</CardTitle>
                      <CardDescription>Audit trail completeness</CardDescription>
                    </div>
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to Transform Your Trading Operations?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the platform that's becoming the verb: "Axon me a price on that swap."
          </p>
          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            Get Started Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
