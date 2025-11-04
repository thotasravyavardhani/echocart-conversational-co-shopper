import { db } from '@/db';
import { trainingJobs } from '@/db/schema';

async function main() {
    const now = new Date();
    const getRandomDateWithinLastWeek = (daysAgo: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        return date.toISOString();
    };

    const addHoursToDate = (dateStr: string, hours: number) => {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    };

    const sampleTrainingJobs = [
        {
            workspaceId: 1,
            datasetId: 1,
            status: 'success',
            log: 'Model trained successfully in 120s. Accuracy: 94.5%. Total samples processed: 15,420.',
            modelPath: 's3://echocart-models/workspace-1/model_20240115.pkl',
            createdAt: getRandomDateWithinLastWeek(6),
            finishedAt: addHoursToDate(getRandomDateWithinLastWeek(6), 2),
        },
        {
            workspaceId: 2,
            datasetId: 3,
            status: 'failed',
            log: 'Error: insufficient data. Minimum 10,000 samples required, only 3,245 provided.',
            modelPath: null,
            createdAt: getRandomDateWithinLastWeek(5),
            finishedAt: addHoursToDate(getRandomDateWithinLastWeek(5), 1),
        },
        {
            workspaceId: 3,
            datasetId: 5,
            status: 'running',
            log: 'Training started... Processing batch 1500/3000. ETA: 45 minutes.',
            modelPath: null,
            createdAt: getRandomDateWithinLastWeek(1),
            finishedAt: null,
        },
        {
            workspaceId: 1,
            datasetId: 2,
            status: 'queued',
            log: null,
            modelPath: null,
            createdAt: getRandomDateWithinLastWeek(0),
            finishedAt: null,
        },
        {
            workspaceId: 4,
            datasetId: 7,
            status: 'success',
            log: 'Model trained successfully in 180s. Accuracy: 91.2%. Total samples processed: 22,100.',
            modelPath: 's3://echocart-models/workspace-4/model_20240118.pkl',
            createdAt: getRandomDateWithinLastWeek(3),
            finishedAt: addHoursToDate(getRandomDateWithinLastWeek(3), 3),
        },
        {
            workspaceId: 5,
            datasetId: 8,
            status: 'failed',
            log: 'Error: data validation failed. Found 1,234 null values in required fields.',
            modelPath: null,
            createdAt: getRandomDateWithinLastWeek(4),
            finishedAt: addHoursToDate(getRandomDateWithinLastWeek(4), 1),
        },
        {
            workspaceId: 2,
            datasetId: 4,
            status: 'success',
            log: 'Model trained successfully in 95s. Accuracy: 96.8%. Total samples processed: 12,890.',
            modelPath: 's3://echocart-models/workspace-2/model_20240120.pkl',
            createdAt: getRandomDateWithinLastWeek(2),
            finishedAt: addHoursToDate(getRandomDateWithinLastWeek(2), 2),
        },
        {
            workspaceId: 3,
            datasetId: 6,
            status: 'running',
            log: 'Training started... Processing batch 800/2500. Current accuracy: 89.3%. ETA: 1 hour 15 minutes.',
            modelPath: null,
            createdAt: getRandomDateWithinLastWeek(0),
            finishedAt: null,
        },
    ];

    await db.insert(trainingJobs).values(sampleTrainingJobs);
    
    console.log('✅ Training jobs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});