from langchain_openai import AzureChatOpenAI

from dotenv import load_dotenv

import os

load_dotenv()


_llm = None


def initialize_llm():

    global _llm

    if _llm is not None:

        return _llm

    print("Creating Azure GPT client...")

    _llm = AzureChatOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        temperature=0.1,
        max_tokens=2000,
        timeout=45,
        max_retries=1,
        streaming=True,
    )

    print("Azure GPT Client initialized")

    return _llm


def get_llm():

    global _llm

    if _llm is None:

        return initialize_llm()

    return _llm
