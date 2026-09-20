from fastapi import FastAPI

from dotenv import load_dotenv

load_dotenv()

from routes.chat import router as chat_router

from routes.title import router as title_router

from rag.retriever import initialize_retriever

from llm.azure_client import initialize_llm



app = FastAPI(
    title="Eco Scientist AI Service"
)



ai_ready = False






@app.on_event("startup")
async def startup_event():


    global ai_ready


    print("\n==============================")

    print("🔥 Starting Eco Scientist AI")

    print("==============================\n")



    try:


        print("Loading Vector Database...")


        initialize_retriever()


        print("Vector Database Ready ✅\n")




        print("Creating Azure GPT Client...")


        initialize_llm()


        print("Azure GPT Client Ready ✅\n")



        ai_ready = True



        print("==============================")

        print("🚀 AI Service Ready")

        print("==============================\n")



    except Exception as e:


        print(
            "❌ AI Startup Failed:",
            str(e)
        )


        ai_ready = False







@app.get("/")
def home():

    return {

        "message":
        "Eco Scientist AI Service Running 🚀"

    }







@app.get("/health")
def health():

    return {

        "status":
        "ready" if ai_ready else "starting",

        "ai_service":
        ai_ready

    }







app.include_router(
    chat_router,
    prefix="/api"
)



app.include_router(
    title_router,
    prefix="/api"
)
