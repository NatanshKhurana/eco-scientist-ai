from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import os

_embeddings = None


# =====================================
# Embedding Model
# =====================================


def get_embeddings():

    global _embeddings

    if _embeddings is None:

        print("Loading embedding model...")

        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        print("Embedding model loaded")

    return _embeddings


# =====================================
# Vector DB Location
# =====================================


def get_vector_db_path():

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    return os.path.join(base_dir, "vector_db")


# =====================================
# Create Vector Store (Batch Indexing)
# =====================================


def create_vector_store(documents):

    if not documents:
        raise ValueError("No documents found for indexing")

    embeddings = get_embeddings()

    path = get_vector_db_path()

    print("Creating vector database:", path)

    vector_store = Chroma(persist_directory=path, embedding_function=embeddings)

    batch_size = 100

    total = len(documents)

    for i in range(0, total, batch_size):

        batch = documents[i : i + batch_size]

        print(f"Adding batch {i}/{total}")

        vector_store.add_documents(batch)

    print("Vector database completed successfully")

    return vector_store
