import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // base
          'flex min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm',
          // borders & states (tuned to match shadcn/Input in your app)
          'border-neutral-300 text-foreground placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // dark mode
          'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;

/**
 * Optional: Textarea with character counter.
 * Use maxLength to enable a soft cap indicator; we don't block typing.
 */
export function TextareaWithCounter(
  props: TextareaProps & { maxLength?: number }
) {
  const { maxLength, className, value, defaultValue, ...rest } = props;
  const [len, setLen] = React.useState<number>(() => {
    const initial =
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
        ? defaultValue.length
        : 0;
    return initial;
  });

  return (
    <div className="space-y-1">
      <Textarea
        {...rest}
        className={className}
        maxLength={maxLength}
        onChange={(e) => {
          setLen(e.currentTarget.value.length);
          rest.onChange?.(e);
        }}
        value={value}
        defaultValue={defaultValue}
      />
      {typeof maxLength === 'number' && (
        <div className="flex w-full justify-end text-xs text-muted-foreground">
          {len}/{maxLength}
        </div>
      )}
    </div>
  );
}
