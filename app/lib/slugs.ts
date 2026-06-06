import { customAlphabet } from 'nanoid';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const generateShortId = customAlphabet(alphabet, 6);

/**
 * Normalizes a string into a URL slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generates a unique campaign slug based on title.
 * If unique check fails, appends a short random id.
 */
export async function generateUniqueSlug(
  title: string,
  isSlugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(title) || 'campaign';
  
  // First, check if base slug is available
  if (!(await isSlugTaken(baseSlug))) {
    return baseSlug;
  }
  
  // If taken, append short random id
  let slug = `${baseSlug}-${generateShortId()}`;
  let attempts = 0;
  
  // Loop until unique, cap attempts to prevent infinite loop
  while (await isSlugTaken(slug)) {
    slug = `${baseSlug}-${generateShortId()}`;
    attempts++;
    if (attempts > 10) {
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
      break;
    }
  }
  
  return slug;
}
