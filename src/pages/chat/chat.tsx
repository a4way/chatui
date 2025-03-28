import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState, useRef, useEffect } from "react";
import { message } from "../../interfaces/interfaces"
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import {v4 as uuidv4} from 'uuid';
import { toast } from 'sonner';

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8090');
    setSocket(socket);

    socket.onopen = () => {
      console.log("WebSocket Verbindung hergestellt");
      setIsConnected(true);
      toast.success("Verbunden mit dem Chatbot!");
    };

    socket.onerror = (error) => {
      console.error("WebSocket Fehler:", error);
      setIsConnected(false);
      toast.error("Verbindungsfehler zum Chatbot!");
    };

    socket.onclose = () => {
      console.log("WebSocket Verbindung geschlossen");
      setIsConnected(false);
      toast.error("Verbindung zum Chatbot verloren!");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      cleanupMessageHandler();
    };
  }, []);

  const cleanupMessageHandler = () => {
    if (messageHandlerRef.current && socket) {
      socket.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
  };

  const handleFileContent = (content: string) => {
    const traceId = uuidv4();
    setMessages(prev => [...prev, { 
      content: "Ich habe eine Datei mit folgendem Inhalt hochgeladen:\n\n```\n" + content + "\n```", 
      role: "user", 
      id: traceId 
    }]);
    handleSubmit("Analysiere bitte den Inhalt dieser Datei und gib mir eine Zusammenfassung.");
  };

  async function handleSubmit(text?: string) {
    if (!isConnected) {
      toast.error("Nicht mit dem Chatbot verbunden!");
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN || isLoading) {
      toast.error("Verbindung zum Chatbot nicht verfügbar!");
      return;
    }

    const messageText = text || question;
    if (!messageText.trim()) {
      return;
    }

    setIsLoading(true);
    cleanupMessageHandler();
    
    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user", id: traceId }]);
    socket.send(messageText);
    setQuestion("");

    try {
      const messageHandler = (event: MessageEvent) => {
        if(event.data.includes("[END]")) {
          setIsLoading(false);
          cleanupMessageHandler();
          return;
        }
        
        try {
          // Versuche die Nachricht als JSON zu parsen
          const jsonResponse = JSON.parse(event.data);
          
          if (jsonResponse.type === "image") {
            // Bildantwort verarbeiten
            setMessages(prev => [...prev, { 
              content: `![${jsonResponse.query}](${jsonResponse.url})`, 
              role: "assistant", 
              id: traceId 
            }]);
          } else if (jsonResponse.type === "error") {
            // Fehlermeldung verarbeiten
            setMessages(prev => [...prev, { 
              content: `Fehler: ${jsonResponse.message}`, 
              role: "assistant", 
              id: traceId 
            }]);
          }
        } catch (e) {
          // Wenn keine JSON-Antwort, normale Textnachricht verarbeiten
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            const newContent = lastMessage?.role === "assistant" 
              ? lastMessage.content + event.data 
              : event.data;
              
            const newMessage = { content: newContent, role: "assistant", id: traceId };
            return lastMessage?.role === "assistant"
              ? [...prev.slice(0, -1), newMessage]
              : [...prev, newMessage];
          });
        }
      };

      messageHandlerRef.current = messageHandler;
      socket.addEventListener("message", messageHandler);
    } catch (error) {
      console.error("WebSocket error:", error);
      setIsLoading(false);
      toast.error("Fehler beim Senden der Nachricht!");
    }
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <Header/>
      <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
        {messages.length == 0 && <Overview onFileContent={handleFileContent} />}
        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} />
        ))}
        {isLoading && <ThinkingMessage />}
        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]"/>
      </div>
      <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <ChatInput  
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};