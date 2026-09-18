from langchain_chroma import Chroma

from rag.vectorstore import get_embeddings

VECTOR_DB_PATH = "./vector_db"


vector_store = None


def initialize_retriever():

    global vector_store

    if vector_store is not None:

        return vector_store

    print("Loading vector database...")

    embeddings = get_embeddings()

    vector_store = Chroma(
        persist_directory=VECTOR_DB_PATH, embedding_function=embeddings
    )

    print("Vector database loaded successfully")

    return vector_store


def retrieve_documents(query, k=3):

    global vector_store

    if vector_store is None:

        initialize_retriever()

    results = vector_store.similarity_search_with_score(query, k=k)

    documents = []

    for doc, score in results:

        documents.append(
            {
                "source": doc.metadata.get("source", "unknown"),
                "content": doc.page_content,
                "score": float(score),
            }
        )

    return documents
