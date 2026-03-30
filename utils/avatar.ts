export function getAvatarUrl(user: {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}): string {
  if (user.photoURL) return user.photoURL;

  const name = user.displayName || user.email?.split('@')[0] || 'U';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#10b981"/><text x="48" y="48" text-anchor="middle" dy=".35em" fill="white" font-size="36" font-family="system-ui,sans-serif" font-weight="600">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
