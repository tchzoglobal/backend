import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://edzyte.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const collections = ['subjects', 'lessons', 'resources', 'boards']
  
  const sitemapEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date() },
  ]

  // Loop through collections to generate dynamic URLs
  for (const slug of collections) {
    try {
      const response = await fetch(`${BASE_URL}/api/${slug}?limit=1000`)
      const data = await response.json()

      const entries = data.docs.map((doc: any) => ({
        url: `${BASE_URL}/${slug}/${doc.slug || doc.id}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: 'weekly',
        priority: slug === 'subjects' ? 0.8 : 0.6,
      }))

      sitemapEntries.push(...entries)
    } catch (error) {
      console.error(`Sitemap error for ${slug}:`, error)
    }
  }

  return sitemapEntries
}