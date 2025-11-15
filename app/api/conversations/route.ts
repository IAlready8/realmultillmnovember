
import { auth } from '@/lib/auth';
import { conversationService } from '@/services/conversation-service';
import { NextRequest, NextResponse } from 'next/server';
import { errorManager, createErrorContext } from '@/lib/error-system';

/**
 * GET /api/conversations
 * Retrieves all conversations for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const conversations = await conversationService.getConversations(session.user.id);
        return NextResponse.json(conversations);

    } catch (error) {
        const context = createErrorContext('/api/conversations/GET');
        await errorManager.logError(error as Error, context);
        return new NextResponse(JSON.stringify({ error: 'Failed to retrieve conversations' }), { status: 500 });
    }
}

/**
 * POST /api/conversations
 * Creates a new conversation.
 * Expects body: { title: string, messages: MessageInput[] }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { title, messages } = await req.json();

        if (!title || !messages || !Array.isArray(messages)) {
            return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
        }

        const newConversation = await conversationService.createConversation(session.user.id, title, messages);
        return NextResponse.json(newConversation, { status: 201 });

    } catch (error) {
        const context = createErrorContext('/api/conversations/POST');
        await errorManager.logError(error as Error, context);
        return new NextResponse(JSON.stringify({ error: 'Failed to create conversation' }), { status: 500 });
    }
}
