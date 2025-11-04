import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';

async function main() {
    const now = new Date();
    const sampleWorkspaceMembers = [
        {
            workspaceId: 1,
            userId: 1,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 1,
            userId: 2,
            role: 'admin',
            joinedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 2,
            userId: 2,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 2,
            userId: 3,
            role: 'member',
            joinedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 3,
            userId: 3,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 3,
            userId: 4,
            role: 'admin',
            joinedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 4,
            userId: 4,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 4,
            userId: 5,
            role: 'member',
            joinedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 5,
            userId: 5,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 5,
            userId: 1,
            role: 'admin',
            joinedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 6,
            userId: 1,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            workspaceId: 7,
            userId: 2,
            role: 'owner',
            joinedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(workspaceMembers).values(sampleWorkspaceMembers);
    
    console.log('✅ Workspace members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});