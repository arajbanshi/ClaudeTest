from pathlib import Path
from collections.abc import AsyncGenerator, AsyncIterator
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, StreamEvent, TextBlock, query

WORKSPACE = Path(__file__).resolve().parent.parent.parent / "workspace"


async def stream_prompt(prompt: str) -> AsyncIterator[str]:
    options = ClaudeAgentOptions(
            cwd=str(WORKSPACE),
            allowed_tools=["Read", "Glob", "Grep"],
            permission_mode="acceptEdits",
            include_partial_messages=True
        )

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, StreamEvent):
            event = message.event
            if event.get("type") == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "text_delta":
                    yield delta.get("text", "")
    
async def run_prompt(prompt: str) -> str:
    options = ClaudeAgentOptions(
        cwd=str(WORKSPACE),
        allowed_tools=["Read", "Glob", "Grep"],
        permission_mode="acceptEdits"
    )

    reply_parts: list[str] = []
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)

    return "\n".join(reply_parts)    
            