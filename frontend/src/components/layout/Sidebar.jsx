import { useEffect, useRef, useState } from "react";

import {
  Leaf,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useChat } from "../../hooks/useChatContext";

import { useAuthContext } from "../../hooks/useAuthContext";



export default function Sidebar() {


  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewChat,
    renameChat,
    deleteChat,
    isStreaming,

  } = useChat();



  const {
    user,
    logout,

  } = useAuthContext();





  const [menuConversationId,setMenuConversationId] =
    useState(null);


  const [editingConversationId,setEditingConversationId] =
    useState(null);


  const [editingTitle,setEditingTitle] =
    useState("");



  const menuRef = useRef(null);





  useEffect(()=>{


    const closeMenu=(event)=>{


      if(
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ){

        setMenuConversationId(null);

      }


    };



    document.addEventListener(
      "mousedown",
      closeMenu
    );



    return()=>{


      document.removeEventListener(
        "mousedown",
        closeMenu
      );


    };


  },[]);







  const startRename=(conversation)=>{


    setMenuConversationId(null);


    setEditingConversationId(
      conversation._id
    );


    setEditingTitle(
      conversation.title || ""
    );


  };







  const saveRename=async(id)=>{


    const title =
      editingTitle.trim();



    if(!title)
      return;




    const success =
      await renameChat(
        id,
        title
      );



    if(success){


      setEditingConversationId(null);


      setEditingTitle("");


    }


  };







  const handleDelete=async(conversation)=>{


    setMenuConversationId(null);



    const confirmDelete =
      window.confirm(
        `Delete "${conversation.title}"?`
      );



    if(!confirmDelete)
      return;



    await deleteChat(
      conversation._id
    );


  };







  const openChat=async(id)=>{


    setMenuConversationId(null);


    await selectConversation(id);


  };









  return (


<aside

className="
w-72
h-screen
shrink-0
overflow-hidden
border-r
border-gray-200
bg-white
flex
flex-col
"

>


{/* Brand */}

<div

className="
px-5
py-5
border-b
border-gray-100
flex
items-center
gap-3
"

>


<div

className="
w-10
h-10
rounded-xl
bg-green-100
flex
items-center
justify-center
"

>

<Leaf
size={22}
className="text-green-700"
/>

</div>


<div>

<h1 className="font-semibold text-gray-900">

Eco Scientist

</h1>


<p className="text-xs text-gray-500">

AI Research Assistant

</p>


</div>


</div>







{/* Auth */}

<div className="p-4 border-b">


{
user ? (


<div className="space-y-3">


<div>

<p className="font-medium text-gray-900">

{user.name}

</p>


<p className="text-xs text-gray-500">

{user.email}

</p>


</div>



<button

onClick={logout}

className="
w-full
flex
items-center
justify-center
gap-2
h-10
rounded-xl
border
text-red-600
hover:bg-red-50
"

>


<LogOut size={16}/>

Logout


</button>


</div>



):(


<div className="space-y-2">


<Link

to="/login"

className="
w-full
h-10
rounded-xl
bg-green-600
text-white
flex
items-center
justify-center
gap-2
"

>


<LogIn size={16}/>

Login


</Link>



<Link

to="/signup"

className="
w-full
h-10
rounded-xl
border
flex
items-center
justify-center
gap-2
text-gray-700
"

>


<UserPlus size={16}/>

Signup


</Link>


</div>


)

}


</div>









{/* New Chat */}

<div className="p-4">


<button

onClick={startNewChat}

className="
w-full
h-11
rounded-xl
bg-green-600
text-white
flex
items-center
justify-center
gap-2
"

>


<Plus size={18}/>

New Analysis


</button>


</div>









{/* History */}

<div

className="
flex-1
overflow-y-auto
px-3
"

>


<p className="text-xs text-gray-400 mb-2">

Recent

</p>





{
conversations.map((conversation)=>{


const active =
activeConversationId === conversation._id;


const editing =
editingConversationId === conversation._id;


const menu =
menuConversationId === conversation._id;



return (


<div

key={conversation._id}

ref={menu ? menuRef : null}

className="
relative mb-1 group
"

>



{
editing ? (


<div className="flex gap-2">


<input

value={editingTitle}

onChange={(e)=>
setEditingTitle(e.target.value)
}

className="
border
rounded
px-2
w-full
"

/>



<button

onClick={()=>
saveRename(conversation._id)
}

>

<Check size={16}/>

</button>



<button

onClick={()=>
setEditingConversationId(null)
}

>

<X size={16}/>

</button>


</div>


):(


<div

className={`
flex
items-center
rounded-xl
relative

${
active
?
"bg-green-50"
:
"hover:bg-gray-50"
}

`}

>





<button

disabled={isStreaming}

onClick={()=>
openChat(conversation._id)
}

className="
flex-1
flex
items-center
gap-3
px-3
py-3
text-left
min-w-0
"

>


<MessageSquare size={16}/>


<span className="
truncate
"

>


{
conversation.title ||
"New Conversation"
}


</span>



</button>







<button

onClick={(e)=>{


e.stopPropagation();


setMenuConversationId(
menu ? null : conversation._id
);


}}

className="
mr-2
p-1
rounded-md
text-gray-500
hover:bg-gray-200
opacity-0
group-hover:opacity-100
transition
"

>


<MoreHorizontal size={18}/>


</button>









{
menu && (


<div

className="
absolute
right-2
top-11
bg-white
border
rounded-xl
shadow-lg
p-2
z-50
"

>


<button

onClick={()=>
startRename(conversation)
}

className="
flex
items-center
gap-2
px-3
py-2
hover:bg-gray-100
rounded
w-full
"

>


<Pencil size={15}/>

Rename


</button>





<button

onClick={()=>
handleDelete(conversation)
}

className="
flex
items-center
gap-2
px-3
py-2
text-red-600
hover:bg-red-50
rounded
w-full
"

>


<Trash2 size={15}/>

Delete


</button>



</div>


)

}






</div>


)

}



</div>


);


})

}



</div>



</aside>


);


}
