from rag.rag_chain import generate_answer
from rag.question_checker import check_question_completeness


async def generate_response(data):

    message = data.get("message", "")

    conversation_context = data.get("conversation_context", "")

    if not message.strip():

        return {"type": "error", "message": "Please provide a question."}

    check_result = check_question_completeness(message)

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
