import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { mutualFundsServer } from "@/tools/server";

const prompt = "do exa web search only for parag parikh flexi cap direct growth and tell me if this mcp working or not";

const seenIds = new Set<string>();
let totalInputTokens = 0;
let totalOutputTokens = 0;

for await (const message of query({
  prompt: prompt,
  options: {
    mcpServers: {
      mutualFunds: mutualFundsServer,
      "exa-web-search": {
        type: "http",
        url: "https://mcp.exa.ai/mcp",
      },
    },
    allowedTools: [
      "mcp__mutualFunds__search_mutual_funds",
      "mcp__mutualFunds__get_mutual_fund_details",
      "mcp__mutualFunds__get_nav_history",
      "mcp__mutualFunds__get_category_returns",
      "mcp__exa-web-search__*"
    ],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    env: {
      ...process.env,
      ENABLE_TOOL_SEARCH: "auto",
    },
  },
})) {
  if (message.type === "system" && message.subtype === "init") {
    const failedServers = message.mcp_servers.filter((s) => s.status !== "connected");

    if (failedServers.length > 0) {
      console.warn("Failed to connect:", failedServers);
    }
  }

  
  if (message.type === "assistant") {
    const msgId = message.message.id;

    // Parallel tool calls share the same ID, only count once
    if (!seenIds.has(msgId)) {
      seenIds.add(msgId);
      totalInputTokens += message.message.usage.input_tokens;
      totalOutputTokens += message.message.usage.output_tokens;
    }

    for (const block of message.message.content) {
      if (block.type === "tool_use") {
        console.log(`[tool call] ${block.name}`, block.input);
      }
    }
  } else if (message.type === "result" && message.subtype === "success") {
    console.log(`Q: ${prompt}\nA: ${message.result}\n`);
    console.log(`Total cost: $${message.total_cost_usd.toFixed(4)} (Input: ${totalInputTokens} tokens, Output: ${totalOutputTokens} tokens)`);
  }
}
