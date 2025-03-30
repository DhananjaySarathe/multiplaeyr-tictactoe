import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { code, name } = await request.json();

    if (!code || !name || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { code },
      include: { players: true },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    if (game.players.length >= 2) {
      return NextResponse.json(
        { error: 'Game is full' },
        { status: 400 }
      );
    }

    await prisma.player.create({
      data: {
        name,
        gameId: game.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to join game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}