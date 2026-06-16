export default function sitemap() {
  const baseUrl = "https://www.thatguyrocked.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ball-knowledgy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ladder-golf`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/name-a-dude`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/socials`,
      lastModified: new Date(),
    },
  ];
}
