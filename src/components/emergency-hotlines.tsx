'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Phone, Shield, Flame, Ambulance } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const hotlines = [
  { name: 'Police', number: '168', icon: <Shield className="h-5 w-5 text-accent" /> },
  { name: 'Fire Department', number: '160', icon: <Flame className="h-5 w-5 text-destructive" /> },
  { name: 'Ambulance / Medical', number: '911', icon: <Ambulance className="h-5 w-5 text-green-500" /> },
];

export function EmergencyHotlines() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="destructive"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl animate-pulse-glow z-50"
          aria-label="Emergency Hotlines"
        >
          <Phone className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-2xl font-headline text-destructive">Emergency Hotlines</SheetTitle>
          <SheetDescription>
            In case of emergency, dial these numbers immediately.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Contact Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotlines.map((hotline) => (
                <TableRow key={hotline.name}>
                  <TableCell className="font-medium">
                    <div className='flex items-center gap-2'>
                        {hotline.icon}
                        <span>{hotline.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={`tel:${hotline.number}`} className="text-lg font-bold text-foreground hover:underline">
                      {hotline.number}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
