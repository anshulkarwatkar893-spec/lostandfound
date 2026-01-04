import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Search, Package, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-hero mx-auto mb-8 flex items-center justify-center shadow-glow animate-pulse-glow">
              <Search className="w-10 h-10 text-primary-foreground" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Campus <span className="text-gradient">Lost & Found</span> Portal
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Lost something on campus? Found an item? Our AI-powered platform helps 
              reunite students with their belongings quickly and efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Report Items</h3>
              <p className="text-muted-foreground">
                Easily post lost or found items with photos and descriptions
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">AI Detection</h3>
              <p className="text-muted-foreground">
                Our AI analyzes images to identify objects and generate descriptions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Smart Matching</h3>
              <p className="text-muted-foreground">
                Automatically matches lost items with found items based on AI labels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to Find Your Lost Items?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join your campus community and help everyone stay connected with their belongings.
          </p>
          <Link to={user ? "/dashboard" : "/auth?mode=register"}>
            <Button size="lg" className="bg-gradient-primary gap-2">
              {user ? 'Go to Dashboard' : 'Create Free Account'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Campus Lost & Found Portal. Built for college communities.</p>
        </div>
      </footer>
    </div>
  );
}