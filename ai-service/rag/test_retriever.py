from rag.retriever import retrieve_documents



query = """

My farm has low rainfall,
low soil carbon and biodiversity is decreasing.
What should I do?

"""



results = retrieve_documents(
    query,
    k=5
)



print("\n\n===== RETRIEVED KNOWLEDGE =====\n")



for index, item in enumerate(results):


    print(
        f"\nRESULT {index+1}"
    )


    print(
        "Source:",
        item["source"]
    )


    print(
        "Score:",
        item["score"]
    )


    print(
        "Content:"
    )


    print(
        item["content"][:500]
    )


    print(
        "\n-------------------------"
    )