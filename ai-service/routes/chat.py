from fastapi import APIRouter, HTTPException

from fastapi.responses import StreamingResponse

from rag.rag_chain import stream_answer

from controllers.ai_controller import generate_response

from rag.question_checker import (
    OUT_OF_SCOPE_MESSAGE,
    check_question_completeness,
    is_environmental_question,
)

import json



router = APIRouter()





# =====================================
# NORMAL CHAT API
# =====================================

@router.post("/chat")
async def chat(data: dict):

    try:

        response = await generate_response(data)

        return {

            "success": True,

            "response": response

        }


    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=str(error)

        )







# =====================================
# SSE EVENT CREATOR
# =====================================

def create_event(event_type, data=None):

    payload = {

        "type": event_type

    }


    if data:

        payload.update(data)



    return (

        "data: "

        +

        json.dumps(

            payload,

            ensure_ascii=False

        )

        +

        "\n\n"

    )







# =====================================
# CLARIFICATION STREAM
# =====================================

def clarification_stream(check_result):


    text = """

## More Information Needed


Before preparing the scientific environmental assessment, please provide:


"""


    questions = check_result["questions"]



    for index, question in enumerate(questions, start=1):

        text += f"{index}. {question}\n"



    text += """



After receiving these details, I will generate the complete analysis.

"""



    yield create_event(

        "content",

        {

            "text": text

        }

    )



    yield create_event(

        "complete",

        {

            "clarification": True

        }

    )









def out_of_scope_stream():

    yield create_event(

        "content",

        {

            "text": OUT_OF_SCOPE_MESSAGE

        }

    )


    yield create_event(

        "complete",

        {

            "out_of_scope": True

        }

    )


# =====================================
# STREAM CHAT API
# =====================================

@router.post("/chat/stream")

async def chat_stream(data: dict):


    message = data.get(

        "message",

        ""

    )



    conversation_context = data.get(

        "conversation_context",

        ""

    )





    if not message.strip():

        raise HTTPException(

            status_code=400,

            detail="Message required"

        )





    print(

        "STREAM MESSAGE:",

        message

    )







    if not is_environmental_question(message, conversation_context):

        return StreamingResponse(

            out_of_scope_stream(),

            media_type="text/event-stream",

            headers={

                "Cache-Control": "no-cache",

                "Connection": "keep-alive",

                "X-Accel-Buffering": "no"

            }

        )


    # =====================================
    # CHECK QUESTION COMPLETENESS
    # =====================================


    check_result = check_question_completeness(

        message,

        conversation_context

    )



    print(

        "QUESTION CHECK:",

        check_result

    )







    if not check_result["complete"]:


        return StreamingResponse(

            clarification_stream(

                check_result

            ),

            media_type="text/event-stream",

            headers={

                "Cache-Control":

                "no-cache",


                "Connection":

                "keep-alive",


                "X-Accel-Buffering":

                "no"

            }

        )









    # =====================================
    # NORMAL AI STREAM
    # =====================================


    return StreamingResponse(

        stream_answer(

            question=message,

            conversation_context=

            conversation_context

        ),


        media_type="text/event-stream",


        headers={

            "Cache-Control":

            "no-cache",


            "Connection":

            "keep-alive",


            "X-Accel-Buffering":

            "no"

        }

    )
