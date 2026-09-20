import os

import uvicorn
from dotenv import load_dotenv


load_dotenv()


def is_enabled(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8001")),
        reload=is_enabled(os.getenv("AI_RELOAD", "false")),
    )
