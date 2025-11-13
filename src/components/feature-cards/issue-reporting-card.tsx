'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function IssueReportingCard() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsOpen(false);
    toast({
      title: "Issue Reported!",
      description: "Thank you for your submission. We will review it shortly.",
    });
  };

  return (
    <Card className="flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
      <CardHeader className="flex-grow">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Report an Issue</CardTitle>
            <CardDescription>Submit reports on potholes, broken lights, etc.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">Report Now</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>
                  Provide details about the issue. Your report helps improve our city.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input id="title" placeholder="e.g., Large pothole" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea id="description" placeholder="Describe the issue in detail" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right col-span-1"></span>
                  <div className='col-span-3 flex gap-2'>
                    <Button type="button" variant="secondary" className='w-full'>
                      <Camera className="mr-2 h-4 w-4" /> Upload Photo
                    </Button>
                    <Button type="button" variant="secondary" className='w-full'>
                      <MapPin className="mr-2 h-4 w-4" /> Share Location
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Submit Report</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
