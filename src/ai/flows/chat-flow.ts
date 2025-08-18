
'use server';
/**
 * @fileOverview A chatbot flow that responds to user messages.
 *
 * - chat - A function that handles the chatbot's response process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history."),
  message: z.string().describe("The user's latest message."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

export type ChatOutput = string;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  prompt: `You are a helpful and friendly chatbot. Your name is Gemini.

You are in a group chat. Respond to the user's message, taking into account the conversation history.

{{#if history}}
Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}

User's message:
{{{message}}}
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.text();
  }
);
