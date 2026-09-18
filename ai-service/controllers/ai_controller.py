from rag.rag_chain import generate_answer




async def generate_response(data):


    message = data.get(
        "message",
        ""
    )



    conversation_context = data.get(
        "conversation_context",
        ""
    )



    if not message:


        return (
            "Please provide a question."
        )





    answer = generate_answer(

        question=message,


        conversation_context=
        conversation_context

    )



    return answer