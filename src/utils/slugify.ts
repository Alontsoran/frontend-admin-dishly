export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\-]/g, '') // Keep only Hebrew, English, numbers, and hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Remove leading hyphens
    .replace(/-+$/, '');            // Remove trailing hyphens
}
