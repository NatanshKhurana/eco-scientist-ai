import { createContext, useContext, useEffect, useState } from "react";

import useChatStream from "../hooks/useChatStream";

import useConversation from "../hooks/useConversation";

import { clearConversationId } from "../utils/storage";

import { useAuthContext } from "./AuthContext";


const ChatContext = createContext(null);



export const ChatProvider = ({ children }) => {


  const {

    messages,

    setMessages,

    sendMessage,

    stopStreaming,

    isStreaming,

    error,

  } = useChatStream();





  const {

    conversations,

    currentConversation,

    loadConversations,

    openConversation,

    restoreConversation,

    createNewChat,

    renameConversation,

    deleteConversation,

  } = useConversation();





  const { user } = useAuthContext();



  const [activeConversationId, setActiveConversationId] =
    useState(null);








  // ==========================
  // Initial Load
  // ==========================

  useEffect(() => {


    const initialize = async()=>{


      await loadConversations();



      const conversation =
        await restoreConversation();




      if(conversation){


        setActiveConversationId(
          conversation._id
        );


        setMessages(
          conversation.messages || []
        );


      }


    };



    initialize();



  }, []);








  // ==========================
  // User Change
  // ==========================

  useEffect(()=>{


    clearConversationId();


    setActiveConversationId(null);


    setMessages([]);


    loadConversations();



  },[user]);









  // ==========================
  // Guest Merge Refresh
  // ==========================

  useEffect(()=>{


    const refresh = ()=>{


      clearConversationId();


      setActiveConversationId(null);


      setMessages([]);


      loadConversations();


    };



    window.addEventListener(
      "conversationRefresh",
      refresh
    );



    return()=>{


      window.removeEventListener(
        "conversationRefresh",
        refresh
      );


    };


  },[]);









  // ==========================
  // Conversation Created
  // FIX 1
  // ==========================

  useEffect(()=>{


    const handler = async(event)=>{


      const id =
        event.detail?.conversationId;



      if(!id)
        return;




      setActiveConversationId(id);




      // ONLY refresh sidebar
      // Do not overwrite streaming messages

      await loadConversations();



    };



    window.addEventListener(
      "conversationCreated",
      handler
    );



    return()=>{


      window.removeEventListener(
        "conversationCreated",
        handler
      );


    };



  },[]);








  const selectConversation = async(id)=>{


    if(isStreaming)
      return;




    const conversation =
      await openConversation(id);




    if(conversation){


      setActiveConversationId(
        conversation._id
      );


      setMessages(
        conversation.messages || []
      );


    }


  };









  const startNewChat = ()=>{


    if(isStreaming){

      stopStreaming();

    }



    clearConversationId();


    createNewChat();


    setActiveConversationId(null);


    setMessages([]);



  };









  const renameChat = async(id,title)=>{


    return await renameConversation(
      id,
      title
    );


  };









  const deleteChat = async(id)=>{


    const success =
      await deleteConversation(id);




    if(
      success &&
      activeConversationId === id
    ){


      clearConversationId();


      setActiveConversationId(null);


      setMessages([]);


    }




    await loadConversations();



    return success;


  };








  return (

    <ChatContext.Provider

      value={{

        messages,

        setMessages,


        sendMessage,


        stopStreaming,


        isStreaming,


        error,


        conversations,


        currentConversation,


        activeConversationId,


        selectConversation,


        startNewChat,


        renameChat,


        deleteChat,


        loadConversations,


      }}

    >


      {children}


    </ChatContext.Provider>

  );

};







export const useChat = ()=>{


  const context =
    useContext(ChatContext);



  if(!context){


    throw new Error(
      "useChat must be used inside ChatProvider"
    );


  }



  return context;


};