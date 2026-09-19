import { useRef, useState } from "react";

import {
  getSessionId,
  getConversationId,
  setConversationId,
} from "../utils/storage";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";





export default function useChatStream(){



  const [messages,setMessages] = useState([]);

  const [isStreaming,setIsStreaming] = useState(false);

  const [error,setError] = useState(null);



  const abortController = useRef(null);



  const assistantMessageId = useRef(null);







  const updateAssistantMessage = (callback)=>{


    setMessages(previous=>{


      const updated = [...previous];



      const index =
        updated.findIndex(
          item =>
          item.id === assistantMessageId.current
        );



      if(index !== -1){


        updated[index] = {

          ...updated[index],

          ...callback(updated[index])

        };


      }



      return updated;


    });


  };









  const sendMessage = async(message)=>{


    if(!message || !message.trim())
      return;





    setError(null);




    const id =
      crypto.randomUUID();



    assistantMessageId.current = id;





    setMessages(previous=>[

      ...previous,


      {

        role:"user",

        content:message.trim()

      },


      {

        id,

        role:"assistant",

        content:"",

        streaming:true

      }


    ]);





    setIsStreaming(true);



    abortController.current =
      new AbortController();





    try{


      const response = await fetch(

        `${API_URL}/api/chat/stream`,

        {

          method:"POST",

          credentials:"include",

          headers:{

            "Content-Type":
            "application/json"

          },


          body:JSON.stringify({

            message:message.trim(),

            conversationId:
            getConversationId() || undefined,


            sessionId:
            getSessionId()

          }),


          signal:
          abortController.current.signal


        }

      );





      if(!response.ok){


        throw new Error(
          "Stream request failed"
        );


      }







      const reader =
        response.body.getReader();



      const decoder =
        new TextDecoder();



      let buffer = "";








      while(true){



        const {
          done,
          value
        } =
        await reader.read();




        if(done)
          break;





        buffer += decoder.decode(
          value,
          {
            stream:true
          }
        );




        const events =
          buffer.split("\n\n");



        buffer =
          events.pop();





        for(const event of events){


          if(!event.trim())
            continue;




          const line =
            event
            .split("\n")
            .find(
              item =>
              item.startsWith("data:")
            );




          if(!line)
            continue;





          let data;



          try{


            data =
            JSON.parse(

              line
              .replace(
                "data:",
                ""
              )
              .trim()

            );


          }
          catch{

            continue;

          }







          if(data.type==="meta"){


            if(data.conversationId){


              setConversationId(
                data.conversationId
              );


              window.dispatchEvent(

                new CustomEvent(
                  "conversationCreated",

                  {

                    detail:{

                      conversationId:
                      data.conversationId

                    }

                  }

                )

              );


            }


          }








          if(data.type==="content"){


            updateAssistantMessage(
              current=>({

                content:
                current.content +
                (data.text || "")

              })
            );


          }








          if(data.type==="complete"){


            updateAssistantMessage(()=>({


              streaming:false


            }));


          }







        }


      }





    }


    catch(err){



      if(err.name==="AbortError")
        return;



      console.error(
        "Stream error:",
        err
      );



      setError(err.message);



      updateAssistantMessage(()=>({


        content:
        "Something went wrong. Please try again.",


        streaming:false


      }));


    }


    finally{


      setIsStreaming(false);


      abortController.current=null;


    }



  };









  const stopStreaming = ()=>{


    if(abortController.current){


      abortController.current.abort();


    }


    setIsStreaming(false);


  };









  return {


    messages,

    setMessages,

    sendMessage,

    stopStreaming,

    isStreaming,

    error


  };


}