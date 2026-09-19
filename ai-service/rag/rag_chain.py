from llm.azure_client import get_llm
from utils.prompts import SYSTEM_PROMPT
from rag.retriever import retrieve_documents

import json
import time

# =====================================
# Build Scientific Context
# =====================================


def build_knowledge_context(question):

    documents = retrieve_documents(question, k=6)

    if not documents:
        return "No relevant scientific documents found."

    context_parts = []

    for index, doc in enumerate(documents, start=1):

        source_path = doc.get("source", "unknown")

        source_name = source_path.replace("\\", "/").split("/")[-1]

        context_parts.append(f"""

==============================
DOCUMENT {index}
==============================

SOURCE FILE:
{source_name}


SCIENTIFIC INFORMATION:

{doc.get("content","")}


""")

    return "\n\n".join(context_parts)


# =====================================
# Build Prompt
# =====================================


def build_prompt(question, conversation_context=""):

    knowledge_context = build_knowledge_context(question)

    prompt = f"""

{SYSTEM_PROMPT}


Previous Conversation:

{conversation_context}



================================
RETRIEVED SCIENTIFIC KNOWLEDGE
================================


{knowledge_context}



================================
STRICT SOURCE RULES
================================


You MUST follow these:

1. Use ONLY retrieved documents above.

2. Every Evidence source must be from SOURCE FILE names above.

3. Never create fake papers or sources.

4. If numerical values are not available in documents:
write:

"Quantitative estimate not available in retrieved evidence."


5. Complete every section before ending.



================================
FINAL REPORT STRUCTURE
================================


## Environmental Assessment


Include:

- Environmental problem
- Root causes
- Soil Health connection
- Biodiversity connection
- Climate connection
- Land Use connection
- Human Impact
- Current consequences



## Recommendations


Give 3-5 recommendations.


For EACH recommendation:


### Recommendation Name


Action:

What should be implemented.


Scientific Mechanism:

Why this works scientifically.


Metrics Improved:

- Soil organic carbon
- Soil moisture
- Biodiversity
- Climate impact
- Land restoration


Evidence:

Mention exact PDF filename.


Expected Impact:

Only mention measurable values if supported by retrieved documents.



## Scientific Reasoning


Explain:


Environmental practice

↓

Scientific mechanism

↓

Expected outcome



## Environmental Metrics Improved


Create table:


| Metric | Expected Improvement | Evidence Source |
|---|---|---|
| Soil organic carbon | | |
| Water retention | | |
| Biodiversity | | |
| Soil moisture | | |
| Carbon storage | | |


Do not invent values.



## Expected Timeline


Short Term:
0-2 years


Medium Term:
2-5 years


Long Term:
5+ years



## Confidence


Level:

High / Medium / Low


Reason:

Explain based on retrieved evidence.



## Evidence


MANDATORY.


Format:


- Source: filename.pdf

  Relevant information:
  Explain what information was used.



Before finishing verify:

✓ All sections completed

✓ Evidence included

✓ Metrics table included

✓ No unsupported numbers

✓ No unfinished sentences


User Question:

{question}



Final Answer:

"""

    return prompt


# =====================================
# Normal Answer
# =====================================


def generate_answer(question, conversation_context=""):

    prompt = build_prompt(question, conversation_context)

    llm = get_llm()

    response = llm.invoke(prompt)

    return response.content


# =====================================
# SSE Event
# =====================================


def create_event(event_type, text=None):

    data = {"type": event_type}

    if text is not None:

        data["text"] = text

    return "data: " + json.dumps(data, ensure_ascii=False) + "\n\n"


# =====================================
# Streaming Answer
# =====================================


def stream_answer(question, conversation_context=""):

    try:

        start_time = time.time()

        prompt = build_prompt(question, conversation_context)

        llm = get_llm()

        for chunk in llm.stream(prompt):

            if not chunk.content:
                continue

            yield create_event("content", chunk.content)

        total_time = round(time.time() - start_time, 2)

        yield create_event("complete", json.dumps({"time_seconds": total_time}))

    except Exception as error:

        yield create_event("error", str(error))
