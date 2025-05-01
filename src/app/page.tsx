'use client'

import { useChat } from "@ai-sdk/react";
import { Message } from "ai"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import  LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";
export default function Home() {
  const { append, status, messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    onResponse: (message) => {
      console.log("Response received:", message);
    },
    onFinish: (message) => {
      console.log("Response finished:", message);
    }
  });
  const handlePropmpt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    }
    append(msg);
  };
  const noMessages = messages.length === 0 || !messages
  console.log(status)
  return (
    <main className="flex h-screen flex-col items-center mx-auto max-w-[100vw] sm:max-w-[80vw] justify-between p-10 sm:p-16 md:p-20">
      
      <div className="flex text-7xl text items-center font-extrabold justify-center">
      <p className=" text-red-600">
        F1
        </p>
        <p className="text-black-600">
          GPT
        </p>
        </div>
      <section className="w-full flex flex-col justify-end overflow-scroll">
      {noMessages ? (
        <>
        <p className="text-xl text-center">
          The Ultimate place for Formular One Super fans!
          Ask F1GPT anything about the fantastic topic of F1 racing and it will come back with the most up-to-date answers.
          We hope you enjoy!
        </p>
        <br/>
        <PromptSuggestionsRow onPromptClick={handlePropmpt} />
        </>
      ) : (
        <>
          {/* map messages onto text bubbles  */}
          {messages.map((message, index) => (
            <Bubble key={index} message={message} />
          ))}


          {/* show loading bubble if status is loading */}
         {status === 'submitted' && (
          <LoadingBubble />
          )}
        </>
      )}

     
      </section>
      <form onSubmit={handleSubmit} className="flex items-center w-full mt-4 pt-5 border-t-2 border-gray-400 overflow-hidden">
        <input
          type="text"
          
          placeholder="Ask me something..."
          className="border-none bg-white outline-none rounded-bl-lg p-2 w-10/12"
          onChange={handleInputChange}
          value={input}
          disabled={status !== "ready"}
        />
        <input type="submit" value="Send" className="border-none bg-purple-600 text-white rounded-br-lg w-2/12 px-4 py-2" />
      </form>
    </main>
  );
}
