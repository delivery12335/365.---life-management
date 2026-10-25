import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useLanguage, type Language } from '../i18n';

const options: { value: Language; label: string; short: string }[] = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'ru', label: 'Русский', short: 'RU' },
];

export function LanguageDropdown() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const selected = options.findIndex((option) => option.value === language);

  useEffect(() => {
    if (open) items.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  function choose(value: Language) {
    setLanguage(value);
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div
      className={`language-dropdown ${open ? 'is-open' : ''}`}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="language-trigger"
        aria-label={`${t.language}: ${options[selected].label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setActive(selected);
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive(selected);
            setOpen(true);
          }
        }}
      >
        <Globe2 size={15} />
        <span>{options[selected].label}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div
          className="language-options"
          id={id}
          role="listbox"
          aria-label={t.language}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActive(
                (index) =>
                  (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length,
              );
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault();
              setActive(event.key === 'Home' ? 0 : options.length - 1);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          {options.map((option, index) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === language}
              tabIndex={index === active ? 0 : -1}
              ref={(element) => {
                items.current[index] = element;
              }}
              onClick={() => choose(option.value)}
            >
              <span className="language-code">{option.short}</span>
              <span>{option.label}</span>
              {option.value === language && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
