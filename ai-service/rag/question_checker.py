REQUIRED_FIELDS = {


    "soil_carbon":

    [

        "soil carbon",
        "organic carbon",
        "soc",
        "% carbon"

    ],



    "rainfall":

    [

        "rainfall",
        "rain",
        "precipitation",
        "mm"

    ],



    "location":

    [

        "location",
        "place",
        "region",
        "state",
        "district",
        "country",
        "haryana",
        "punjab",
        "maharashtra"

    ],



    "crop":

    [

        "crop",
        "wheat",
        "rice",
        "maize",
        "cotton",
        "vegetation",
        "plant",
        "farming"

    ],



    "land_type":

    [

        "farm",
        "field",
        "land",
        "grassland",
        "forest",
        "soil"

    ]

}




QUESTIONS = {


    "soil_carbon":

    "What is your soil organic carbon percentage (SOC)?",


    "rainfall":

    "What is your average rainfall pattern or annual rainfall?",


    "location":

    "What is your location or region?",


    "crop":

    "Which crop or vegetation is growing on your land?",


    "land_type":

    "What type of land is this (farm, grassland, forest, degraded land)?"

}





def check_question_completeness(question):


    text = question.lower()



    missing = []



    for field, keywords in REQUIRED_FIELDS.items():


        found = False


        for keyword in keywords:


            if keyword in text:

                found = True

                break



        if not found:

            missing.append(field)




    if not missing:


        return {

            "complete": True,

            "missing": [],

            "questions": []

        }



    return {


        "complete": False,


        "missing": missing,


        "questions":

        [

            QUESTIONS[item]

            for item in missing

        ]

    }