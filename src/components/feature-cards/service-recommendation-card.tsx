'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { getServiceRecommendation, type RecommendationState } from '@/app/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Sparkles, ServerCrash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialState: RecommendationState = {
  recommendations: null,
  error: null,
  timestamp: Date.now(),
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary/90 hover:bg-primary">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Get Recommendation
    </Button>
  );
}

export function ServiceRecommendationCard() {
  const [state, formAction] = useFormState(getServiceRecommendation, initialState);
  const [formKey, setFormKey] = React.useState(Date.now());
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state, toast]);

  const handleFormReset = (e: React.FormEvent<HTMLFormElement>) => {
    formAction(e.currentTarget);
    if (!state.error) {
        e.currentTarget.reset();
    }
  };


  return (
    <Card className="flex flex-col col-span-1 md:col-span-2 transform hover:-translate-y-2 transition-transform duration-300 bg-card border-primary/50 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
            <div className="bg-primary/20 p-3 rounded-full">
                <Wand2 className="w-8 h-8 text-primary" />
            </div>
        </div>
        <CardTitle className="font-headline text-2xl">AI Service Assistant</CardTitle>
        <CardDescription>Describe your need, and our AI will suggest the right city department for you.</CardDescription>
      </CardHeader>
      <form key={formKey} action={formAction} className="flex flex-col flex-grow">
        <CardContent className="flex-grow">
          <Textarea
            name="description"
            placeholder="e.g., 'There is a large pothole on my street' or 'I want to apply for a business permit'"
            rows={4}
            className="resize-none"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
      
      {state.timestamp > initialState.timestamp && (
        <CardContent className="animate-fade-in">
          {state.recommendations && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-primary w-5 h-5"/>Recommended Services:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                {state.recommendations.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>
          )}
          {state.error && (
             <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive"><ServerCrash className="w-5 h-5"/>Suggestion Failed:</h3>
              <p className="text-sm text-destructive/90">{state.error}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
