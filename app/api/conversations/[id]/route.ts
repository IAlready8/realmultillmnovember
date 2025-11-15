
import { auth } from '@/lib/auth';
import { conversationService } from '@/services/conversation-service';
import { NextRequest, NextResponse } from 'next/server';
import { errorManager, createErrorContext } from '@/lib/error-system';

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/conversations/[id]
 * Retrieves a single conversation by its ID.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const conversation = await conversationService.getConversation(params.id);

        // Ensure the user has access to this conversation
        if (!conversation || conversation.userId !== session.user.id) {
            return new NextResponse(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
        }

        return NextResponse.json(conversation);

    } catch (error) {
        const context = createErrorContext('/api/conversations/[id]/GET', undefined, { conversationId: params.id });
        await errorManager.logError(error as Error, context);
        return new NextResponse(JSON.stringify({ error: 'Failed to retrieve conversation' }), { status: 500 });
    }
}

/**
 * POST /api/conversations/[id]
 * Adds a message to an existing conversation.
 * Expects body: { role: string, content: string, provider?: string, model?: string }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // First, verify the user has access to this conversation
        const conversation = await conversationService.getConversation(params.id);
        if (!conversation || conversation.userId !== session.user.id) {
            return new NextResponse(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
        }

        const messageData = await req.json();

        if (!messageData.role || !messageData.content) {
            return new NextResponse(JSON.stringify({ error: 'Invalid message format' }), { status: 400 });
        }

        const newMessage = await conversationService.addMessage(params.id, messageData);
        return NextResponse.json(newMessage, { status: 201 });

    } catch (error) {
        const context = createErrorContext('/api/conversations/[id]/POST', undefined, { conversationId: params.id });
        await errorManager.logError(error as Error, context);
        return new NextResponse(JSON.stringify({ error: 'Failed to add message' }), { status: 500 });
    }
}
