export function StoreBanner({bannerUrl}: {bannerUrl?: string | null}) {
  if (!bannerUrl) {
    return null;
  }

  return (
    <div className="bg-[#101014] px-3 py-3">
      <div
        aria-label="7Phone store banner"
        className="mx-auto aspect-[40/13] max-w-7xl overflow-hidden rounded-xl border border-white/10 bg-[#050506] bg-contain bg-center bg-no-repeat shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-brand-pink/20"
        role="img"
        style={{backgroundImage: `url(${bannerUrl})`}}
      />
    </div>
  );
}
