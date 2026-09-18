from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import os


def load_documents(folder_path):
    documents = []

    for file in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file)

        if os.path.isdir(file_path):
            continue

        file_size = os.path.getsize(file_path)

        if file_size == 0:
            print(f"Skipping empty file: {file}")
            continue

        if file.endswith(".pdf"):
            print(f"Loading PDF: {file}")

            try:
                loader = PyPDFLoader(file_path)
                docs = loader.load()
                documents.extend(docs)
                print(f"Loaded {len(docs)} pages from {file}")
            except Exception as error:
                print(f"Failed loading PDF {file}: {error}")

        elif file.endswith(".md") or file.endswith(".txt"):
            print(f"Loading text file: {file}")

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()

                if not text.strip():
                    print(f"Skipping blank text file: {file}")
                    continue

                doc = Document(
                    page_content=text,
                    metadata={
                        "source": file,
                        "file_path": file_path,
                        "type": "text"
                    }
                )

                documents.append(doc)
                print(f"Loaded text file: {file}")

            except Exception as error:
                print(f"Failed loading text file {file}: {error}")

    return documents