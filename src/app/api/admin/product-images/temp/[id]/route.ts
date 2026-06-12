import {NextResponse} from 'next/server';

export const runtime = 'nodejs';

type TemporaryImage = {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
};

const temporaryImages = (globalThis as typeof globalThis & {
  __sevenphoneTemporaryImages?: Map<string, TemporaryImage>;
}).__sevenphoneTemporaryImages;

export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const image = temporaryImages?.get(id);

  if (!image) {
    return NextResponse.json({message: 'Temporary image expired or not found.'}, {status: 404});
  }

  return new Response(new Uint8Array(image.buffer), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': image.contentType
    }
  });
}
