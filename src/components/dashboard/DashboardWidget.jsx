import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";

export default function DashboardWidget({ 
  title, 
  children, 
  onRemove, 
  onExpand,
  isExpanded = false,
  isDraggable = true 
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDraggable && (
              <GripVertical className="w-4 h-4 text-slate-500 cursor-move" />
            )}
            <CardTitle className="text-white text-sm">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4">
        {children}
      </CardContent>
    </Card>
  );
}