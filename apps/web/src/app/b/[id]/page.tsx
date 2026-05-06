import { notFound, redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { BoardCanvas } from './BoardCanvas';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      nodes: { where: { status: { not: 'ARCHIVED' } } },
      connections: true,
    },
  });
  if (!board) notFound();

  // Comprobamos membresía para ACL + permisos
  const member = userId
    ? await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: id, userId } },
      })
    : null;

  // ACL: tableros privados requieren membresía
  if (board.visibility === 'PRIVATE') {
    if (!userId) redirect('/login');
    if (!member) notFound();
  }

  // canEdit solo para EDITOR / OWNER (no para visitantes ni viewers)
  const canEdit = !!member && (member.role === 'OWNER' || member.role === 'EDITOR');

  // Carga el usuario actual para el menú (puede ser null si entra a un board público sin login)
  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, email: true, avatarUrl: true, username: true },
      })
    : null;

  return (
    <BoardCanvas
      board={board}
      viewerId={userId ?? null}
      canEdit={canEdit}
      currentUser={currentUser}
    />
  );
}
