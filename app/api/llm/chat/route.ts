import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { errorManager, createErrorContext, LLMProviderError, NotImplementedError } from '@/lib/error-system';
import { decrypt } from '@/lib/crypto';

// ===== OpenAI Provider Logic =====
async function chatOpenAI(request: any, apiKey: string, baseUrl?: string): Promise<any> {
    const effectiveBaseUrl = baseUrl || 'https://api.openai.com/v1';
    const model = request.model || 'gpt-3.5-turbo';

    const response = await fetch(`${effectiveBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 4096,
            stream: false,
        }),
        signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new LLMProviderError('openai', errorBody.error?.message || `HTTP ${response.status}`, createErrorContext('/api/llm/chat', request.userId, { streaming: false }));
    }
    const data = await response.json();
    return { content: data.choices[0].message?.content || '', finish_reason: data.choices[0].finish_reason, usage: data.usage };
}

async function* streamOpenAI(request: any, apiKey: string, baseUrl?: string): AsyncGenerator<string, void, undefined> {
    const effectiveBaseUrl = baseUrl || 'https://api.openai.com/v1';
    const model = request.model || 'gpt-3.5-turbo';

    const response = await fetch(`${effectiveBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 4096,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new LLMProviderError('openai', errorBody.error?.message || `HTTP ${response.status}`, createErrorContext('/api/llm/chat', request.userId, { streaming: true }));
    }

    if (!response.body) throw new LLMProviderError('openai', 'No response body received', createErrorContext('/api/llm/chat', request.userId));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;
                    try {
                        const content = JSON.parse(data).choices[0]?.delta?.content;
                        if (content) yield content;
                    } catch (e) { /* Ignore malformed JSON */ }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

// ===== Provider Factory =====
const providerFactory = {
    openai: {
        chat: chatOpenAI,
        stream: streamOpenAI,
    },
    anthropic: {
        chat: async () => { throw new NotImplementedError('Anthropic chat not implemented') },
        stream: async function*() { throw new NotImplementedError('Anthropic stream not implemented') },
    },
    googleai: {
        chat: async () => { throw new NotImplementedError('GoogleAI chat not implemented') },
        stream: async function*() { throw new NotImplementedError('GoogleAI stream not implemented') },
    },
};

// ===== Main POST Handler =====
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const userId = session.user.id;

        const body = await req.json();
        const { provider = 'openai', messages, model, temperature, max_tokens, stream = true } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new NextResponse(JSON.stringify({ error: 'Messages are required' }), { status: 400 });
        }

        const providerImplementation = providerFactory[provider as keyof typeof providerFactory];
        if (!providerImplementation) {
            return new NextResponse(JSON.stringify({ error: `Provider '${provider}' not supported` }), { status: 400 });
        }

        const providerConfig = await prisma.providerConfig.findFirst({ where: { userId, provider } });
        if (!providerConfig?.key) {
            return new NextResponse(JSON.stringify({ error: `API key for ${provider} not configured` }), { status: 400 });
        }

        const apiKey = decrypt(providerConfig.key);
        const requestPayload = { messages, model, temperature, max_tokens, userId };
        const baseUrl = providerConfig.baseUrl || undefined;

        if (stream) {
            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        const generator = providerImplementation.stream(requestPayload, apiKey, baseUrl);
                        for await (const chunk of generator) {
                            controller.enqueue(new TextEncoder().encode(chunk));
                        }
                        controller.close();
                    } catch (error) {
                        const context = createErrorContext('/api/llm/chat', userId, { provider });
                        await errorManager.logError(error as Error, context);
                        controller.error(error);
                    }
                },
            });
            return new Response(readableStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        } else {
            const result = await providerImplementation.chat(requestPayload, apiKey, baseUrl);
            return NextResponse.json(result);
        }

    } catch (error) {
        const context = createErrorContext('/api/llm/chat');
        await errorManager.logError(error as Error, context);
        const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
