'use client';

import { Slot } from '@radix-ui/react-slot';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

export const CustomSlot = forwardRef<ElementRef<typeof Slot>, ComponentPropsWithoutRef<typeof Slot>>(
  (props, ref) => {
    return <Slot ref={ref} {...props} />;
  }
);

CustomSlot.displayName = 'Slot';