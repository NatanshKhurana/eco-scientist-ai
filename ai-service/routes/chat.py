from fastapi import APIRouter


from fastapi.responses import StreamingResponse


from rag.rag_chain import generate_answer, stream_answer


from controllers.ai_controller import generate_response

router = APIRouter()


# =====================================
# Normal Chat API
# =====================================


@router.post("/chat")
async def chat(data: dict):

    response = await generate_response(data)

    return {"success": True, "response": response}


# =====================================
# Streaming Chat API
# =====================================


@router.post("/chat/stream")
async def chat_stream(data: dict):

    message = data.get("message", "")

    conversation_context = data.get("conversation_context", "")

    return StreamingResponse(
        stream_answer(message, conversation_context),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
