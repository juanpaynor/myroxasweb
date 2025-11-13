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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

export function AppointmentBookingCard() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
      <CardHeader className="flex-grow">
        <div className="flex items-center gap-4">
          <div className="bg-accent/30 p-3 rounded-full">
            <CalendarIcon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <CardTitle>Book an Appointment</CardTitle>
            <CardDescription>Schedule visits for city services online.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Book Now</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book an Appointment</DialogTitle>
              <DialogDescription>
                Select a service, date, and time for your appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Service
                </Label>
                <Select>
                  <SelectTrigger id="service" className="col-span-3">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business-permit">Business Permit</SelectItem>
                    <SelectItem value="real-property-tax">Real Property Tax</SelectItem>
                    <SelectItem value="civil-registry">Civil Registry</SelectItem>
                    <SelectItem value="health-clearance">Health Clearance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Date</Label>
                <div className="col-span-3">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Select>
                  <SelectTrigger id="time" className="col-span-3">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9am">9:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="10am">10:00 AM - 11:00 AM</SelectItem>
                    <SelectItem value="11am">11:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="1pm">1:00 PM - 2:00 PM</SelectItem>
                    <SelectItem value="2pm">2:00 PM - 3:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsOpen(false)}>Confirm Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
