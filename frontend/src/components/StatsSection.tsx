import { useEffect, useRef, useState } from 'react';
import { Users, BookOpen, Award, Clock } from 'lucide-react';

const stats = [
  { icon: Users, value: 10000, suffix: '+', label: 'Active Students' },
  { icon: BookOpen, value: 500, suffix: '+', label: 'Expert Mentors' },
  { icon: Award, value: 95, suffix: '%', label: 'Success Rate' },
  { icon: Clock, value: 50000, suffix: '+', label: 'Learning Hours' },
];

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
};

export const StatsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 gradient-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ 
  stat, 
  isVisible, 
  delay 
}: { 
  stat: typeof stats[0]; 
  isVisible: boolean; 
  delay: number;
}) => {
  const [animate, setAnimate] = useState(false);
  const count = useCountUp(stat.value, 2000, animate);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnimate(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay]);

  return (
    <div className={`text-center transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-dark mb-4">
        <stat.icon className="w-8 h-8 text-primary" />
      </div>
      <p className="font-display text-4xl font-bold text-primary-foreground mb-2">
        {count.toLocaleString()}{stat.suffix}
      </p>
      <p className="text-muted-foreground">{stat.label}</p>
    </div>
  );
};
