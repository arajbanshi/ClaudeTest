import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from claudetest.agent_runner import SessionInfo, TextChunk, run_prompt, stream_prompt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    prompt: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    result = await run_prompt(request.prompt, resume=request.session_id)
    return ChatResponse(reply=result.reply, session_id=result.session_id)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    async def event_source():
        session_id = request.session_id
        async for item in stream_prompt(request.prompt, resume=request.session_id):
            if isinstance(item, TextChunk):
                yield f"data: {item.text}\n\n"
            elif isinstance(item, SessionInfo):
                session_id = item.session_id
        yield f"event: done\ndata: {json.dumps({'session_id': session_id})}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream")
