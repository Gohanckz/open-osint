import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] starting...');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@open-osint.local' },
    update: {},
    create: {
      email: 'demo@open-osint.local',
      username: 'demo',
      displayName: 'Demo Investigator',
      isVerified: true,
      reputationScore: 100,
    },
  });

  const ws = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Newsroom',
      slug: 'demo',
      ownerId: demoUser.id,
      plan: 'NEWSROOM',
    },
  });

  const board = await prisma.board.create({
    data: {
      title: 'Sample Case (Demo)',
      description: 'Sample investigation board to demonstrate the canvas.',
      ownerId: demoUser.id,
      workspaceId: ws.id,
      visibility: 'UNLISTED',
      contributionMode: 'INVITE',
      members: {
        create: [{ userId: demoUser.id, role: 'OWNER' }],
      },
    },
  });

  const samplePerson = await prisma.node.create({
    data: {
      boardId: board.id,
      type: 'PERSON',
      title: 'Sample Person',
      subtitle: 'Example node · Demo',
      fields: { firstName: 'Sample', lastName: 'Person', city: 'Demo City' },
      tags: ['demo', 'sample'],
      x: 0,
      y: 0,
      createdById: demoUser.id,
    },
  });

  const sampleCompany = await prisma.node.create({
    data: {
      boardId: board.id,
      type: 'COMPANY',
      title: 'Sample Corp',
      subtitle: 'Example company',
      fields: { taxId: '000.000.000-0', founded: '2010' },
      tags: ['demo'],
      x: 320,
      y: 120,
      createdById: demoUser.id,
    },
  });

  await prisma.connection.create({
    data: {
      boardId: board.id,
      fromNodeId: samplePerson.id,
      toNodeId: sampleCompany.id,
      type: 'OWNERSHIP',
      label: 'majority shareholder',
      strength: 4,
      verified: true,
      createdById: demoUser.id,
    },
  });

  await prisma.template.upsert({
    where: { key: 'investigation-default' },
    update: {},
    create: {
      key: 'investigation-default',
      title: 'Investigación periodística',
      description: 'Plantilla con tipos para personas, empresas, eventos y evidencia.',
      category: 'journalism',
      isOfficial: true,
      payload: { nodeTypes: ['PERSON', 'COMPANY', 'EVENT', 'EVIDENCE'] },
    },
  });

  await prisma.template.upsert({
    where: { key: 'aml-due-diligence' },
    update: {},
    create: {
      key: 'aml-due-diligence',
      title: 'Due diligence AML/KYC',
      description: 'Estructura para análisis de relaciones financieras.',
      category: 'compliance',
      isOfficial: true,
      payload: { nodeTypes: ['PERSON', 'COMPANY', 'EVIDENCE'] },
    },
  });

  console.log('[seed] done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
