import { notFound } from 'next/navigation';
import { prisma } from '@hilo/db';
import { FollowList } from '../FollowList';
import { getMessages } from '@/i18n/server';

function fill(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [user, { t }] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: { id: true, displayName: true, username: true, privacyMode: true },
    }),
    getMessages(),
  ]);
  if (!user) notFound();

  const followers = user.privacyMode
    ? []
    : await prisma.follow.findMany({
        where: { followingId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          follower: {
            select: { id: true, displayName: true, username: true, avatarUrl: true, bio: true },
          },
        },
      });

  return (
    <FollowList
      title={fill(t.profile.followersListTitle, { name: user.displayName })}
      backHref={`/u/${user.username}`}
      backLabel={`@${user.username}`}
      users={followers.map((f) => f.follower)}
      privacy={user.privacyMode}
      emptyTitle={t.profile.noFollowersTitle}
      emptyDescription={fill(t.profile.noFollowersDesc, { name: user.displayName })}
      privacyTitle={t.profile.privateListTitle}
      privacyDescription={t.profile.privateListDesc}
    />
  );
}
