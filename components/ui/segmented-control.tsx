"use client";

import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./segmented-control.module.css";

/** With an icon, the label becomes the option's accessible name and only the icon shows. */
export type SegmentedOption<T extends string> = { value: T; label: string; icon?: IconName };

export type SegmentedControlProps<T extends string> = Omit<
  ComponentProps<"div">,
  "className" | "style" | "children" | "defaultValue" | "onChange"
> & {
  options: readonly SegmentedOption<T>[];
  /** Controlled value. Leave it out and use defaultValue for uncontrolled. */
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** What the options choose between, for screen readers. */
  "aria-label": string;
};

/** A radio group drawn as segments. Arrow keys move and select, like native radios. */
export function SegmentedControl<T extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  ...props
}: SegmentedControlProps<T>) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? options[0]?.value);
  const selected = value ?? uncontrolled;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: T) {
    if (value === undefined) setUncontrolled(next);
    if (next !== selected) onValueChange?.(next);
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = options.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(options[target].value);
    buttons.current[target]?.focus();
  }

  return (
    <div role="radiogroup" {...props} className={styles.group}>
      {options.map((option, i) => {
        const checked = option.value === selected;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            aria-label={option.icon ? option.label : undefined}
            className={`text-body ${styles.segment}`}
            data-icon={option.icon}
            onClick={() => select(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {option.icon ? <Icon name={option.icon} size={16} /> : option.label}
          </button>
        );
      })}
    </div>
  );
}
