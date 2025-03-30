import { NextResponse } from 'next/server';
import { generateGameCode } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: 'Invalid name' },
        { status: 400 }
      );
    }

    let code: string;
    let existingGame;

    // Generate a unique game code
    do {
      code = generateGameCode();
      existingGame = await prisma.game.findUnique({
        where: { code },
      });
    } while (existingGame);

    // Create new game and host player
    const game = await prisma.game.create({
      data: {
        code,
        players: {
          create: {
            name,
            isHost: true,
          },
        },
      },
    });

    return NextResponse.json({ code: game.code });
  } catch (error) {
    console.error('Failed to create game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}