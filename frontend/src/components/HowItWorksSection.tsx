import { UserPlus, Search, Calendar, Rocket } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Profile',
    description: 'Sign up and tell us about your learning goals, interests, and preferred subjects.',
  },
  {
    icon: Search,
    step: '02',
    title: 'Find Your Mentor',
    description: 'Browse through our verified mentors and find the perfect match for your needs.',
  },
  {
    icon: Calendar,
    step: '03',
    title: 'Schedule Sessions',
    description: 'Book sessions at times that work for you with our flexible scheduling system.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Start Learning',
    description: 'Connect with your mentor and begin your journey to academic excellence.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Your Learning Journey in
            <span className="gradient-text"> 4 Simple Steps</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting started with Study Link is quick and easy. Here's how it works.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="step-item relative animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Card */}
                <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-500 hover-lift border border-border hover:border-primary/30">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-6">
                    <span className="inline-block px-3 py-1 gradient-primary text-primary-foreground text-xs font-bold rounded-full shadow-soft">
                      Step {step.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-5 mt-3 shadow-soft">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Connector Dot */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-card border-4 border-primary shadow-glow -translate-y-1/2 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
