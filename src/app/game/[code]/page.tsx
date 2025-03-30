import { GameRoom } from '@/components/GameRoom';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface GamePageProps {
  params: {
    code: string;
  };
}

export default async function GamePage({ params: { code } }: GamePageProps) {
  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!game) {
    notFound();
  }

  return <GameRoom initialGame={game} />;
}