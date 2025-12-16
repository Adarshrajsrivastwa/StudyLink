import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTASection = () => {
  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative gradient-primary rounded-3xl p-8 md:p-12 shadow-elevated overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(0_0%_100%/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%/0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            {/* Floating Elements */}
            <div className="absolute top-6 right-6 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float-delayed" />

            <div className="relative text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Join 10,000+ Students Today
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Transform Your Learning Experience?
              </h2>
              
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                Connect with expert mentors, access exclusive resources, and take your academic journey to the next level. Start for free today!
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="text-primary-foreground border-2 border-white/30 hover:bg-white/10 hover:border-white/50"
                >
                  Talk to Sales
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-primary-foreground/70 text-sm">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
