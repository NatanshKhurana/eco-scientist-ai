from rag.rag_chain import generate_answer
from rag.question_checker import (
    OUT_OF_SCOPE_MESSAGE,
    check_question_completeness,
    is_environmental_question,
)


async def generate_response(data):

    message = data.get("message", "")

    conversation_context = data.get("conversation_context", "")

    if not message.strip():

        return {"type": "error", "message": "Please provide a question."}

    if not is_environmental_question(message, conversation_context):

        return {"type": "out_of_scope", "message": OUT_OF_SCOPE_MESSAGE}

    check_result = check_question_completeness(message, conversation_context)

    print("QUESTION CHECK:", check_result)

    if not check_result["complete"]:

        return {
            "type": "clarification_required",
            "message": "Before giving scientific recommendations, please provide more details about your land.",
            "missing_information": check_result["missing"],
            "questions": check_result["questions"],
        }

    answer = generate_answer(
        question=message, conversation_context=conversation_context
    )

    return {"type": "answer", "response": answer}
