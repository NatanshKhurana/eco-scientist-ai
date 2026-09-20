import json
import unittest

from controllers.ai_controller import generate_response
from rag.question_checker import OUT_OF_SCOPE_MESSAGE
from routes.chat import chat_stream


class OutOfScopeResponseTests(unittest.IsolatedAsyncioTestCase):
    async def test_normal_response_introduces_chatbot(self):
        response = await generate_response({"message": "Hii, how are you?"})

        self.assertEqual(response["type"], "out_of_scope")
        self.assertEqual(response["message"], OUT_OF_SCOPE_MESSAGE)

    async def test_stream_response_introduces_chatbot(self):
        response = await chat_stream({"message": "Tell me a joke."})
        chunks = []

        async for chunk in response.body_iterator:
            chunks.append(chunk.decode() if isinstance(chunk, bytes) else chunk)

        events = [
            json.loads(line.removeprefix("data: "))
            for line in "".join(chunks).splitlines()
            if line.startswith("data: ")
        ]

        self.assertEqual(events[0], {"type": "content", "text": OUT_OF_SCOPE_MESSAGE})
        self.assertEqual(events[1], {"type": "complete", "out_of_scope": True})


if __name__ == "__main__":
    unittest.main()
