import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Heart, Star } from 'lucide-react';

const FeedbackTab = memo(() => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>
          This is an informational alert with the Quantum Rose theme.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Review Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < 4 ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
              />
            ))}
          </div>
          <p className="text-muted-foreground">
            Amazing theme system! Dynamic theme switching works perfectly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

FeedbackTab.displayName = 'FeedbackTab';

export default FeedbackTab;