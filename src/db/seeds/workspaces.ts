import { db } from '@/db';
import { workspaces } from '@/db/schema';

async function main() {
    const sampleWorkspaces = [
        {
            ownerId: 1,
            name: 'Customer Support Bot',
            description: 'AI-powered chatbot designed to handle customer inquiries, provide instant support, and resolve common issues 24/7. Trained on comprehensive FAQ and support documentation.',
            createdAt: new Date('2024-12-05').toISOString(),
            updatedAt: new Date('2024-12-05').toISOString(),
        },
        {
            ownerId: 2,
            name: 'Sales Assistant',
            description: 'Intelligent sales assistant that qualifies leads, answers product questions, and guides prospects through the sales funnel with personalized recommendations.',
            createdAt: new Date('2024-12-08').toISOString(),
            updatedAt: new Date('2024-12-08').toISOString(),
        },
        {
            ownerId: 1,
            name: 'HR Chatbot',
            description: 'HR virtual assistant helping employees with benefits information, leave requests, company policies, and onboarding processes. Streamlines HR operations and improves employee experience.',
            createdAt: new Date('2024-12-10').toISOString(),
            updatedAt: new Date('2024-12-10').toISOString(),
        },
        {
            ownerId: 3,
            name: 'E-commerce AI',
            description: 'Conversational AI for online shopping that provides product recommendations, tracks orders, handles returns, and assists with checkout process to boost conversion rates.',
            createdAt: new Date('2024-12-12').toISOString(),
            updatedAt: new Date('2024-12-12').toISOString(),
        },
        {
            ownerId: 2,
            name: 'Healthcare Assistant',
            description: 'HIPAA-compliant medical assistant chatbot that helps patients schedule appointments, access medical records, get prescription refills, and receive preliminary health guidance.',
            createdAt: new Date('2024-12-15').toISOString(),
            updatedAt: new Date('2024-12-15').toISOString(),
        },
        {
            ownerId: 3,
            name: 'Financial Advisor Bot',
            description: 'AI-powered financial advisor providing personalized investment recommendations, budget planning assistance, and real-time market insights. Helps users make informed financial decisions.',
            createdAt: new Date('2024-12-17').toISOString(),
            updatedAt: new Date('2024-12-17').toISOString(),
        },
        {
            ownerId: 1,
            name: 'Travel Guide AI',
            description: 'Comprehensive travel assistant offering destination recommendations, itinerary planning, flight and hotel bookings, and local tips. Your personal travel concierge available anytime.',
            createdAt: new Date('2024-12-20').toISOString(),
            updatedAt: new Date('2024-12-20').toISOString(),
        },
        {
            ownerId: 2,
            name: 'Education Tutor',
            description: 'Adaptive learning companion that provides personalized tutoring across multiple subjects, homework help, exam preparation, and progress tracking. Makes learning engaging and effective.',
            createdAt: new Date('2024-12-22').toISOString(),
            updatedAt: new Date('2024-12-22').toISOString(),
        }
    ];

    await db.insert(workspaces).values(sampleWorkspaces);
    
    console.log('✅ Workspaces seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});