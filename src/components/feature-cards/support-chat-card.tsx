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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const messages = [
  { id: 1, sender: 'support', text: 'Hello! Welcome to MyRoxas City Support. How can I help you today?' },
  { id: 2, sender: 'user', text: 'Hi, I need to know the requirements for a business permit.' },
  { id: 3, sender: 'support', text: 'Of course! You will need a DTI/SEC registration, Barangay Clearance, and a Community Tax Certificate (Cedula). You can find more details on the city website.' },
];

export function SupportChatCard() {
  const [chatMessages, setChatMessages] = React.useState(messages);
  const [inputValue, setInputValue] = React.useState('');

  const handleSendMessage = () => {
    if(inputValue.trim()){
      setChatMessages([...chatMessages, {id: Date.now(), sender: 'user', text: inputValue}]);
      setInputValue('');
    }
  };

  return (
    <Card className="flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
      <CardHeader className="flex-grow">
        <div className="flex items-center gap-4">
          <div className="bg-accent/30 p-3 rounded-full">
            <MessageSquare className="w-6 h-6 text-accent" />
          </div>
          <div>
            <CardTitle>City Support Chat</CardTitle>
            <CardDescription>Get instant answers to your questions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">Start Chat</Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>City Support Chat</SheetTitle>
              <SheetDescription>
                We're here to help. Ask us anything!
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow my-4 pr-4 -mr-6">
                <div className="space-y-4">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.sender === 'support' && (
                            <Avatar className='h-8 w-8'>
                                <AvatarImage src="https://picsum.photos/seed/support/100/100" data-ai-hint="logo symbol" />
                                <AvatarFallback>CS</AvatarFallback>
                            </Avatar>
                        )}
                        <p className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%]",
                            msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                            {msg.text}
                        </p>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <SheetFooter>
              <div className="w-full flex gap-2">
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
