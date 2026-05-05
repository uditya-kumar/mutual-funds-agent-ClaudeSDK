import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { HookCallback } from "@anthropic-ai/claude-agent-sdk";

const anthropic = new AnthropicBedrock({
  awsRegion: process.env.AWS_REGION,
});

const guardrailModel = "global.anthropic.claude-haiku-4-5-20251001-v1:0"

export let lastBlockReason: string | null = null;

export const mutualFundGuardrail: HookCallback = async (input) => {
  lastBlockReason = null;
  const userPrompt = (input as any).prompt;

  if (input.hook_event_name === "UserPromptSubmit") {
    const response = await anthropic.messages.create({
      model: guardrailModel,
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You are a topic classifier. Determine if this query is about mutual funds, investments, NAV, SIP, fund performance, portfolio, or financial markets.

Query: "${userPrompt}"

Respond ONLY with valid JSON:
{"ok": true} if related to mutual funds/investments
{"ok": false, "reason": "I'm a mutual funds assistant. Your question is outside my expertise."} if unrelated`,
        },
      ],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code blocks if present (```json ... ```)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    const result = JSON.parse(text);

    if (!result.ok) {
      lastBlockReason = result.reason;
      return {
        decision: "block",
        reason: result.reason,
      };
    }
  }
  return {};
};
