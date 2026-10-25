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
