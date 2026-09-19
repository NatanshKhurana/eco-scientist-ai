from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from rag.rag_chain import generate_answer, stream_answer

from controllers.ai_controller import generate_response

router = APIRouter()


# =====================================
# Normal Chat API
# =====================================


@router.post("/chat")
async def chat(data: dict):

    try:

        response = await generate_response(data)

        return {"success": True, "response": response}

    except Exception as error:

        raise HTTPException(status_code=500, detail=str(error))


# =====================================
# Streaming Chat API
# =====================================


@router.post("/chat/stream")
async def chat_stream(data: dict):

    message = data.get("message", "")

    conversation_context = data.get("conversation_context", "")

    if not message.strip():

        raise HTTPException(status_code=400, detail="Message required")

    return StreamingResponse(
        stream_answer(question=message, conversation_context=conversation_context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
