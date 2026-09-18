from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

import os

_embeddings = None


def get_embeddings():

    global _embeddings

    if _embeddings is None:

        print("Loading embedding model...")

        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        print("Embedding model loaded successfully")

    return _embeddings


def create_embeddings():

    return get_embeddings()


def get_vector_db_path():

    return os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vector_db"
    )


def create_vector_store(documents):

    if not documents:

        raise ValueError(
            "No documents found. Please add valid PDF, MD, or TXT files inside knowledge folder."
        )

    embeddings = get_embeddings()

    vector_store = Chroma.from_documents(
        documents, embeddings, persist_directory=get_vector_db_path()
    )

    return vector_store
