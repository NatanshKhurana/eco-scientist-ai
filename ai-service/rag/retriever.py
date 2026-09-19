from langchain_chroma import Chroma

from rag.vectorstore import get_embeddings, get_vector_db_path

vector_store = None


# =====================================
# Initialize Retriever
# =====================================


def initialize_retriever():

    global vector_store

    if vector_store is not None:
        return vector_store

    print("Loading vector database...")

    embeddings = get_embeddings()

    vector_store = Chroma(
        persist_directory=get_vector_db_path(), embedding_function=embeddings
    )

    print("Vector database loaded successfully")

    return vector_store


# =====================================
# Retrieve Relevant Knowledge
# =====================================


def retrieve_documents(query, k=5, score_threshold=1.2):

    global vector_store

    if vector_store is None:

        initialize_retriever()

    results = vector_store.similarity_search_with_score(query, k=k)

    documents = []

    for doc, score in results:

        score = float(score)

        # Remove weak matches

        if score > score_threshold:

            continue

        documents.append(
            {
                "source": doc.metadata.get("source", "unknown"),
                "content": doc.page_content,
                "score": round(score, 4),
                "metadata": doc.metadata,
            }
        )

    return documents
