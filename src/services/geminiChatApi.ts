import { ChatMessage, ChatCountryContext } from '../types/chat';

export async function sendChatMessage(
  message: string,
  countryContext?: ChatCountryContext,
  previousMessages?: ChatMessage[]
): Promise<string> {
  const history = (previousMessages || []).map((m) => ({
    role: m.role,
    text: m.text,
  }));

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        countryContext,
        history,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status})`);
    }

    return data.reply;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(errorMsg);
  }
}

/**
 * Ultra-fast streaming chat: streams incoming chunks via Server-Sent Events (SSE)
 * providing real-time time-to-first-token (<300ms) with ThinkingLevel.LOW and cached responses.
 */
export async function streamChatMessage(
  message: string,
  countryContext?: ChatCountryContext,
  previousMessages?: ChatMessage[],
  onChunk?: (accumulatedText: string, chunk: string, detectedCountry?: string) => void
): Promise<{ reply: string; detectedCountry?: string }> {
  const history = (previousMessages || []).map((m) => ({
    role: m.role,
    text: m.text,
  }));

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        countryContext,
        history,
      }),
    });

    if (!response.ok || !response.body) {
      // Fallback to non-streaming endpoint
      const fallbackReply = await sendChatMessage(message, countryContext, previousMessages);
      if (onChunk) {
        onChunk(fallbackReply, fallbackReply);
      }
      return { reply: fallbackReply };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let serverDetectedCountry: string | undefined = undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataContent = trimmed.replace(/^data:\s*/, '').trim();

        if (dataContent === '[DONE]') {
          return { reply: accumulated, detectedCountry: serverDetectedCountry };
        }

        try {
          const parsed = JSON.parse(dataContent);
          if (parsed && typeof parsed.chunk === 'string') {
            accumulated += parsed.chunk;
            if (parsed.detectedCountry) {
              serverDetectedCountry = parsed.detectedCountry;
            }
            if (onChunk) {
              onChunk(accumulated, parsed.chunk, parsed.detectedCountry);
            }
          }
        } catch {
          // Ignore incomplete JSON chunks from split network packets
        }
      }
    }

    // Process any lingering buffer content
    if (buffer.trim().startsWith('data:')) {
      const dataContent = buffer.trim().replace(/^data:\s*/, '').trim();
      if (dataContent !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataContent);
          if (parsed && typeof parsed.chunk === 'string') {
            accumulated += parsed.chunk;
            if (parsed.detectedCountry) {
              serverDetectedCountry = parsed.detectedCountry;
            }
            if (onChunk) {
              onChunk(accumulated, parsed.chunk, parsed.detectedCountry);
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return { reply: accumulated, detectedCountry: serverDetectedCountry };
  } catch (err: unknown) {
    // If streaming fails (e.g. proxy or reader error), fallback to standard fast endpoint
    console.warn('Stream failed, falling back to standard chat request:', err);
    const fallbackReply = await sendChatMessage(message, countryContext, previousMessages);
    if (onChunk) {
      onChunk(fallbackReply, fallbackReply);
    }
    return { reply: fallbackReply };
  }
}

