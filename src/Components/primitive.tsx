'use client';

import { Primitive } from '@radix-ui/react-primitive';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>;

export const CustomPrimitive = forwardRef<ElementRef<typeof Primitive.div>, PrimitiveDivProps>(
  (props, ref) => {
    return <Primitive.div ref={ref} {...props} />;
  }
);

CustomPrimitive.displayName = 'Primitive';