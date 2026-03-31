import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shadcn-style wrapper around `next-themes` (see https://ui.shadcn.com/docs/dark-mode/vite).
 * `attribute="class"` + `.dark` in `index.css` drives Tailwind `dark:` variants.
 */
export function ThemeProvider({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="stackoverbid-theme"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/** Header: moon in light UI, sun when resolved theme is dark (nav bar stays dark). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'h-9 w-9 shrink-0 p-0',
        isDark ? 'text-amber-300 hover:text-amber-200 hover:bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {!mounted ? <Moon className="h-5 w-5 opacity-0" aria-hidden /> : isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

/** Auth screen / secondary: uses semantic colors. */
export function ThemeToggleMuted({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground', className)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {!mounted ? <Moon className="h-5 w-5 opacity-0" aria-hidden /> : isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
