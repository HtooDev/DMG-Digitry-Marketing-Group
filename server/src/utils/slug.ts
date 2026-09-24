export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

interface SlugModel {
  findUnique(args: { where: { slug: string } }): Promise<{ slug: string } | null>
}

/**
 * Return a URL-safe slug from `base` that is unique on `model`, appending -2, -3...
 * when a collision is found.
 */
export async function ensureUniqueSlug(model: SlugModel, base: string): Promise<string> {
  const slug = slugify(base) || 'untitled'
  let candidate = slug
  let n = 2
  while (await model.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${n++}`
  }
  return candidate
}