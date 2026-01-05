import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function TimeRangeFilter({ selectedRange, onRangeChange }) {
  const ranges = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: 'All Time', value: 'all' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400" />
      <div className="flex gap-1">
        {ranges.map(range => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange(range.value)}
            className={
              selectedRange === range.value
                ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
                : 'border-slate-700 text-slate-300 hover:text-white'
            }
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}