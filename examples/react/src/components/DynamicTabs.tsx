import React, { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ComponentsTab from './tabs/ComponentsTab';
import FormsTab from './tabs/FormsTab';
import LayoutTab from './tabs/LayoutTab';
import FeedbackTab from './tabs/FeedbackTab';

interface DynamicTabsProps {
  progress: number;
  setProgress: (value: number) => void;
}

const DynamicTabs = memo(({ progress, setProgress }: DynamicTabsProps) => {
  return (
    <Tabs defaultValue="components" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="components">Components</TabsTrigger>
        <TabsTrigger value="forms">Forms</TabsTrigger>
        <TabsTrigger value="layout">Layout</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
      </TabsList>

      <TabsContent value="components">
        <ComponentsTab />
      </TabsContent>

      <TabsContent value="forms">
        <FormsTab />
      </TabsContent>

      <TabsContent value="layout">
        <LayoutTab progress={progress} setProgress={setProgress} />
      </TabsContent>

      <TabsContent value="feedback">
        <FeedbackTab />
      </TabsContent>
    </Tabs>
  );
});

DynamicTabs.displayName = 'DynamicTabs';

export default DynamicTabs;