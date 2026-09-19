from fastapi import APIRouter

from llm.azure_client import get_llm


router = APIRouter()



# =====================================
# AI TITLE GENERATION API
# Lightweight endpoint
# No RAG / No PDF retrieval
# =====================================

@router.post("/title")
async def generate_title(data: dict):


    message = data.get(
        "message",
        ""
    )



    if not message.strip():

        return {

            "title":
            "New Conversation"

        }





    prompt = f"""

Create a short and meaningful chat title.

Rules:

- Maximum 5 words only
- Title style words
- No quotes
- No punctuation
- No explanation
- Do not repeat the full question


User message:

{message}


Title:

"""





    llm = get_llm()



    response = llm.invoke(prompt)



    title = response.content.strip()



    title = (

        title

        .replace("#","")

        .replace("*","")

        .replace('"',"")
        
        .replace("'","")

        .strip()

    )




    words = title.split()



    title = " ".join(
        words[:5]
    )



    return {

        "title": title

    }