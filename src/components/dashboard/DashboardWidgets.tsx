import { WidgetScoreCard } from './WidgetScoreCard';
import { WidgetMentionsChart } from './WidgetMentionsChart';
import { WidgetAlertsCard } from './WidgetAlertsCard';

interface DashboardWidgetsProps {
  widgets?: {
    score?: boolean;
    mentions?: boolean;
    alerts?: boolean;
  };
}

const widgetComponents = {
  score: WidgetScoreCard,
  mentions: WidgetMentionsChart,
  alerts: WidgetAlertsCard,
};

export function DashboardWidgets({ widgets = { score: true, mentions: true, alerts: true } }: DashboardWidgetsProps) {
  const enabledWidgets = Object.entries(widgetComponents)
    .filter(([key]) => widgets[key as keyof typeof widgets])
    .map(([key, Component]) => ({ key, Component }));

  if (enabledWidgets.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enabledWidgets.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </div>
  );
}
