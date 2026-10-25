import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}
export function SelectField({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
}: {
  name?: string;
  label: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value ?? '');
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 300 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const current = options.findIndex((option) => option.value === selected);

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current!.getBoundingClientRect();
      const below = innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const desired = Math.min(options.length * 44 + 12, 300);
      const flip = below < desired && above > below;
      const height = Math.min(desired, Math.max(60, flip ? above : below));
      setPosition({
        top: flip ? rect.top - height - 7 : rect.bottom + 7,
        left: Math.max(12, Math.min(rect.left, innerWidth - rect.width - 12)),
        width: Math.min(rect.width, innerWidth - 24),
        maxHeight: height,
      });
    }
    place();
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        !menu.current?.contains(event.target)
      )
        setOpen(false);
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node && menu.current?.contains(event.target))) place();
    };
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open, options.length]);
  useEffect(() => {
    if (open && position.width) {
      const item = items.current[active];
      const popup = menu.current;
      item?.focus({ preventScroll: true });
      if (item && popup) {
        if (item.offsetTop < popup.scrollTop) popup.scrollTop = item.offsetTop;
        else if (item.offsetTop + item.offsetHeight > popup.scrollTop + popup.clientHeight)
          popup.scrollTop = item.offsetTop + item.offsetHeight - popup.clientHeight;
      }
    }
  }, [open, active, position.width, position.maxHeight]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function choose(next: string) {
    setInternal(next);
    onChange?.(next);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    if (!disabled) {
      setActive(Math.max(0, current));
      setOpen(true);
    }
  }
  function blur(event: React.FocusEvent) {
    if (
      !root.current?.contains(event.relatedTarget) &&
      !menu.current?.contains(event.relatedTarget)
    )
      setOpen(false);
  }

  return (
    <div className="select-field" ref={root} onBlur={blur}>
      {name && <input type="hidden" name={name} value={selected} disabled={disabled} />}
      <button
        type="button"
        ref={trigger}
        className={`select-field-trigger ${open ? 'is-open' : ''}`}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show();
          }
        }}
      >
        <span>{options.find((option) => option.value === selected)?.label ?? ''}</span>
        <ChevronDown size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            className="select-field-menu"
            role="listbox"
            aria-label={label}
            id={id}
            style={position}
            onBlur={blur}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setActive(
                  (index) =>
                    (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                    options.length,
                );
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                setActive(event.key === 'Home' ? 0 : options.length - 1);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                trigger.current?.focus();
              } else if (event.key === 'Tab') {
                event.preventDefault();
                setOpen(false);
                const fields = [
                  ...(trigger.current
                    ?.closest('form')
                    ?.querySelectorAll<HTMLElement>(
                      'button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled])',
                    ) ?? []),
                ];
                const index = fields.indexOf(trigger.current!);
                (fields[index + (event.shiftKey ? -1 : 1)] ?? trigger.current)?.focus();
              }
            }}
          >
            {options.map((option, index) => (
              <button
                type="button"
                role="option"
                key={option.value}
                aria-selected={option.value === selected}
                tabIndex={index === active ? 0 : -1}
                ref={(element) => {
                  items.current[index] = element;
                }}
                onClick={() => choose(option.value)}
              >
                <span>{option.label}</span>
                {option.value === selected && <Check size={16} />}
              </button>
            ))}
          </div>,
          root.current?.closest('dialog') ?? document.body,
        )}
    </div>
  );
}
