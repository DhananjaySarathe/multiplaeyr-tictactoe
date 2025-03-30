import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
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

    if (game.players.length < 2) {
      return NextResponse.json(
        { error: 'Not enough players' },
        { status: 400 }
      );
    }

    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game already started' },
        { status: 400 }
      );
    }

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: { status: 'playing' },
      include: { players: true },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Failed to start game:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
} 