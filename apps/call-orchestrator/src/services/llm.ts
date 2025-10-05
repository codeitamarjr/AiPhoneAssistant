import { SYSTEM_PROMPT } from './llmPrompt';

export type LlmAction =
  | { type: 'NONE' }
  | { type: 'BOOK'; slotISO: string; name?: string; phone?: string; email?: string }
  | { type: 'WAITLIST'; name: string; phone: string }
  | { type: 'HANDOFF' };

export async function callLlm(userText: string, state: any, listing: any): Promise<{ reply: string; action: LlmAction }> {
  // TODO: integrate your preferred LLM (streaming if available)
  // For now, a tiny rule-based fallback:
  if (/view(ing)?/i.test(userText)) {
    return { reply: `We have Wednesday 18:00 or Saturday 12:00. Which suits you?`, action: { type: 'NONE' } };
  }
  if (/hap/i.test(userText)) {
    return { reply: `Yes, HAP is accepted. Standard documents apply.`, action: { type: 'NONE' } };
  }
  return { reply: `Rent is €${listing.monthly_rent_eur}/month, available from ${listing.available_from}. Would you like to book a viewing?`, action: { type: 'NONE' } };
}
