import { Link } from 'react-router-dom';
import { Brain, Globe, BarChart3, Bell, ArrowRight } from 'lucide-react';

const actions = [
  {
    title: 'LLM Mentions',
    description: 'Track your brand across AI models',
    icon: Brain,
    href: '/llm-mentions',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
  },
  {
    title: 'GEO Analysis',
    description: 'Generative Engine Optimization',
    icon: Globe,
    href: '/igo-dashboard',
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  {
    title: 'Reports',
    description: 'Generate detailed analytics',
    icon: BarChart3,
    href: '/reports',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Alerts',
    description: 'Configure notifications',
    icon: Bell,
    href: '/alerts',
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link
          key={action.title}
          to={action.href}
          className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} 
            border ${action.borderColor} p-5 transition-all duration-300
            hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="relative z-10">
            <div className={`p-2.5 rounded-lg bg-background/40 w-fit mb-3 ${action.iconColor}`}>
              <action.icon className="w-5 h-5" />
            </div>
            
            <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{action.description}</p>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              <span>Open</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
