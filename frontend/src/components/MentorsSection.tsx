import { Star, Award, BookOpen } from 'lucide-react';

const mentors = [
  {
    name: 'Prof. Sharma',
    role: 'Data Science Expert',
    expertise: ['Machine Learning', 'Python', 'Statistics'],
    rating: 4.9,
    students: 234,
    initials: 'PS',
    gradient: 'gradient-primary',
  },
  {
    name: 'Dr. Gupta',
    role: 'Mathematics Specialist',
    expertise: ['Calculus', 'Linear Algebra', 'Discrete Math'],
    rating: 4.8,
    students: 189,
    initials: 'DG',
    gradient: 'gradient-secondary',
  },
  {
    name: 'Akash Srivastava',
    role: 'Full Stack Developer',
    expertise: ['React', 'Node.js', 'System Design'],
    rating: 5.0,
    students: 312,
    initials: 'AS',
    gradient: 'gradient-primary',
  },
  {
    name: 'Aman Aditya',
    role: 'AI & ML Researcher',
    expertise: ['Deep Learning', 'NLP', 'Computer Vision'],
    rating: 4.9,
    students: 267,
    initials: 'AA',
    gradient: 'gradient-secondary',
  },
];

export const MentorsSection = () => {
  return (
    <section id="mentors" className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-4">
            Our Mentors
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Learn from
            <span className="gradient-text"> Industry Experts</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Our mentors are carefully selected professionals with proven track records in their fields.
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((mentor, index) => (
            <div
              key={index}
              className="mentor-card group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 shadow-card hover:shadow-elevated transition-all duration-500 hover-lift overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 left-0 right-0 h-24 ${mentor.gradient} opacity-10`} />

              {/* Content */}
              <div className="relative">
                {/* Avatar */}
                <div className={`w-20 h-20 ${mentor.gradient} rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-soft mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {mentor.initials}
                </div>

                {/* Info */}
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {mentor.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{mentor.role}</p>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.expertise.slice(0, 2).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {mentor.expertise.length > 2 && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                      +{mentor.expertise.length - 2}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-secondary fill-secondary" />
                    <span className="text-sm font-medium text-foreground">{mentor.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{mentor.students} students</span>
                  </div>
                </div>
              </div>

              {/* Hover Badge */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-2 gradient-primary rounded-lg shadow-soft">
                  <Award className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
