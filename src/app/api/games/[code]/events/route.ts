import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const headersList = headers();
  const encoder = new TextEncoder();

  try {
    const game = await prisma.game.findUnique({
      where: { code: params.code },
      include: { players: true },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(game)}\n\n`));

        // Keep connection alive
        const interval = setInterval(() => {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        }, 30000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}