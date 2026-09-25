export const runtime = 'nodejs';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#050505"/>
  <path d="M18 14h28L33 50h-9l10-27H18z" fill="#ff008c"/>
  <circle cx="45" cy="46" r="5" fill="#fff"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
