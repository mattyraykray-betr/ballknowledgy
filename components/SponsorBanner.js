export default function SponsorBanner({
  href = "https://advertiser-website.com",
  desktopLightSrc = "/sponsor-desktop-light.png",
  desktopDarkSrc = "/sponsor-desktop-dark.png",
  mobileLightSrc = "/sponsor-mobile-light.png",
  mobileDarkSrc = "/sponsor-mobile-dark.png",
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
        marginTop: "auto",
        paddingTop: 18,
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
          border: "none",
          borderRadius: 0,
          overflow: "hidden",
          background: "transparent",
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
