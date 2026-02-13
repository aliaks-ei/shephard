# Design Tokens Reference

This document describes the design system used in Shephard, based on shadcn/ui conventions adapted for Quasar.

## Color Palette

### Semantic Colors

Use semantic colors for their intended purpose:

| Variable                      | Hex              | Usage                                          |
| ----------------------------- | ---------------- | ---------------------------------------------- |
| `$primary` / `--primary`      | #00919a (cyan)   | Primary actions, links, focus rings            |
| `$positive` / `--success`     | #118b50 (green)  | Success states, positive amounts, under budget |
| `$negative` / `--destructive` | #f7374f (red)    | Errors, delete actions, over budget            |
| `$warning` / `--warning`      | #fe7743 (orange) | Warnings, approaching limits                   |
| `$info`                       | #5d7c80          | Informational states                           |

### Color Scales

Each color has a 7-step scale (1 = lightest, 7 = darkest):

```scss
// Red scale - for negative/destructive states
$red-1: #feedee  // Background tints
$red-2: #fbc3c6
$red-3: #f98990
$red-4: #f7374f  // Default ($red)
$red-5: #bd1a33
$red-6: #7f0e1f
$red-7: #47040d

// Green scale - for positive/success states
$green-1: #affecb
$green-2: #22e185
$green-3: #19b56a
$green-4: #118b50  // Default ($green)
$green-5: #096338
$green-6: #033e21
$green-7: #011d0c

// Orange scale - for warnings
$orange-1: #ffe9e6
$orange-2: #feb4a3
$orange-3: #fe7743  // Default ($orange)
$orange-4: #ce5309
$orange-5: #953a04
$orange-6: #602302
$orange-7: #300d00

// Cyan scale - for primary/accent
$cyan-1: #caf9ff
$cyan-2: #00e5f3
$cyan-3: #00bac6
$cyan-4: #00919a  // Default ($cyan, $primary)
$cyan-5: #006a71
$cyan-6: #00454a
$cyan-7: #002427
```

## CSS Variables

### Background & Foreground

```css
--background: 0 0% 97%; /* Page background */
--foreground: 30 5% 18%; /* Primary text */
--card: 0 0% 100%; /* Card background */
--card-foreground: 30 5% 18%; /* Card text */
--muted: 210 40% 96%; /* Muted backgrounds */
--muted-foreground: 215 16% 47%; /* Secondary text */
```

Usage with HSL wrapper:

```css
background-color: hsl(var(--background));
color: hsl(var(--foreground));
```

### Border Radius

Follow the shadcn/ui radius scale:

```css
--radius: 0.5rem; /* Base: 8px */
--radius-sm: calc(var(--radius) - 4px); /* 4px */
--radius-md: calc(var(--radius) - 2px); /* 6px - buttons, inputs */
--radius-lg: var(--radius); /* 8px */
--radius-xl: calc(var(--radius) + 4px); /* 12px - cards */
--radius-full: 9999px; /* Pills, avatars */
```

SCSS equivalents:

```scss
$generic-border-radius: 6px;
$button-border-radius: 6px;
$card-border-radius: 12px;
$input-border-radius: 6px;
$chip-border-radius: 9999px;
```

### Shadows

Minimal shadow system:

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

Prefer Quasar's `shadow-1` through `shadow-4` classes for consistency.

### Focus Rings

```css
--ring-width: 3px;
--ring-color: hsl(var(--ring)); /* Primary color */
```

## Dark Mode

Dark mode is handled via `.body--dark` class (Quasar convention). Key differences:

| Token          | Light        | Dark                    |
| -------------- | ------------ | ----------------------- |
| `--background` | 0 0% 97%     | 0 0% 7%                 |
| `--foreground` | 30 5% 18%    | 0 0% 95%                |
| `--card`       | 0 0% 100%    | 0 0% 9%                 |
| `--border`     | 214 32% 91%  | 0 0% 20%                |
| `--primary`    | 184 100% 30% | 184 100% 35% (brighter) |

Use Quasar's `$q.dark.isActive` for conditional dark mode logic in components.

## Typography

```scss
$letter-spacing: -0.011em; /* Slight tightening */
$button-font-weight: 500; /* Medium weight for buttons */
```

## File Locations

- SCSS variables: `src/css/quasar.variables.scss`
- CSS custom properties: `src/css/theme.scss`
- Global styles: `src/css/app.scss`
