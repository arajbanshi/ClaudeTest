from fastapi import FastAPI
from pydantic import BaseModel

from claudetest.agent_runner import run_prompt

app = FastAPI()


class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    reply = await run_prompt(request.prompt)
    return ChatResponse(reply=reply)