from langchain_chroma import Chroma
from core.embeddings_cache import get_embeddings

import os

_vector_store = None


def get_vector_store():

    global _vector_store

    if _vector_store is None:

        print("Loading vector database...")

        vector_db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vector_db"
        )

        _vector_store = Chroma(
            persist_directory=vector_db_path, embedding_function=get_embeddings()
        )

        print("Vector database loaded successfully")

    return _vector_store
