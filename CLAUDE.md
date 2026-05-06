# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the agent
npm start

# Install dependencies
npm install
```

## Architecture

This is a Claude Agent SDK application that analyzes Indian mutual funds via natural language queries.

**Entry point**: `src/agent.ts` - Uses `query()` from the SDK to run the agent with an MCP server and input guardrail.

**MCP Server** (`src/tools/server.ts`): Creates an in-process MCP server using `createSdkMcpServer()` with four tools:
- `search_mutual_funds` - Search funds by name/keyword
- `get_mutual_fund_details` - Get fund info by slug (e.g., `parag-parikh-flexi-cap-direct-growth-100060`)
- `get_nav_history` - Historical NAV data (fund ID, period, interval)
- `get_category_returns` - Category comparison data

Each tool implementation is in `src/tools/` and makes HTTP calls to the external API (`API_BASE_URL` env var).

**Guardrail** (`src/guardrails/mutualFundGuardrail.ts`): Input guardrail using Haiku to filter non-investment queries. Runs on `UserPromptSubmit` hook. Uses Bedrock SDK directly for the classification call.

**Path alias**: `@/*` maps to `./src/*` (configured in tsconfig.json).

## Provider Configuration

The agent supports three Claude providers. The guardrail always uses Bedrock (`AnthropicBedrock` SDK).

- **Anthropic API**: Set `ANTHROPIC_API_KEY`
- **Bedrock**: Set `CLAUDE_CODE_USE_BEDROCK=1` + AWS credentials
- **Vertex AI**: Set `CLAUDE_CODE_USE_VERTEX=1` + GCP credentials

## External Dependencies

- **Mutual Funds API**: Self-hostable backend at [Upstocks-API](https://github.com/uditya-kumar/Upstocks-API). Default endpoint on Render free tier has cold start delays.
- **Exa Web Search**: HTTP MCP server at `https://mcp.exa.ai/mcp` for supplemental research.
