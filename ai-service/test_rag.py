from rag.rag_chain import generate_answer



question = """
My farm has low rainfall,
low soil carbon and biodiversity is decreasing.
What should I do?
"""



answer = generate_answer(
    question=question,
    conversation_context=""
)



print("\n====================")
print("AI RESPONSE")
print("====================\n")

print(answer)