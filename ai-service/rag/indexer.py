import os

from loader import load_documents
from embeddings import split_documents
from vectorstore import create_vector_store



BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


KNOWLEDGE_PATH = os.path.join(
    BASE_DIR,
    "knowledge"
)



print("Knowledge path:")
print(KNOWLEDGE_PATH)



print("Loading documents...")


documents = load_documents(
    KNOWLEDGE_PATH
)


print(
    "Documents loaded:",
    len(documents)
)



print("Creating chunks...")


chunks = split_documents(
    documents
)


print(
    "Chunks created:",
    len(chunks)
)



print(
    "Creating vector database..."
)


create_vector_store(
    chunks
)



print(
    "Vector database created successfully 🚀"
)