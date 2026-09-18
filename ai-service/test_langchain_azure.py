from llm.azure_client import get_llm


llm = get_llm()


response = llm.invoke(
    "Explain soil health in one sentence"
)


print(response.content)