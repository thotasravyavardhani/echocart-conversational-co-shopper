import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const getRandomDate = () => {
        const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
        return new Date(randomTime).toISOString();
    };

    const sampleUsers = [
        {
            email: 'john.smith@echocart.com',
            passwordHash: passwordHash,
            name: 'John Smith',
            roles: JSON.stringify(['user', 'admin']),
            profile: JSON.stringify({
                currency: 'USD',
                language: 'en',
                moodHistory: []
            }),
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
        },
        {
            email: 'maria.garcia@echocart.com',
            passwordHash: passwordHash,
            name: 'Maria Garcia',
            roles: JSON.stringify(['user']),
            profile: JSON.stringify({
                currency: 'EUR',
                language: 'es',
                moodHistory: []
            }),
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
        },
        {
            email: 'david.chen@echocart.com',
            passwordHash: passwordHash,
            name: 'David Chen',
            roles: JSON.stringify(['admin']),
            profile: JSON.stringify({
                currency: 'USD',
                language: 'en',
                moodHistory: []
            }),
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
        },
        {
            email: 'sarah.johnson@echocart.com',
            passwordHash: passwordHash,
            name: 'Sarah Johnson',
            roles: JSON.stringify(['user']),
            profile: JSON.stringify({
                currency: 'USD',
                language: 'en',
                moodHistory: []
            }),
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
        },
        {
            email: 'carlos.rodriguez@echocart.com',
            passwordHash: passwordHash,
            name: 'Carlos Rodriguez',
            roles: JSON.stringify(['user', 'admin']),
            profile: JSON.stringify({
                currency: 'EUR',
                language: 'es',
                moodHistory: []
            }),
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});