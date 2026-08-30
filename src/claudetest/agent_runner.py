from pathlib import Path
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

WORKSPACE = Path(__file__).resolve().parent.parent.parent / "workspace"


async def run_prompt(prompt: str) -> str:
    options = ClaudeAgentOptions(
        cwd=str(WORKSPACE),
        allowed_tools=["Read", "Glob", "Grep"],
        permission_mode="acceptEdits"
    )

    reply_parts: list[str]=[]
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)

    return "\n".join(reply_parts)