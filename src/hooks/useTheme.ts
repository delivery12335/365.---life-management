import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'dark' | 'light';
export function useTheme() {
  const [theme, updateTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('365.theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const current = useRef(theme);
  const transition = useRef<ViewTransition | null>(null);
  const animation = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    current.current = theme;
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#080809' : '#f5f5f7');
    try {
      localStorage.setItem('365.theme', theme);
    } catch {
      /* Theme still works without storage. */
    }
  }, [theme]);

  useEffect(
    () => () => {
      transition.current?.skipTransition();
      animation.current?.cancel();
      delete document.documentElement.dataset.themeTransition;
    },
    [],
  );

  function setTheme(next: Theme) {
    if (next === current.current) return;
    transition.current?.skipTransition();
    animation.current?.cancel();
    transition.current = null;
    animation.current = null;
    const root = document.documentElement;
    delete root.dataset.themeTransition;
    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      current.current = next;
      updateTheme(next);
      return;
    }

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const radius = Math.ceil(Math.hypot(x, y)) + 2;
    const small = `circle(0px at ${x}px ${y}px)`;
    const large = `circle(${radius}px at ${x}px ${y}px)`;
    root.dataset.themeTransition = next;
    current.current = next;
    const active = document.startViewTransition(() => {
      flushSync(() => updateTheme(next));
    });
    transition.current = active;

    void (async () => {
      try {
        await active.ready;
        if (transition.current !== active) return;
        const reveal = root.animate(
          { clipPath: next === 'dark' ? [small, large] : [large, small] },
          {
            duration: 720,
            easing: 'cubic-bezier(.65, 0, .35, 1)',
            fill: 'forwards',
            pseudoElement:
              next === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)',
          },
        );
        animation.current = reveal;
        await reveal.finished;
        await active.finished;
      } catch {
        // Skipped transitions (quick repeat clicks or navigation) keep the selected theme.
      } finally {
        if (transition.current === active) {
          animation.current?.cancel();
          animation.current = null;
          transition.current = null;
          delete root.dataset.themeTransition;
        }
      }
    })();
  }

  return { theme, setTheme, toggle: () => setTheme(current.current === 'dark' ? 'light' : 'dark') };
}
