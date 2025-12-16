import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Users, BookOpen, Award } from 'lucide-react';

export const HeroSection = () => {

  return (
    <section id="home" className="relative min-h-screen flex items-center gradient-hero overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl animate-morph" />
        
        {/* Decorative Elements */}
        <div className="absolute top-32 right-20 w-4 h-4 bg-primary rounded-full animate-bounce-subtle" />
        <div className="absolute top-48 right-40 w-3 h-3 bg-secondary rounded-full animate-bounce-subtle stagger-2" />
        <div className="absolute bottom-32 left-20 w-5 h-5 bg-accent rounded-full animate-bounce-subtle stagger-3" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-primary">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Your Gateway to Academic Excellence
              </span>
            </div>

            <h1 className="animate-fade-in text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight" style={{ animationDelay: '0.2s' }}>
              Connect with Expert
              <span className="block gradient-text">Mentors & Elevate</span>
              Your Learning
            </h1>

            <p className="animate-fade-in text-lg text-muted-foreground max-w-lg" style={{ animationDelay: '0.3s' }}>
              Study Link bridges the gap between students and mentors, creating meaningful 
              connections that foster academic growth, career guidance, and personal development.
            </p>

            <div className="animate-fade-in flex flex-wrap gap-4" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="lg" className="group">
                Start Learning Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="lg" className="group">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="animate-fade-in flex flex-wrap gap-8 pt-4" style={{ animationDelay: '0.5s' }}>
              {[
                { icon: Users, value: '10K+', label: 'Active Students' },
                { icon: BookOpen, value: '500+', label: 'Expert Mentors' },
                { icon: Award, value: '95%', label: 'Success Rate' },
              ].map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Main Card */}
            <div className="relative glass rounded-3xl p-8 shadow-elevated hover-lift">
              {/* Profile Cards */}
              <div className="space-y-4">
                {/* Student Card */}
                <div className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card">
                  <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    AR
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Adarsh Raj</p>
                    <p className="text-sm text-muted-foreground">Computer Science Student</p>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Active
                  </div>
                </div>

                {/* Connection Line */}
                <div className="flex items-center justify-center py-2">
                  <div className="w-px h-8 bg-gradient-to-b from-primary to-secondary" />
                </div>

                {/* Mentor Card */}
                <div className="flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card">
                  <div className="w-14 h-14 gradient-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold text-lg">
                    AK
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Akash Kumar</p>
                    <p className="text-sm text-muted-foreground">Senior Mentor • AI Expert</p>
                  </div>
                  <div className="flex items-center gap-1 text-secondary">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-medium">Top Rated</span>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="mt-6 p-4 bg-muted rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Current Session</span>
                  <span className="text-xs text-primary font-medium">Live</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
                    <div className="w-3/4 h-full gradient-primary rounded-full animate-pulse" />
                  </div>
                  <span className="text-xs text-muted-foreground">45 min</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 gradient-primary rounded-2xl shadow-glow animate-float flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-xl p-4 shadow-card animate-float-delayed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Session Completed!</p>
                  <p className="text-xs text-muted-foreground">Great progress today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
