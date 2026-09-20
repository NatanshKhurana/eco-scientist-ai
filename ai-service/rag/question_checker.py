import json
import re


OUT_OF_SCOPE_MESSAGE = (
    "Hi! I'm EcoScientist AI, an environmental assistance chatbot. I can help "
    "with environmental problems such as soil health, biodiversity loss, "
    "climate change, rainfall, land use, pollution, conservation, and "
    "sustainable farming. Please ask me a question related to the environment."
)


# Keep scope checking local and deterministic so greetings and unrelated requests
# do not consume an LLM call or enter the scientific assessment workflow.
ENVIRONMENTAL_TERMS = {
    "acid rain",
    "agriculture",
    "agroforestry",
    "air pollution",
    "air quality",
    "aquifer",
    "biodiversity",
    "carbon",
    "carbon footprint",
    "carbon sequestration",
    "climate",
    "climate change",
    "compost",
    "conservation",
    "contamination",
    "crop",
    "deforestation",
    "desertification",
    "drought",
    "ecology",
    "ecosystem",
    "emission",
    "emissions",
    "environment",
    "environmental",
    "erosion",
    "farm",
    "farming",
    "fertilizer",
    "flood",
    "forest",
    "fossil fuel",
    "global warming",
    "grassland",
    "greenhouse gas",
    "groundwater",
    "habitat",
    "heatwave",
    "land degradation",
    "land restoration",
    "land use",
    "landfill",
    "microplastic",
    "natural resource",
    "organic carbon",
    "pesticide",
    "plant",
    "plastic pollution",
    "pollution",
    "precipitation",
    "rain",
    "rainfall",
    "recycling",
    "renewable energy",
    "restoration",
    "river",
    "sea level",
    "soc",
    "soil",
    "solar energy",
    "species",
    "sustainability",
    "sustainable",
    "vegetation",
    "waste",
    "wastewater",
    "water conservation",
    "water pollution",
    "water quality",
    "watershed",
    "wetland",
    "wildlife",
    "wind energy",
}


def _term_pattern(term):
    return r"(?<!\w)" + re.escape(term).replace(r"\ ", r"\s+") + r"(?!\w)"


ENVIRONMENTAL_PATTERN = re.compile(
    "|".join(
        _term_pattern(term)
        for term in sorted(ENVIRONMENTAL_TERMS, key=len, reverse=True)
    ),
    re.IGNORECASE,
)


def is_environmental_question(question, conversation_context=None):
    """Return whether a message belongs in the environmental workflow."""
    if not isinstance(question, str) or not question.strip():
        return False

    if ENVIRONMENTAL_PATTERN.search(question):
        return True

    # A short value such as "Punjab" or "450 mm" is valid when it directly
    # answers the land-detail questions in an active environmental conversation.
    previous_user_text = _get_previous_user_text(conversation_context)
    previous_assistant_text = _get_previous_assistant_text(conversation_context)

    if not ENVIRONMENTAL_PATTERN.search(previous_user_text):
        return False

    if not _is_clarification_request(previous_assistant_text):
        return False

    normalized_question = question.strip().lower()
    known_detail = any(
        re.search(_term_pattern(keyword), normalized_question, re.IGNORECASE)
        for keywords in REQUIRED_FIELDS.values()
        for keyword in keywords
    )
    measured_detail = bool(
        re.search(r"\b\d+(?:\.\d+)?\s*(?:%|mm|cm|inches?|annual)\b", question, re.I)
    )
    short_named_value = bool(
        re.fullmatch(r"[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2}", question.strip())
    )
    starts_like_unrelated_request = bool(
        re.match(
            r"(?:tell|write|play|show|give|make|create|calculate|translate|"
            r"who|what|when|where|why|how|can|could|would|do|does|is|are)\b",
            normalized_question,
        )
    )

    return known_detail or measured_detail or (
        short_named_value and not starts_like_unrelated_request
    )


REQUIRED_FIELDS = {
    "soil_carbon": ["soil carbon", "organic carbon", "soc", "% carbon"],
    "rainfall": ["rainfall", "rain", "precipitation", "mm"],
    "location": [
        "location",
        "place",
        "region",
        "state",
        "district",
        "country",
        "haryana",
        "punjab",
        "maharashtra",
    ],
    "crop": [
        "crop",
        "wheat",
        "rice",
        "maize",
        "cotton",
        "vegetation",
        "plant",
        "farming",
    ],
    "land_type": ["farm", "field", "land", "grassland", "forest", "soil"],
}


QUESTIONS = {
    "soil_carbon": "What is your soil organic carbon percentage (SOC)?",
    "rainfall": "What is your average rainfall pattern or annual rainfall?",
    "location": "What is your location or region?",
    "crop": "Which crop or vegetation is growing on your land?",
    "land_type": "What type of land is this (farm, grassland, forest, degraded land)?",
}


def _read_context(conversation_context):
    if not conversation_context:
        return {}

    if isinstance(conversation_context, dict):
        return conversation_context

    if isinstance(conversation_context, str):
        try:
            parsed = json.loads(conversation_context)
        except (TypeError, json.JSONDecodeError):
            return {}

        return parsed if isinstance(parsed, dict) else {}

    return {}


def _get_previous_user_text(conversation_context):
    context = _read_context(conversation_context)
    messages = context.get("recentMessages", [])

    if not isinstance(messages, list):
        return ""

    return " ".join(
        str(message.get("content", ""))
        for message in messages
        if isinstance(message, dict) and message.get("role") == "user"
    )


def _get_previous_assistant_text(conversation_context):
    context = _read_context(conversation_context)
    messages = context.get("recentMessages", [])

    if not isinstance(messages, list):
        return ""

    return " ".join(
        str(message.get("content", ""))
        for message in messages
        if isinstance(message, dict) and message.get("role") == "assistant"
    )


def _is_clarification_request(text):
    normalized = text.lower()
    return (
        "more information needed" in normalized
        or "provide more details about your land" in normalized
    )


def check_question_completeness(question, conversation_context=None):
    previous_user_text = _get_previous_user_text(conversation_context)
    text = f"{previous_user_text} {question or ''}".lower()

    missing = [
        field
        for field, keywords in REQUIRED_FIELDS.items()
        if not any(
            re.search(_term_pattern(keyword), text, re.IGNORECASE)
            for keyword in keywords
        )
    ]

    return {
        "complete": not missing,
        "missing": missing,
        "questions": [QUESTIONS[field] for field in missing],
    }
