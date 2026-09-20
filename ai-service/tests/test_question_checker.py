import json
import unittest

from rag.question_checker import (
    check_question_completeness,
    is_environmental_question,
)


class QuestionCheckerTests(unittest.TestCase):
    def test_rejects_greetings_and_casual_conversation(self):
        for message in ("Hii, how are you?", "Hello", "What is your name?"):
            with self.subTest(message=message):
                self.assertFalse(is_environmental_question(message))

    def test_rejects_unrelated_questions_and_random_input(self):
        for message in (
            "Write a Python program for me.",
            "Who won the football match?",
            "What is the capital of France?",
            "asdf qwerty 12345",
        ):
            with self.subTest(message=message):
                self.assertFalse(is_environmental_question(message))

    def test_accepts_environmental_questions(self):
        for message in (
            "How can I reduce soil erosion on my farm?",
            "Why is biodiversity declining?",
            "How should my city reduce plastic pollution?",
            "Hello, low rainfall is damaging my wheat crop.",
        ):
            with self.subTest(message=message):
                self.assertTrue(is_environmental_question(message))

    def test_matches_whole_terms_instead_of_substrings(self):
        self.assertFalse(is_environmental_question("When does the train arrive?"))

    def test_accepts_short_answers_to_environmental_clarification(self):
        context = {
            "recentMessages": [
                {
                    "role": "user",
                    "content": "Soil erosion is affecting my farm.",
                },
                {
                    "role": "assistant",
                    "content": "## More Information Needed\nWhat is your location?",
                },
            ]
        }

        self.assertTrue(is_environmental_question("Punjab", context))
        self.assertTrue(is_environmental_question("450 mm", context))

    def test_rejects_unrelated_request_during_environmental_conversation(self):
        context = {
            "recentMessages": [
                {
                    "role": "user",
                    "content": "Soil erosion is affecting my farm.",
                },
                {
                    "role": "assistant",
                    "content": "## More Information Needed\nWhat is your location?",
                },
            ]
        }

        self.assertFalse(is_environmental_question("Tell me a joke", context))

    def test_reports_only_missing_fields(self):
        result = check_question_completeness(
            "My farm in Punjab grows wheat and receives low rainfall."
        )

        self.assertFalse(result["complete"])
        self.assertEqual(result["missing"], ["soil_carbon"])

    def test_combines_current_answer_with_previous_user_messages(self):
        context = json.dumps(
            {
                "recentMessages": [
                    {
                        "role": "user",
                        "content": "My farm in Punjab grows wheat.",
                    },
                    {
                        "role": "assistant",
                        "content": "Please provide rainfall and soil carbon.",
                    },
                ]
            }
        )

        result = check_question_completeness(
            "Annual rainfall is 450 mm and SOC is 0.6%.", context
        )

        self.assertTrue(result["complete"])
        self.assertEqual(result["missing"], [])

    def test_does_not_count_assistant_questions_as_user_information(self):
        context = {
            "recentMessages": [
                {
                    "role": "assistant",
                    "content": (
                        "What is the location, rainfall, soil carbon, crop, "
                        "and land type?"
                    ),
                }
            ]
        }

        result = check_question_completeness("I need help.", context)

        self.assertFalse(result["complete"])
        self.assertEqual(len(result["missing"]), 5)


if __name__ == "__main__":
    unittest.main()
