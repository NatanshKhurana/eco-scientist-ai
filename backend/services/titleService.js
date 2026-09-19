const axios = require("axios");





// ==========================================
// Generate AI Conversation Title
// ==========================================

const generateAITitle = async (message) => {


  try {


    if (!message || !message.trim()) {

      return "New Conversation";

    }






    const response = await axios.post(


      `${process.env.AI_SERVICE_URL}/api/title`,


      {

        message

      },


      {

        timeout:15000

      }


    );







    let title = "";




    if(response.data){


      title =
        response.data.title || "";


    }






    title = cleanTitle(title);







    if(!title){


      return createFallbackTitle(message);


    }







    return title

      .split(" ")

      .slice(0,5)

      .join(" ");





  }


  catch(error){



    console.error(

      "AI Title Generation Error:",

      error.message

    );



    return createFallbackTitle(message);



  }


};









// ==========================================
// Clean AI Response
// ==========================================

const cleanTitle = (title)=>{


  if(
    typeof title !== "string"
  ){

    return "";

  }




  return title

    .replace(/[#\\*`"'_]/g,"")

    .replace(

      /^(title|chat title|conversation title|here is the title)\s*:?\s*/i,

      ""

    )

    .replace(/[.!?,:]/g,"")

    .trim();



};









// ==========================================
// Fallback Title
// ==========================================

const createFallbackTitle = (message)=>{


  if(!message){

    return "New Conversation";

  }





  const words = message

    .trim()

    .replace(/\s+/g," ")

    .split(" ");





  if(words.length <= 4){

    return message.trim();

  }





  return (

    words

      .slice(0,4)

      .join(" ")

      +

      " Guide"

  );


};







module.exports = {

  generateAITitle

};