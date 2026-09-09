import React from 'react';
import { Filter, TrendingUp, Sparkles, CalendarClock } from 'lucide-react';
import { Button } from '@/_ocean/ui';

const actions = [
  { icon: <Filter size={16} />, label: 'Filter' },
  { icon: <TrendingUp size={16} />, label: 'Ranking' },
  { icon: <Sparkles size={16} />, label: 'New' },
  { icon: <CalendarClock size={16} />, label: 'Reserve' },
];

const ActionButtons: React.FC = () => {
  return (
    <div className="no-scrollbar mb-8 flex gap-3 overflow-x-auto pb-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outlined"
          color="default"
          size="sm"
          startIcon={action.icon}
          className="shrink-0 whitespace-nowrap"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default ActionButtons;
