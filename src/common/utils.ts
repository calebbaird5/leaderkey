
/**
 * 
 * @param color might be a hex color or a CSS variable
 * @param alpha should be a single hex digit (0-f) or two hex digits (00-ff)
 */
export function addAlphaToColor(color: string, alpha: string): string {
  // If it's a hex color, append alpha
  const paddedAlpha = alpha.length === 1 ? `${alpha}0` : alpha;
  if (/^#([A-Fa-f0-9]{6})$/.test(color)) {
    return `${color}${paddedAlpha}`;
  } else if (/^#([A-Fa-f0-9]{3})$/.test(color)) {
    return `${color}${alpha}`;
  }
  // If it's a CSS var, use rgba with var and alpha
  if (/^var\(.+\)$/.test(color)) {
    // Default fallback to white if var is not resolved
    return `rgba(${color}, ${parseInt(paddedAlpha, 16) / 255})`;
  }
  // Otherwise, just return as is
  return color;
}
