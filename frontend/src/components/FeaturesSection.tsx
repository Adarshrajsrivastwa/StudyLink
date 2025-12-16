import {
  MessageSquare, 
  Calendar, 
  Video, 
  FileText, 
  Target, 
  Shield 
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Connect instantly with your mentor through our seamless messaging system.',
    color: 'primary',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Book sessions that fit your schedule with intelligent calendar integration.',
    color: 'secondary',
  },
  {
    icon: Video,
    title: 'Video Sessions',
    description: 'Face-to-face learning with HD video calls and screen sharing.',
    color: 'accent',
  },
  {
    icon: FileText,
    title: 'Resource Sharing',
    description: 'Share documents, notes, and study materials effortlessly.',
    color: 'primary',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and track your learning goals with progress analytics.',
    color: 'secondary',
  },
  {
    icon: Shield,
    title: 'Verified Mentors',
    description: 'All mentors are verified experts in their respective fields.',
    color: 'accent',
  },
];

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    gradient: 'gradient-primary',
  },
  secondary: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    gradient: 'gradient-secondary',
  },
  accent: {
    bg: 'bg-accent/20',
    text: 'text-accent',
    gradient: 'from-accent to-primary',
  },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="gradient-text"> Excel</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful tools designed to make learning engaging, efficient, and effective.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className="feature-card group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-card hover:shadow-elevated transition-all duration-500 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Indicator */}
                <div className={`mt-5 h-1 w-0 group-hover:w-16 ${colors.gradient} rounded-full transition-all duration-500`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
