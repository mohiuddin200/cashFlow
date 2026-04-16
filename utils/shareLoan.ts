import { toPng } from 'html-to-image';

interface ShareNavigator extends Navigator {
  canShare?: (data: { files?: File[]; title?: string; text?: string }) => boolean;
  share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'loan';
}

export async function shareLoanCard(
  node: HTMLElement | null,
  filename: string,
  title: string = 'Loan details'
): Promise<void> {
  if (!node) throw new Error('Share target not mounted');

  const safeName = sanitizeFilename(filename);
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `${safeName}.png`, { type: 'image/png' });

  const nav = typeof navigator !== 'undefined' ? (navigator as ShareNavigator) : null;
  if (nav?.canShare && nav?.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return;
      // Fall through to download fallback on other errors
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
