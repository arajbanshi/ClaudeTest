from dataclasses import dataclass
from pathlib import Path
from collections.abc import AsyncIterator
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    StreamEvent,
    TextBlock,
    query,
)

WORKSPACE = Path(__file__).resolve().parent.parent.parent / "workspace"


@dataclass
class TextChunk:
    text: str


@dataclass
class SessionInfo:
    session_id: str


@dataclass
class ChatResult:
    reply: str
    session_id: str


async def stream_prompt(
    prompt: str, resume: str | None = None
) -> AsyncIterator[TextChunk | SessionInfo]:
    options = ClaudeAgentOptions(
            cwd=str(WORKSPACE),
            allowed_tools=["Read", "Glob", "Grep"],
            permission_mode="acceptEdits",
            include_partial_messages=True,
            resume=resume,
        )

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, StreamEvent):
            event = message.event
            if event.get("type") == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "text_delta":
                    yield TextChunk(delta.get("text", ""))
        elif isinstance(message, ResultMessage):
            yield SessionInfo(message.session_id)

async def run_prompt(prompt: str, resume: str | None = None) -> ChatResult:
    options = ClaudeAgentOptions(
        cwd=str(WORKSPACE),
        allowed_tools=["Read", "Glob", "Grep"],
        permission_mode="acceptEdits",
        resume=resume,
    )

    reply_parts: list[str] = []
    session_id = ""
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    reply_parts.append(block.text)
        elif isinstance(message, ResultMessage):
            session_id = message.session_id

    return ChatResult(reply="\n".join(reply_parts), session_id=session_id)
