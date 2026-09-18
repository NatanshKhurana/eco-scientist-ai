from llm.azure_client import get_llm

from utils.prompts import SYSTEM_PROMPT

from rag.retriever import retrieve_documents

import json
import time
import re

# =========================================
# Build Prompt
# =========================================


def build_prompt(question, conversation_context=""):

    documents = retrieve_documents(question, k=3)

    knowledge_context = "\n\n".join([f"""
Source:
{doc['source']}

Content:
{doc['content']}
""" for doc in documents])

    prompt = f"""

{SYSTEM_PROMPT}


Previous Conversation:

{conversation_context}



Scientific Knowledge:

{knowledge_context}



User Question:

{question}



Instructions:

- Give scientific environmental analysis.
- Use clear markdown formatting.
- Keep sections structured.
- Give practical recommendations.
- Avoid unnecessary repetition.
- Keep answer concise.



Final Answer:

"""

    return prompt


# =========================================
# Normal Response
# =========================================


def generate_answer(question, conversation_context=""):

    prompt = build_prompt(question, conversation_context)

    llm = get_llm()

    response = llm.invoke(prompt)

    return response.content


# =========================================
# Markdown Buffer Logic
# =========================================


def should_flush(buffer):

    text = buffer.strip()

    if not text:

        return False

    # 1. New markdown heading completed

    if re.search(r"\n## .+\n", text):

        return True

    # 2. Horizontal section divider

    if text.endswith("---"):

        return True

    # 3. Complete paragraph

    if text.endswith("\n\n"):

        return True

    # 4. Numbered item completed

    if re.search(r"\n\d+\.\s.*\n", text) and len(text) > 150:

        return True

    # 5. Bullet group completed

    if text.endswith("\n") and text.count("- ") >= 3:

        return True

    # 6. Safety limit

    if len(text) >= 500:

        return True

    return False


# =========================================
# SSE Event Generator
# =========================================


def create_event(event_type, text=None):

    data = {"type": event_type}

    if text:

        data["text"] = text

    return f"data: {json.dumps(data)}\n\n"


# =========================================
# Production Smart Streaming
# =========================================


def stream_answer(question, conversation_context=""):

    try:

        start_time = time.time()

        prompt = build_prompt(question, conversation_context)

        llm = get_llm()

        buffer = ""

        for chunk in llm.stream(prompt):

            if not chunk.content:

                continue

            buffer += chunk.content

            if should_flush(buffer):

                yield create_event("content", buffer)

                buffer = ""

        # Remaining buffer

        if buffer.strip():

            yield create_event("content", buffer)

        # Completed

        total_time = round(time.time() - start_time, 2)

        complete_data = {
            "type": "complete",
            "message": "Stream completed",
            "time_seconds": total_time,
        }

        yield (f"data: {json.dumps(complete_data)}\n\n")

    except Exception as e:

        error_data = {"type": "error", "message": str(e)}

        yield (f"data: {json.dumps(error_data)}\n\n")
