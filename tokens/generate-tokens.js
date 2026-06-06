/**
 * generate-tokens.js
 *
 * Reads color-token.json and design-tokens.json, then generates
 * a single CSS file (design-tokens.css) containing:
 *   - Color role CSS variables (light & dark themes) resolved from the palette
 *   - Typography CSS variables for every text style
 *
 * Usage:  node generate-tokens.js
 * Output: design-tokens.css (in the same directory)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Load source JSON files
// ---------------------------------------------------------------------------
const colorTokens = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'color-token.json'), 'utf-8')
);
const designTokens = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'design-tokens.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a camelCase or PascalCase string to kebab-case.
 *   e.g. "onPrimaryContainer" → "on-primary-container"
 */
function toKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Resolve a token reference like "{color.palette.primary.80}" or
 * "{color.key.primary}" to its actual value from the color tokens object.
 *
 * Returns the raw value string (e.g. an HSL color) or null if unresolvable.
 */
function resolveReference(ref, colorData) {
  // Strip the curly braces
  const refPath = ref.replace(/^\{|\}$/g, '');
  const segments = refPath.split('.');

  let current = colorData;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return null;

    // Try exact key first, then case-insensitive fallback
    if (seg in current) {
      current = current[seg];
    } else {
      const match = Object.keys(current).find(
        (k) => k.toLowerCase() === seg.toLowerCase()
      );
      if (match) {
        current = current[match];
      } else {
        return null;
      }
    }
  }

  return typeof current === 'string' ? current : null;
}

/**
 * Append a unit to a numeric value based on the CSS property it represents.
 *   - fontSize, lineHeight, letterSpacing, paragraphIndent, paragraphSpacing → px
 *   - fontWeight → unitless
 */
function withUnit(property, value) {
  const pxProperties = [
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'paragraphIndent',
    'paragraphSpacing',
  ];

  if (pxProperties.includes(property)) {
    return `${value}px`;
  }
  return `${value}`;
}

// ---------------------------------------------------------------------------
// 3. Build color role CSS variables
// ---------------------------------------------------------------------------

/**
 * Process one theme (light or dark) from color.role and return an array of
 * CSS variable declarations as strings, e.g.:
 *   "--color-primary: hsl(272, 100%, 38%);"
 */
function buildColorRoleVars(themeRoles, colorData) {
  const vars = [];

  for (const [roleName, ref] of Object.entries(themeRoles)) {
    const resolved = resolveReference(ref, colorData);
    const varName = `--color-${toKebab(roleName)}`;

    if (resolved) {
      vars.push(`  ${varName}: ${resolved};`);
    } else {
      // Keep the unresolved reference as a comment for debugging
      vars.push(`  /* ${varName}: unresolved → ${ref} */`);
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// 4. Build typography CSS variables
// ---------------------------------------------------------------------------

/**
 * Walk the font.text object from design-tokens.json and emit CSS variables
 * for every text style.
 *
 * Naming convention:
 *   --font-<category>-<style>-<property>
 *   e.g. --font-headings-h1-font-size, --font-body-text-m-b-font-weight
 */
function buildTypographyVars(fontTextObj) {
  const vars = [];

  for (const [category, styles] of Object.entries(fontTextObj)) {
    for (const [styleName, styleDef] of Object.entries(styles)) {
      // styleDef has { type, value: { fontSize, fontFamily, … }, extensions }
      if (!styleDef.value || typeof styleDef.value !== 'object') continue;

      const prefix = `--font-${toKebab(category)}-${toKebab(styleName.replace(/\s+/g, '-'))}`;

      for (const [prop, val] of Object.entries(styleDef.value)) {
        const cssVal =
          typeof val === 'number' ? withUnit(prop, val) : val;
        const cssVarName = `${prefix}-${toKebab(prop)}`;
        vars.push(`  ${cssVarName}: ${cssVal};`);
      }
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// 5. Assemble the CSS output
// ---------------------------------------------------------------------------

const lightRoles = colorTokens.color.role.light;
const darkRoles = colorTokens.color.role.dark;
const fontText = designTokens.font.text;

const lightVars = buildColorRoleVars(lightRoles, colorTokens);
const darkVars = buildColorRoleVars(darkRoles, colorTokens);
const typographyVars = buildTypographyVars(fontText);

const timestamp = new Date().toISOString();

const css = `/* ==========================================================================
   Design Tokens — Auto-generated by generate-tokens.js
   Generated: ${timestamp}
   
   Sections:
     1. Color Roles (Light Theme — default)
     2. Color Roles (Dark Theme)
     3. Typography
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Color Roles — Light Theme (default)
   -------------------------------------------------------------------------- */
:root {
${lightVars.join('\n')}
}

/* --------------------------------------------------------------------------
   2. Color Roles — Dark Theme
   Applied via [data-theme="dark"] on <html> or any ancestor element,
   or via the prefers-color-scheme media query.
   -------------------------------------------------------------------------- */
[data-theme="dark"] {
${darkVars.join('\n')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkVars.map((v) => '  ' + v).join('\n')}
  }
}

/* --------------------------------------------------------------------------
   3. Typography
   -------------------------------------------------------------------------- */
:root {
${typographyVars.join('\n')}
}
`;

// ---------------------------------------------------------------------------
// 6. Write the file
// ---------------------------------------------------------------------------

const outputPath = path.join(__dirname, 'design-tokens.css');
fs.writeFileSync(outputPath, css, 'utf-8');

console.log(`✅  design-tokens.css generated successfully (${outputPath})`);
console.log(`    • ${lightVars.length} light-theme color role variables`);
console.log(`    • ${darkVars.length} dark-theme color role variables`);
console.log(`    • ${typographyVars.length} typography variables`);
