import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';

interface LayoutTabProps {
  progress: number;
  setProgress: (value: number) => void;
}

const LayoutTab = memo(({ progress, setProgress }: LayoutTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                -10
              </Button>
              <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                +10
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slider</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider defaultValue={[50]} max={100} step={1} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

LayoutTab.displayName = 'LayoutTab';

export default LayoutTab;