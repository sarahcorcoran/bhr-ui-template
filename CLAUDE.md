# Fabric Design System - Claude Context

You are building UI for BambooHR using the **Fabric Design System**. Always use Fabric components instead of raw HTML/CSS or third-party UI libraries.

## Available Skills

- **`/forge`** - Build pages from Figma URLs using Fabric components (default) or raw React (`--prototype` mode for exploration)
- **`/temper`** - Test implementation quality against Figma designs and audit Fabric compliance (`--compliance-only` for code-only audit)

### Workflow

```
/forge                  → Build page from Figma using Fabric components
/forge --prototype      → Build page from Figma using raw React (exploration)
/temper                 → Visual QA + Figma comparison + Fabric compliance audit
/temper --compliance-only → Audit source code for Fabric violations (no browser needed)
```

### MCP Server Requirements

These skills require two MCP servers to be configured:
- **Figma Desktop MCP** (`mcp__figma-desktop__*`) - For fetching Figma specs and screenshots
- **Playwright MCP** (`mcp__playwright__*`) - For browser automation and visual testing (temper only)

## Resources

- **Storybook** (live component demos + props): https://fabric.bamboohr.net
- **Design Docs** (usage guidelines): https://weave.bamboohr.net
- **Figma** (visual specs): https://www.figma.com/design/7IHktnp21R07SgRbODpwns/Fabric-for-Claude
- **Figma Library**: https://www.figma.com/file/0sjpCktKnfFT31CuECm8oz
- **Component Reference**: See `docs/fabric-component-reference.md` in this project

## Critical Rules

1. **Always use Fabric components** -- never create custom buttons, inputs, modals, etc. when a Fabric component exists.
2. **Follow the component hierarchy**: Atoms (Text, Icon, StyledBox) > Molecules (Badge, Chip, Pill, Avatar) > Organisms (Modal, Table, DataGrid, Wizard).
3. **Use design tokens** -- never hardcode colors, spacing, or typography. Fabric components use token-based styling.
4. **One primary button per context** -- never render multiple `type="primary"` buttons in the same view.
5. **Toggles auto-save** -- never put a RoundedToggle inside a form with a Save button. Use Checkbox instead.
6. **Select vs Dropdown** -- Select Fields are form inputs that spawn a menu. Dropdowns are buttons that spawn a menu. They are different components.
7. **Validate on submit** -- only validate on blur for formatting errors (e.g., date format). Use `*` for required fields.
8. **Section is the universal container** -- all page content goes inside a Section (exceptions: Vertical Wizard, Side Navigation, Page Header, Filled Tabs).
9. **Max 8 checkboxes** -- if more than 8 options, use a Select Field or Autocomplete Multiple instead.
10. **Radio buttons need a default** -- always pre-select one option. Add "None" if skipping should be explicit.
11. **AI-themed components require AI-themed children** -- ALWAYS use `color="ai"` for Buttons inside `InlineMessage status="ai"`. Never mix AI-themed parents with non-AI-themed action buttons.
12. **Gridlet.Body requires ONE wrapper div** -- Always wrap all content in a single `<div>`. Multiple direct children get distributed with `space-between`, creating large white space gaps. Never use Fabric's `Flex` component inside Gridlet.Body.

## Messaging Component Selection

| Need | Component |
|------|-----------|
| Global persistent notice (surveys, trials, required notices) | `Banner` |
| Temporary success/failure toast after action | `Slidedown` |
| Page-level contextual feedback (above sections) | `InPageMessage` |
| Inline contextual guidance (within content) | `InlineMessage` |
| Field-level validation | TextField/SelectField `error`/`warning`/`info` states |

## Form Component Selection

| Input Need | Component |
|------------|-----------|
| Free text | `TextField` |
| Currency/money | `CurrencyField` |
| Dates | `DateField` + `DatePicker` |
| Single choice (few options, <6) | `RadioGroup` |
| Single choice (many options, 6+) | `SelectField` |
| Multiple choice (<8 options) | `CheckboxGroup` |
| Multiple choice (8+ options) | `SelectField` (selectable) or `AutocompleteMultiple` |
| Binary on/off (auto-save context) | `RoundedToggle` |
| Binary on/off (form submit context) | `Checkbox` |
| Tags/tokens | `Chip` (with `AutocompleteMultiple`) |
| Large dataset multi-select | `TransferList` |
| Visual card selection | `SelectableBox` |

## Layout Pattern

```
PageCapsule
  PageHeaderV2
  Banner (if needed)
  SideNavigation (if needed)
    Section
      [content using Fabric components]
    Section
      [more content]
  ActionFooter (if needed)
```

## Modal Pattern

```
Modal (small: 608px | medium: 800px | full-screen)
  StandardHeadline / HeroHeadline
  UpperContent
  LowerContent
  Buttons: right-aligned for small/medium, left-aligned for full-screen

  Sheet (sub-modal within modal, max one level deep)
    Small: 528px | Medium: 720px | Large: 912px
```

## Gridlet Content Pattern (CRITICAL)

**Problem:** `Gridlet.Body` uses internal flexbox with `justify-content: space-between`. When it has MULTIPLE direct children, they get distributed to top, middle, and bottom of the container, creating large white space gaps.

**Solution:** Always wrap ALL `Gridlet.Body` content in a SINGLE wrapper `<div>`. Use plain divs with CSS flexbox instead of Fabric's `Flex` component.

**Rules:**
1. **ONE direct child inside Gridlet.Body** - Wrap all content in a single container div
2. **Never use Fabric's `Flex` component** - It adds flex-grow/flex-shrink that cause stretching
3. **Use CSS classes for layout** - Define flexbox layout in CSS, not via Fabric's Flex props

**Example - Correct:**
```tsx
// Component - ONE wrapper div containing everything
<Gridlet header={<Gridlet.Header title="My Widget" />}>
  <Gridlet.Body>
    <div className="widget-content">
      <div className="widget-alerts">
        <InlineMessage ... />
        <InlineMessage ... />
      </div>
      <div className="widget-table">...</div>
    </div>
  </Gridlet.Body>
</Gridlet>

// CSS
.widget-content {
  display: flex;
  flex-direction: column;
}

.widget-alerts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
```

**Example - WRONG (multiple direct children):**
```tsx
<Gridlet header={<Gridlet.Header title="My Widget" />}>
  <Gridlet.Body>
    <Flex flexDirection="column" gap={12}>  {/* First child */}
      <InlineMessage ... />
    </Flex>
    <div className="table-container">...</div>  {/* Second child - CAUSES SPACE-BETWEEN! */}
  </Gridlet.Body>
</Gridlet>
```

**CSS Overrides for Gridlet Height:**
When Gridlets need to fit their content height instead of stretching, add these CSS overrides:

```css
/* Override Gridlet's height behavior to fit content */
.widget-container [data-fabric-component="Gridlet"] {
  height: auto !important;
}

.widget-container [data-fabric-component="Gridlet"] > section,
.widget-container [data-fabric-component="Gridlet"] > section > div {
  height: auto !important;
  flex: none !important;
}
```

## Button Hierarchy

- **Primary**: One per context. Reserved for the main action.
- **Secondary**: Important but optional actions.
- **Default**: Baseline/tertiary actions.
- **Text Button**: Low-emphasis actions (e.g., Cancel).
- **Icon Button**: Icon-only actions (never use Standard Button for icon-only).
- Sizes: `small` (in-page content) | `medium` (forms, default) | `large` (signature experiences)

## Button with Icon + Text (CRITICAL)

**Problem:** The `icon` prop on Button renders as **icon-only** (no text). This catches developers off guard.

**Solution:** Use `startIcon` with `IconV2` component to show both icon AND text.

**Example - Correct (icon + text):**
```tsx
<Button
  size="medium"
  color="secondary"
  startIcon={<IconV2 name="heart-pulse-solid" size={16} />}
>
  How is my team doing?
</Button>
```

**Example - WRONG (renders as icon-only, no text):**
```tsx
<Button
  size="medium"
  color="secondary"
  icon="heart-pulse-solid"  {/* WRONG - this makes it icon-only! */}
>
  How is my team doing?
</Button>
```

**Rules:**
- `icon` prop = icon-only button (text children ignored)
- `startIcon` + `IconV2` = icon with text label
- `endIcon` + `IconV2` = text with trailing icon

## Typography

### Headline (titles only)
- X-Large (H1): Fields Bold 48px -- page titles only
- Large (H2): Fields SemiBold 36px
- Medium (H3): Fields SemiBold 26px
- Small (H4): Fields SemiBold 22px
- X-Small: Inter 18px (variable weight)

### Body Text (all non-headline copy)
- Large: Inter 16px
- Medium: Inter 15px (default)
- Small: Inter 14px
- X-Small: Inter 13px
- XX-Small: Inter 11px (extreme space constraints only)
- Weights: Regular, Medium, SemiBold, Bold

## Icons

- Source: **Font Awesome** (search: https://fontawesome.com/search?o=r&s=solid&ip=classic)
- Custom Fabric icons use `bs-` prefix (e.g., `bs-clock-paper-airplane`)
- Default style: outlined/regular. Active/selected state: solid.
- Always pair icons with text labels (exceptions: universally understood icons like trash, close).
- Icon and text should be the same color.

## Color Tokens (semantic, never hardcode)

- **Success**: green variants (strong/medium/weak)
- **Error**: red variants
- **Warning**: orange variants
- **Info**: blue variants
- **Primary**: brand green variants
- **Discovery**: purple variants
- **Neutral**: brown-gray variants
- **Link**: blue (#0b4fd1)
- Use `text-*`, `surface-*`, `border-*`, `icon-*` token prefixes

## AI Component Theming (CRITICAL)

**AI-themed components MUST always use AI-themed child components:**

| Parent Component | Child Component | Required Prop |
|-----------------|-----------------|---------------|
| `InlineMessage status="ai"` | `Button` | `color="ai" variant="outlined"` |
| `ActionTile variant="ai"` | N/A (self-contained) | N/A |
| `InlineMessage color="ai"` | `Button` | `color="ai" variant="outlined"` |

**Rules:**
1. **ALWAYS use `color="ai" variant="outlined"` for Buttons inside AI-themed InlineMessages** - The AI color styling ONLY works with the `outlined` variant. Without `variant="outlined"`, buttons will display as green primary buttons instead of purple AI buttons.
2. **AI InlineMessages should have a single action button** - Keep actions focused and dismissable.
3. **Non-AI InlineMessages use `color="secondary"` buttons** - Gray outline style for standard alerts.
4. **Use `action` prop (singular)** - InlineMessage uses `action`, not `actions`.

**Example - Correct:**
```tsx
<InlineMessage
  status="ai"
  title="AI Recommendation"
  description="I detected an opportunity..."
  action={
    <Button size="small" color="ai" variant="outlined" onClick={handleAction}>
      Take Action
    </Button>
  }
/>
```

**Example - WRONG:**
```tsx
<InlineMessage
  status="ai"
  title="AI Recommendation"
  description="I detected an opportunity..."
  action={
    <Button size="small" color="ai" onClick={handleAction}>  {/* WRONG - missing variant="outlined" */}
      Take Action
    </Button>
  }
/>
```

## TileV2 for Stats & Dashboard Metrics

Use `TileV2` for displaying stats, metrics, or object groups with in-tile actions. It's ideal for dashboard summaries.

**Props:**
- `icon` (required): Font Awesome icon name or `TileV2.Avatar`
- `title` (required): Main content (use for numbers in stat tiles)
- `description`: Label text below title
- `orientation`: `'horizontal'` | `'vertical'` (default)
- `titleSize`: `'small'` | `'medium'` | `'large'`
- `actions`: Array of action buttons
- `variant`: `'muted'` | undefined

**Status Colors:** TileV2 doesn't have built-in status colors. Use wrapper divs with CSS:

```tsx
<div className="stat-tile-wrapper stat-tile-wrapper--error">
  <TileV2
    icon="triangle-exclamation-solid"
    title="4"
    description="Overdue"
    orientation="horizontal"
  />
</div>
```

```css
.stat-tile-wrapper--error {
  background-color: var(--fabric-surface-color-error-weak);
  border-radius: 8px;
}
.stat-tile-wrapper--error [data-fabric-component="TileV2"] {
  background-color: transparent;
}
```

**When to use TileV2:**
- Stats/metrics display (e.g., "4 Overdue", "3 Due Soon")
- Dashboard summaries
- Object groups needing in-tile actions

## Pill Component

Use `muted` prop for softer, less saturated pill colors:

```tsx
<Pill muted type={PillType.Error}>Critical</Pill>
<Pill muted type={PillType.Warning}>Warning</Pill>
<Pill muted type={PillType.Success}>Success</Pill>
<Pill muted type={PillType.Info}>Info</Pill>
<Pill muted type={PillType.Neutral}>Neutral</Pill>
```

## Table Pattern for Gridlets

For data tables inside Gridlets, use this consistent pattern:

```tsx
<Gridlet header={<Gridlet.Header title="Title (count)" />}>
  <Gridlet.Body>
    <div className="insights-card-content">
      {/* Optional: InlineMessage for alerts */}
      <InlineMessage status="ai" title="..." description="..." />

      {/* Table container */}
      <div className="insights-table-container">
        <table className="insights-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="employee-cell">
                    <Avatar src={...} size={32} />
                    <div className="employee-info">
                      <BodyText size="small" weight="medium">Name</BodyText>
                      <BodyText size="extra-small" color="neutral-weak">Subtitle</BodyText>
                    </div>
                  </div>
                </td>
                <td><Pill muted type={PillType.Info}>Type</Pill></td>
                <td><Button size="small" variant="outlined" color="secondary">Action</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Gridlet.Body>
</Gridlet>
```

## Component API Gotchas

| Component | Correct | Wrong |
|-----------|---------|-------|
| `Gridlet.Header` | `title="Text"` | `subtitle` prop (doesn't exist) |
| `ProgressBar` | `current={50} total={100}` | `value`/`max` props |
| `BodyText` size | `size="extra-small"` | `size="x-small"` |
| `Headline` size | `size="small"` | `size="x-small"` |
| `IconV2` color | `color="success-strong"` | `color="success"` |
| `Button` variant | `variant="contained"` | `variant="filled"` |

## React Hook Form (RHF) Integration

Fabric provides RHF-compatible wrappers for: AutocompleteSingle, AutocompleteMultiple, Checkbox, RadioGroup, TextField, CurrencyField, EmailField, DatePicker, and SelectField. In Storybook, look for stories suffixed with "RHF".

## Prototype Mode (Exploring Outside the System)

Teams can explore new ideas without Fabric constraints using `/forge --prototype`. This mode:
- Builds raw React components from Figma specs with custom CSS
- Does NOT use Fabric components or tokens
- Output is clearly marked as non-production

**Rules for prototype code:**
- Never merge prototype code directly into production
- When ready to productionize, re-run `/forge` (without `--prototype`) to rebuild with Fabric
- Or run `/temper --compliance-only` to see what needs to change
- Prototype files should live in a separate directory (e.g., `/src/prototypes/`)

## When You Don't Know

If you're unsure which component to use or how to configure it:
1. Check `docs/fabric-component-reference.md` for the full API reference
2. Open the Storybook link for the component to see interactive examples
3. Check the Weave docs link for usage guidelines and do's/don'ts
4. Ask the developer -- don't guess and don't create custom components
