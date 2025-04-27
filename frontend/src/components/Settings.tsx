
import React from 'react';
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import EndpointConfig from './EndpointConfig';

const Settings = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Cog className="h-5 w-5" />
          <span className="sr-only">Open settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <EndpointConfig />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Settings;
