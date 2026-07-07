import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * POST /api/revalidate
 *
 * Webhook endpoint for ISR on-demand revalidation.
 * Requires the REVALIDATE_SECRET env var to match the x-revalidate-secret header.
 *
 * Body (JSON):
 *   { "path": "/en/activities/montreal" }      — revalidate a specific path
 *   { "tag": "activities-montreal" }            — revalidate by tag
 *   { "locale": "en", "city": "montreal" }      — revalidate all pages for a city
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid or missing revalidation secret' }, { status: 401 });
  }

  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { path, tag, locale, city } = body;

  try {
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }

    if (locale && city) {
      // Revalidate the full city hub and all category pages for a given city
      revalidatePath(`/${locale}/activities/${city}`);
      revalidatePath(`/${locale}/activities/${city}/[category]`, 'page');
      revalidatePath(`/${locale}/seasonal/[slug]`, 'page');
      return NextResponse.json({ revalidated: true, city, locale });
    }

    return NextResponse.json(
      { message: 'Provide path, tag, or locale+city in the request body.' },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Revalidation failed', error: String(err) },
      { status: 500 },
    );
  }
}
