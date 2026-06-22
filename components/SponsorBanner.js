export default function SponsorBanner({
  href = "https://advertiser-website.com",
  desktopLightSrc = "/ads/sponsor-desktop-light.png",
  desktopDarkSrc = "/ads/sponsor-desktop-dark.png",
  mobileLightSrc = "/ads/sponsor-mobile-light.png",
  mobileDarkSrc = "/ads/sponsor-mobile-dark.png",
  alt = "Sponsored advertisement",
  darkMode = false,
  theme,
}) {
  const desktopSrc = darkMode ? desktopDarkSrc : desktopLightSrc;
  const mobileSrc = darkMode ? mobileDarkSrc : mobileLightSrc;

  return (
    <aside
      aria-label="Sponsored advertisement"
      style={{
        width: "100%",
        margin: "18px auto 0",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
          color: theme?.muted || "#666",
          marginBottom: 6,
          letterSpacing: "0.04em",
        }}
      >
        Sponsored
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{
          display: "block",
          width: "100%",
          border: `1px solid ${theme?.border || "#d8d8d8"}`,
          borderRadius: 8,
          overflow: "hidden",
          background: theme?.card || "#f6f6f6",
          textDecoration: "none",
        }}
      >
        <picture>
          <source media="(max-width: 640px)" srcSet={mobileSrc} />
          <img
            src={desktopSrc}
            alt={alt}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: 180,
              objectFit: "cover",
            }}
          />
        </picture>
      </a>
    </aside>
  );
}
