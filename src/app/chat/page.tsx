// "use client";

// import { useState, useRef, useEffect } from "react";
// import axios from "axios";
// import ReactMarkdown from "react-markdown";

// // Helper function to split a paragraph into sentences.
// // It handles common abbreviations and includes trailing emojis.
// // Now also splits any sentence containing "/#/" into multiple segments.
// function splitParagraphToSentences(paragraph: string): string[] {
//   const abbreviations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "e.g.", "i.e."];

//   function isUppercase(char: string): boolean {
//     return char >= "A" && char <= "Z";
//   }

//   function isEmoji(char: string): boolean {
//     const code = char.codePointAt(0);
//     if (code === undefined) return false;
//     return (
//       (code >= 0x1f600 && code <= 0x1f64f) || // Emoticons
//       (code >= 0x1f300 && code <= 0x1f5ff) || // Misc Symbols
//       (code >= 0x1f680 && code <= 0x1f6ff) || // Transport Symbols
//       (code >= 0x2600 && code <= 0x26ff)   || // Misc symbols
//       (code >= 0x2700 && code <= 0x27bf)   || // Dingbats
//       (code >= 0xFE0E && code <= 0xFE0F)      // Variation Selectors
//     );
//   }

//   function isSentenceTerminator(char: string, index: number): boolean {
//     if (char === "." || char === "!" || char === "?" || char === "…") {
//       for (let abbr of abbreviations) {
//         const start = index - abbr.length + 1;
//         if (start >= 0 && paragraph.substring(start, index + 1) === abbr) {
//           return false;
//         }
//       }
//       return true;
//     }
//     return false;
//   }

//   const sentences: string[] = [];
//   let sentenceStart = 0;
//   let i = 0;
//   const len = paragraph.length;

//   while (i < len) {
//     if (isSentenceTerminator(paragraph[i], i)) {
//       let j = i + 1;
//       // Consume any extra terminators
//       while (j < len && ".!?…".includes(paragraph[j])) {
//         j++;
//       }
//       // Consume spaces
//       while (j < len && paragraph[j] === ' ') {
//         j++;
//       }
//       // Consume emojis
//       while (j < len && isEmoji(paragraph[j])) {
//         j++;
//       }
//       // Extract the sentence including trailing emojis
//       const sentence = paragraph.slice(sentenceStart, j).trim();
//       if (sentence) sentences.push(sentence);
//       sentenceStart = j;
//       i = j;
//       continue;
//     }
//     i++;
//   }

//   if (sentenceStart < len) {
//     const last = paragraph.slice(sentenceStart).trim();
//     if (last) sentences.push(last);
//   }

//   // Further split on custom delimiters
//   const finalSentences: string[] = [];
//   sentences.forEach((s) => {
//     if (s.includes("/#/")) {
//       finalSentences.push(
//         ...s.split("/#/ ").map(x => x.trim()).filter(x => x)
//       );
//     } else if (s.includes("/#")) {
//       finalSentences.push(
//         ...s.split("/# ").map(x => x.trim()).filter(x => x)
//       );
//     } else {
//       finalSentences.push(s);
//     }
//   });

//   return finalSentences;
// }

// // Helper function to further split text into segments that are either plain text or an emote.
// // Each returned segment is an object with { text, isEmote }.
// function splitTextWithEmotes(paragraph: string): { text: string; isEmote: boolean }[] {
//   const sentences = splitParagraphToSentences(paragraph);
//   const segments: { text: string; isEmote: boolean }[] = [];
//   const emoteRegex = /:(\w+):/g;
//   sentences.forEach((sentence) => {
//     let lastIndex = 0;
//     let match;
//     while ((match = emoteRegex.exec(sentence)) !== null) {
//       if (match.index > lastIndex) {
//         segments.push({ text: sentence.slice(lastIndex, match.index), isEmote: false });
//       }
//       segments.push({ text: match[0], isEmote: true });
//       lastIndex = match.index + match[0].length;
//     }
//     if (lastIndex < sentence.length) {
//       segments.push({ text: sentence.slice(lastIndex), isEmote: false });
//     }
//   });
//   return segments;
// }

// interface Message {
//   id: number;
//   text: string;
//   sender: string;
//   date: string;
//   animated?: boolean;
//   pending?: boolean;
// }

// const URL_CONFIG = {
//   url: process.env.APP_BASE_URL ?? 'http://localhost:8080'
// };

// export default function ChatPage() {
//   const [threadID, setThreadID] = useState("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [pageLoading, setPageLoading] = useState(false); // <— initial load
//   const [sending, setSending] = useState(false);         // <— user send
//   const [executing, setExecuting] = useState(false);     // <— Dante response
//   const [disable, setDisable] = useState(false);

//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // ➊ determine if last message is from the user
//   const lastMsg = messages[messages.length - 1];
//   const lastFromUser = lastMsg?.sender === "You";

//   // ➋ only allow “execute” when not busy and (there’s input OR last message was You)
//   const canExecute =
//     !pageLoading &&
//     !sending &&
//     !executing &&
//     (input.trim().length > 0 || lastFromUser);

//   // Global key capture: any letter/number typed registers in the textarea
//   useEffect(() => {
//     const handleGlobalKey = (e: KeyboardEvent) => {
//       if (pageLoading || sending || executing) return;
//       if (e.ctrlKey || e.metaKey || e.altKey) return;
//       if (e.key.length === 1) {
//         e.preventDefault();
//         inputRef.current?.focus();
//         setInput(prev => prev + e.key);
//       }
//     };
//     window.addEventListener("keydown", handleGlobalKey);
//     return () => window.removeEventListener("keydown", handleGlobalKey);
//   }, [pageLoading, sending, executing]);

//   useEffect(() => {
//     const verifyUser = async () => {
//       try {
//         await axios.get(`${URL_CONFIG.url}/user/verify`, { withCredentials: true });
//         // if we get here it was 2xx, so allowed
//       } catch (error: any) {
//         if (error.response?.status === 403) {
//           // user exists but not approved → send to queue page
//           window.location.href = "/queue";
//         } else {
//           console.error("Verification error:", error);
//         }
//       }
//     };
  
//     verifyUser();
//   }, []);

//   const getThreadID = async (): Promise<string> => {
//     try {
//       const res = await axios.get<{ threadID: string }>(
//         `${URL_CONFIG.url}/assistant/thread/retrieve`,
//         { withCredentials: true, timeout: 15000 }
//       );
  
//       if (res.status === 200) {
//         return res.data.threadID;
//       } else {
//         console.error(`Unexpected status ${res.status}`);
//         return '';
//       }
//     } catch (err: any) {
//       console.error("Couldn't get thread ID:", err.response?.status, err.message);
//       return '';
//     }
//   };
  

//   // loadChat does not manage the loading state internally.
//   const loadChat = async (hookThreadID?: string) => {
//     if (!threadID && !hookThreadID) return;
//     const tID = threadID || hookThreadID;
//     try {
//       const fetchChat = await axios.post(`${URL_CONFIG.url}/assistant/message/list`, { threadID: tID }, { withCredentials: true });
//       if (fetchChat.status !== 200) {
//         console.error("Failed to fetch chat messages");
//         return;
//       }
//       const chatHistory = fetchChat.data.historyThread.map((msg: any) => {
//         const rawText = msg.content[0]?.text?.value || "No content";
//         const cleanedText = rawText.replace(/【\d+:\d+†[^】]+】/g, "");
//         return {
//           id: msg.id,
//           text: cleanedText,
//           sender: msg.role === "assistant" ? "Dante" : "You",
//           date: new Date().toLocaleDateString()
//         } as Message;
//       });
//       setMessages(chatHistory);
//     } catch (error) {
//       console.error("Error loading chat:", error);
//     }
//   };


//   // Initial hook
//   const hook = async () => {
//     setPageLoading(true);
//     try {
//       const tid = await getThreadID();
//       setThreadID(tid);
//       await loadChat(tid);
//     } finally {
//       setPageLoading(false);
//     }
//   };
//   useEffect(() => { hook(); }, []);

//   const handleSend = async () => {
//     if (!input.trim() || !threadID) return;
//     setSending(true);

//     // create placeholder
//     const placeholderId = Date.now();
//     const placeholderMsg: Message = {
//       id: placeholderId,
//       text: input,
//       sender: "You",
//       date: new Date().toLocaleDateString(),
//       pending: true,
//     };
//     setMessages(prev => [...prev, placeholderMsg]);
//     const userInput = input;
//     setInput("");

//     try {
//       const guard = await axios.post(`${URL_CONFIG.url}/agent/guardrailInput`, 
//         { input: userInput },
//         { withCredentials: true }
//       );
//       if (guard.data.guardrail === "fail") {
//         setDisable(true);
//         return;
//       }
//       await axios.post(`${URL_CONFIG.url}/assistant/message/create`, 
//         { threadID, message: userInput },
//         { withCredentials: true }
//       );
//       // flip placeholder to final
//       setMessages(prev =>
//         prev.map(m =>
//           m.id === placeholderId
//             ? { ...m, pending: false }
//             : m
//         )
//       );
//     } catch (err) {
//       console.error(err);
//       // you could remove placeholder on error if you like
//     } finally {
//       setSending(false);
//     }
//   };

//   // Animate Dante's response sentence-by-sentence with a delay based on sentence length.
//   const animateDanteMessage = (text: string): number => {
//     const sentences = splitParagraphToSentences(text);
//     let totalDelay = 0;
//     sentences.forEach((sentence, index) => {
//       const delay = sentence.length * 50; // 50ms per character
//       totalDelay += delay;
//       setTimeout(() => {
//         const currentDate = new Date().toLocaleDateString();
//         const sentenceMsg: Message = {
//           id: Date.now() + index,
//           text: sentence,
//           sender: "Dante",
//           date: currentDate,
//           animated: true
//         };
//         setMessages((prev) => [...prev, sentenceMsg]);
//       }, totalDelay);
//     });
//     return totalDelay;
//   };

//   const handleExecute = async () => {
//     if (!canExecute) return;
  
//     // ➌ if there’s input, send it first
//     if (input.trim()) {
//       await handleSend();
//     }
  
//     // ➍ only proceed if the very last message is now from You
//     const last = messages[messages.length - 1];
//     if (!last || last.sender !== "You") return;
  
//     setExecuting(true);
//     setSending(true);
//     try {
//       const res = await axios.post(
//         `${URL_CONFIG.url}/assistant/run/execute`,
//         { threadID },
//         { timeout: 60000, withCredentials: true }
//       );
//       const arr = Array.isArray(res.data.responses) ? res.data.responses : [];
//       const rawText = arr.length ? arr[arr.length - 1].text || "" : "";
//       const cleaned = rawText.replace(/【\d+:\d+†[^】]+】/g, "");
//       const delay = animateDanteMessage(cleaned);
//       setTimeout(() => {
//         setSending(false);
//         setExecuting(false);
//       }, delay + 100);
//     } catch (err) {
//       console.error(err);
//       setSending(false);
//       setExecuting(false);
//     }
//   };  

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const fetchData = async () => {
//     const tid = await getThreadID();
//     setThreadID(tid);
//     return tid;
//   };

//   // Automatically scroll to the bottom when messages change.
//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     hook();
//   }, []);

//   // Optionally, refresh history on mount.
//   useEffect(() => {
//     loadChat();
//   }, []);

//   // Group messages by sender.
//   const groupedMessages: { sender: string; messages: Message[] }[] = [];
//   messages.forEach((msg) => {
//     if (
//       groupedMessages.length === 0 ||
//       groupedMessages[groupedMessages.length - 1].sender !== msg.sender
//     ) {
//       groupedMessages.push({ sender: msg.sender, messages: [msg] });
//     } else {
//       groupedMessages[groupedMessages.length - 1].messages.push(msg);
//     }
//   });

//   return (
//     <div className="relative flex flex-col h-screen bg-amber-50">
//       <div className="ball"/>
//       {disable && (
//         <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50">
//           <div className="bg-red-500 p-4 rounded-sm shadow-sm">
//             <p className="text-black">
//               You have violated the usage policy. Contact administrator if this is a mistake.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex items-center justify-center border border-b-amber-300">
//         <h1
//           onClick={() => (window.location.href = "/")}
//           className="text-2xl font-bold py-4 px-8 text-black cursor-pointer"
//         >
//           DANTE
//         </h1>
//       </div>

//       {/* Chat area */}
//       <div className="relative flex-1 py-2 px-12 overflow-y-auto space-y-4">
//         {pageLoading ? (
//             <>
//               {/* user-side skeleton */}
//               <div className="flex justify-end">
//                 <div className="flex flex-col space-y-1 items-end max-w-[70%]">
//                   <span className="rounded-xl w-20 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-72 h-10 bg-amber-300 animate-pulse" />
//                 </div>
//               </div>

//               {/* Dante skeleton */}
//               <div className="flex items-start">
//                 {/* avatar */}
//                 <div className="w-10 h-10 rounded-full bg-amber-300 animate-pulse mr-2" />

//                 <div className="flex flex-col space-y-1 items-start max-w-[70%]">
//                   <span className="rounded-xl w-64 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-72 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-56 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-68 h-10 bg-amber-300 animate-pulse" />
//                   {/* emote placeholder */}
//                   {/* <div className="w-16 h-16 bg-gray-300 rounded-sm animate-pulse" /> */}
//                 </div>
//               </div>

//               {/* user-side skeleton */}
//               <div className="flex justify-end">
//                 <div className="flex flex-col space-y-1 items-end max-w-[70%]">
//                   <span className="rounded-xl w-96 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-72 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-80 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-48 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-24 h-10 bg-amber-300 animate-pulse" />
//                 </div>
//               </div>

//               {/* Dante skeleton */}
//               <div className="flex items-start">
//                 {/* avatar */}
//                 <div className="w-10 h-10 rounded-full bg-amber-300 animate-pulse mr-2" />

//                 <div className="flex flex-col space-y-1 items-start max-w-[70%]">
//                   <span className="rounded-xl w-24 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-52 h-10 bg-amber-300 animate-pulse" />
//                   <span className="rounded-xl w-56 h-10 bg-amber-300 animate-pulse" />
//                   {/* emote placeholder */}
//                   {/* <div className="w-16 h-16 bg-gray-300 rounded-sm animate-pulse" /> */}
//                 </div>
//               </div>


//               <div /> {/* empty spacer */}
//             </>
//           ) : ( // Actual messages
//             groupedMessages.map((group, gi) => {
//               if (group.sender === "Dante") {
//                 return (
//                   <div key={gi} className="flex items-start">
//                     <img
//                       src="/customEmote/patted.png"
//                       alt="Dante"
//                       className="w-10 h-10 rounded-full mr-2"
//                     />
//                     <div className="flex flex-col space-y-1 items-start max-w-[70%]">
//                       {group.messages.map((msg) =>
//                         splitTextWithEmotes(msg.text).map((seg, idx) =>
//                           seg.isEmote ? (
//                             <span
//                               key={`${msg.id}-${idx}`}
//                               className="emoji-box px-2 py-1 w-fit break-words text-left"
//                             >
//                               <img
//                                 src={`/customEmote/${seg.text.slice(1, -1)}.png`}
//                                 alt={seg.text.slice(1, -1)}
//                                 className="inline h-48 w-48"
//                               />
//                             </span>
//                           ) : (
//                             <span
//                               key={`${msg.id}-${idx}`}
//                               className="px-4 py-2 rounded-xl text-black w-fit break-words bg-amber-100 text-left font-light"
//                             >
//                               <ReactMarkdown>{seg.text}</ReactMarkdown>
//                             </span>
//                           )
//                         )
//                       )}
//                     </div>
//                   </div>
//                 );
//               } else {
//                 return (
//                   <div key={gi} className="flex justify-end">
//                     <div className="flex flex-col space-y-1 items-end max-w-[70%]">
//                       {group.messages.map((msg) => (
//                         <span
//                           key={msg.id}
//                           className={`px-4 py-2 rounded-xl w-fit break-words text-left ${
//                             msg.pending
//                               ? "bg-amber-100 text-gray-400"
//                               : "bg-amber-300 text-black"
//                           }`}
//                         >
//                           <ReactMarkdown>{msg.text}</ReactMarkdown>
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 );
//               }
//             }))}
//         <div ref={scrollRef} />
//       </div>


//       {/* Input & execute button */}
//       <div className="relative mb-4 p-8 pt-0">
//         <div className="flex items-center space-x-2 px-8 py-4 bg-amber-50 rounded-lg border border-amber-300">
//           <textarea
//             ref={inputRef}
//             placeholder="Message"
//             value={input}
//             onChange={(e) => {
//               setInput(e.target.value);
//               e.target.style.height = "auto";
//               e.target.style.height = `${e.target.scrollHeight}px`;
//             }}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSend();
//               }
//             }}
//             disabled={pageLoading || sending || executing}
//             className="resize-none place-content-center outline-none flex-1 pr-2 text-black bg-amber-50 min-h-[50px] disabled:opacity-50"
//           />
//           <button
//             onClick={handleExecute}
//             disabled={!canExecute}
//             className="relative flex items-center group disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <img
//               src="/customEmote/patted.png"
//               alt="Dante"
//               className="w-10 h-10 rounded-full mr-2 transition-opacity ease-in-out group-hover:opacity-0"
//             />
//             <img
//               src="/customEmote/sniff.png"
//               alt="Dante"
//               className="w-10 h-10 rounded-full mr-2 absolute opacity-0 scale-100 transition-all ease-in-out group-hover:opacity-100 group-hover:scale-150"
//             />
//           </button>
//         </div>

//         {/* Dante typing indicator */}
//         {executing && (
//           <div className="absolute left-8 text-black text-sm flex items-center space-x-1">
//             <span className="animate-bounce font-black" style={{ animationDelay: '0ms' }}>.</span>
//             <span className="animate-bounce font-black" style={{ animationDelay: '200ms' }}>.</span>
//             <span className="animate-bounce font-black" style={{ animationDelay: '400ms' }}>.</span>
//             <span><strong>Dante</strong> is typing...</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }