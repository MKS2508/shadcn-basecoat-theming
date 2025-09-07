import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

const FormsTab = memo(() => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Controls</CardTitle>
          <CardDescription>Input fields, switches, checkboxes, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Type your message here" />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="notifications" />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Choose your plan</Label>
            <RadioGroup defaultValue="pro">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">Free</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="pro" />
                <Label htmlFor="pro">Pro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enterprise" id="enterprise" />
                <Label htmlFor="enterprise">Enterprise</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

FormsTab.displayName = 'FormsTab';

export default FormsTab;