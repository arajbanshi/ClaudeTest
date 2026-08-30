from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from claudetest.agent_runner import run_prompt, stream_prompt

app = FastAPI()


class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    reply = await run_prompt(request.prompt)
    return ChatResponse(reply=reply)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    async def event_source():
        async for chunk in stream_prompt(request.prompt):
            yield f"data: {chunk}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream")