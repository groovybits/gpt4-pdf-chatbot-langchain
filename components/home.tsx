import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import { useSpeakText } from '@/utils/speakText';
import { PERSONALITY_PROMPTS } from '@/config/personalityPrompts';
import { audioLanguages, subtitleLanguages, Language } from "@/config/textLanguages";
import nlp from 'compromise';

type PendingMessage = {
  type: string;
  message: string;
  sourceDocs?: Document[];
};

function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'You are GIAB They Groovy AI Bot. You are a chatbot that can talk to people following the commands given and prompting format.',
        type: 'systemMessage',
      },
      {
        message: '[GAIB] Groovy AI Bot: Nice to meet you!',
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;
  const { speakText, stopSpeaking } = useSpeakText();

  const [listening, setListening] = useState<boolean>(false);
  const [stoppedManually, setStoppedManually] = useState<boolean>(false);
  const [speechRecognitionComplete, setSpeechRecognitionComplete] = useState(true);
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(true);
  const [timeoutID, setTimeoutID] = useState<NodeJS.Timeout | null>(null);
  const [lastSpokenMessageIndex, setLastSpokenMessageIndex] = useState(-1);
  const [lastMessageDisplayed, setLastMessageDisplayed] = useState(-1);

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [subtitle, setSubtitle] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('gaib.png');
  const [gender, setGender] = useState('FEMALE');
  const [selectedPersonality, setSelectedPersonality] = useState<keyof typeof PERSONALITY_PROMPTS>('GAIB');
  const [audioLanguage, setAudioLanguage] = useState<string>("en-US");
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>("en-US");
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  // Use this function in your frontend components when you want to send a log message
  async function consoleLog(level: string, ...args: any[]) {
    try {
      const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');

      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level: level, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send log message');
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const lastMessageIndex: any = messages.length - 1;

    function extractKeywords(sentence: string, numberOfKeywords = 2) {
      const doc = nlp(sentence);

      // Extract nouns, verbs, and adjectives
      const nouns = doc.nouns().out('array');
      const verbs = doc.verbs().out('array');
      const adjectives = doc.adjectives().out('array');

      // Combine the extracted words and shuffle the array
      const combinedWords = [...nouns, ...verbs, ...adjectives];
      combinedWords.sort(() => 0.5 - Math.random());

      // Select the first N words as keywords
      const keywords = combinedWords.slice(0, numberOfKeywords);

      return keywords;
    }

    async function fetchVideoUrl(sentence: string, useVideoAPI = false): Promise<string> {
      if (useVideoAPI) {
        try {
          let extracted_keywords = extractKeywords(sentence, 8).join(' ');
          consoleLog('info', 'Extracted keywords: ', extracted_keywords);
          const keywords = encodeURIComponent(extracted_keywords);
          const response = await fetch('/api/pexels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords }),
          });
    
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            const videoUrl = data.videos[0].video_files[0].link;
            return videoUrl;
          } else {
            console.error('No video found for the given keywords');
          }
        } catch (error) {
          console.error('Error fetching video from API:', error);
          // Fall back to the default static images
        }
      }
      // failed to fetch video, don't change the video
      return '';
    }    

    // TODO - use image generation API in the future when it is available
    async function gptGeneratedImageUrl(sentence: string, useImageAPI = false): Promise<string> {
      const directoryUrl = process.env.NEXT_PUBLIC_GAIB_IMAGE_DIRECTORY_URL;
      const maxNumber = Number(process.env.NEXT_PUBLIC_GAIB_IMAGE_MAX_NUMBER);

      const endTime = new Date();
      const deltaTimeInSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
      if (deltaTimeInSeconds < 10) {
        console.log(`Time elapsed: ${deltaTimeInSeconds} seconds`);
        return '';
      } 
    
      if (useImageAPI == false && directoryUrl !== null && maxNumber !== null && maxNumber > 0) {
        const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
        const imageUrl = `${directoryUrl}/${randomNumber}.png`;
        return imageUrl;
      } else if (useImageAPI) {
        try {
          let extracted_keywords = extractKeywords(sentence, 8).join(' ');
          consoleLog('info', 'Extracted keywords: ', extracted_keywords);
          const keywords = encodeURIComponent(extracted_keywords);
          const response = await fetch('/api/pexels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords }),
          });
    
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src.medium;
            return imageUrl;
          } else {
            console.error('No image found for the given keywords');
          }
        } catch (error) {
          console.error('Error fetching image from API:', error);
          // Fall back to the default static images
          const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
          const imageUrl = `${directoryUrl}/${randomNumber}.png`;
          if (imageUrl !== null && imageUrl !== undefined && imageUrl !== '') {
            return imageUrl;
          }
          return 'gaib.png';
        }
      }

      // failed to fetch image, return the default image
      const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
      const imageUrl = `${directoryUrl}/${randomNumber}.png`;
      if (imageUrl !== null && imageUrl !== undefined && imageUrl !== '') {
        return imageUrl;
      }
      return 'gaib.png';
    }    

    function splitSentence(sentence: any, maxLength = 80) {
      const regex = new RegExp(`(.{1,${maxLength}})(\\s+|$)`, 'g');
      try {
        return sentence.match(regex) || [];
      } catch (e) {
        consoleLog('error', 'Error splitting sentence: ', sentence, ': ', e);
        return [sentence];
      }
    }

    async function fetchTranslation(text: string, targetLanguage: string): Promise<string> {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
      });

      if (!response.ok) {
        throw new Error('Error in translating text, statusText: ' + response.statusText);
      }

      const data = await response.json();
      return data.translatedText;
    }

    async function displayImagesAndSubtitles() {
      let sentences: string[];
      if (isPaused) {
        stopSpeaking();
        return;
      }
      try {
        // Split the message into lines
        const lines = messages[lastMessageIndex].message.split('\n');
        const splitLines = lines.flatMap(line => line.split(/(?<=\.|\?|!)\s+/));
      
        // Collect sentences with a maximum character limit per group
        const maxCharsPerGroup = 60;
        sentences = [];
        let currentGroup = '';
        splitLines.forEach((sentence, index) => {
          if (currentGroup.length + sentence.length <= maxCharsPerGroup) {
            currentGroup += `${currentGroup ? ' ' : ''}${sentence}`;
          } else {
            sentences.push(currentGroup.trim());
            currentGroup = sentence;
          }
        });
      
        // Add the last group if it's not empty
        if (currentGroup.trim() !== '') {
          sentences.push(currentGroup.trim());
        }
      } catch (e) {
        consoleLog('error', 'Error splitting sentences: ', messages[lastMessageIndex].message, ': ', e);
        sentences = [messages[lastMessageIndex].message];
      }
      
      // Display the images and subtitles
      let gaibImage = await gptGeneratedImageUrl('', false);
      if (gaibImage !== '') {
        setImageUrl(gaibImage);
      }
      setSubtitle(''); // Clear the subtitle
      for (const sentence of sentences) {
        gaibImage = await gptGeneratedImageUrl(sentence, true);
        // TODO - display video Pexels API in the future, chatGPT has the plan laid out...
        //const videoUrl = await fetchVideoUrl(sentence, true);

        // Set the subtitle and wait for the speech to complete before proceeding to the next sentence
        if (lastMessageDisplayed != lastMessageIndex) {
          if (gaibImage !== '') {
            setImageUrl(gaibImage); // Set the image to the open mouth
          }
          setSubtitle(''); // Clear the subtitle

          // Set the subtitle to the translated text if the text is not in English
          let translatedText = '';
          if (subtitleLanguage !== 'en-US') {
            translatedText = await fetchTranslation(sentence, subtitleLanguage);
            setSubtitle(splitSentence(translatedText));
          } else {
            setSubtitle(splitSentence(sentence));
          }

          // Speak the sentence if speech output is enabled
          // determine the model to use
          let model = "en-US-Neural2-H";
          if (audioLanguage === 'en-US') {
            if (gender === 'MALE') {
              model = 'en-US-Wavenet-A';
            } else if (gender === 'FEMALE') {
              model = 'en-US-Wavenet-C';
            } else {
              model = "";
            }
          } else if (audioLanguage === 'ja-JP') {
            if (gender === 'MALE') {
              model = "ja-JP-Wavenet-B";
            } else if (gender === 'FEMALE') {
              model = 'ja-JP-Wavenet-A';
            } else {
              model = "";
            }
          } else {
            model = "";
          }

          // Speak the sentence if speech output is enabled
          if (speechOutputEnabled) {
            consoleLog('info', 'Using speakText with values - gender: ', gender, ' model: ', model, ' language: ', audioLanguage);

            // Speak the sentence
            if (audioLanguage === 'en-US') {
              // Speak the original text
              consoleLog('info', 'speaking untranslated from text: ', sentence);
              await speakText(sentence, 1, gender, audioLanguage, model);
            } else {
              // Speak the translated text
              let translationEntry: string = '';
              if (translatedText !== '' && audioLanguage == subtitleLanguage) {
                // Use the previously translated text
                translationEntry = translatedText;
              } else {
                // Translate the text
                translationEntry = await fetchTranslation(sentence, audioLanguage);
              }
              consoleLog('info', 'speaking translated from text: ', sentence, ' to text: ', translationEntry);
              await speakText(translationEntry, 1, gender, audioLanguage, model);
            }
          } else {
            stopSpeaking();
            gaibImage = await gptGeneratedImageUrl('', false);
            if (gaibImage !== '') {
              setImageUrl(gaibImage); // Set the image to the closed mouth
            }
          }
          // Set the last message displayed
          setLastMessageDisplayed(lastMessageIndex);
        }
      }
      // Reset the subtitle after all sentences have been spoken
      setSubtitle('');
      gaibImage = await gptGeneratedImageUrl('', false);
      if (gaibImage !== '') {
        setImageUrl(gaibImage);
      }
    }

    if (lastMessageIndex > lastSpokenMessageIndex &&
      messages[lastMessageIndex].type === 'apiMessage'
    ) {
      displayImagesAndSubtitles();
      setLastSpokenMessageIndex(lastMessageIndex);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, [messages, speechOutputEnabled, speakText, stopSpeaking, lastSpokenMessageIndex, imageUrl, setSubtitle, lastMessageDisplayed, gender, audioLanguage, subtitleLanguage, isPaused, isSpeaking]);


  type SpeechRecognition = typeof window.SpeechRecognition;

  const handleSpeechOutputToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeechOutputEnabled(event.target.checked);
  };

  // Modify the handleSubmit function
  async function handleSubmit(e: any, recognitionInstance?: SpeechRecognition) {
    e.preventDefault();

    setError(null);

    if (listening) {
      setStoppedManually(true);
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      return;
    }

    if (timeoutID) {
      clearTimeout(timeoutID);
      setTimeoutID(null);
    }

    // Return early if speechRecognitionComplete is false
    if (!speechRecognitionComplete) {
      return;
    }

    if (!query) {
      consoleLog('debug', 'Entry Prompt Query submission was empty!');
      return;
    }

    const question = query.trim();

    // make sure we are not paused
    setIsPaused(false);

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          selectedPersonality: selectedPersonality,
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setIsSpeaking(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    const ctrl = new AbortController();

    try {
      fetchEventSource('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          selectedPersonality,
          history,
        }),
        signal: ctrl.signal,
        onmessage: (event: { data: string; }) => {
          if (event.data === '[DONE]') {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? '']],
              messages: [
                ...state.messages,
                {
                  type: 'apiMessage',
                  message: state.pending ?? '',
                  sourceDocs: state.pendingSourceDocs,
                },
              ],
              pending: undefined,
              pendingSourceDocs: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            if (data.sourceDocs) {
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.sourceDocs,
              }));
            } else {
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? '') + data.data,
              }));
            }
          }
        },
      });
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      consoleLog('error', error);
    }
  }

  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && !e.shiftKey && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
          {
            type: 'apiMessage',
            message: pending,
            sourceDocs: pendingSourceDocs,
          },
        ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);

  const latestMessage: Message | PendingMessage | undefined = chatMessages[chatMessages.length - 1];

  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Update the startSpeechRecognition function
  const startSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;
      recognition.timeout = 10000;

      // Update the listening state
      if (listening) {
        setStoppedManually(false);
        recognition.stop();
      } else {
        setSpeechRecognitionComplete(false);
        recognition.start();
      }

      // Update the onstart function
      recognition.onstart = () => {
        setListening(true);
      };

      // Update the onend function
      recognition.onend = () => {
        setListening(false);
        setSpeechRecognitionComplete(true);

        if (!stoppedManually) {
          handleSubmit({ preventDefault: () => { } }, recognition);
        }
      };

      // Update the onresult function
      recognition.onresult = (event: { results: string | any[]; }) => {
        let last = event.results.length - 1;
        let text = event.results[last][0].transcript;
        let transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

        setQuery(text); // Set the query to the new text

        // If the transcript includes the word "game" or "gabe", stop the recognition
        if (transcript.includes("gabe") || transcript.includes("game")) {
          setStoppedManually(false);
          recognition.stop();
        } else {
          // Clear the previous timeout if there's an active timeout
          if (timeoutID) {
            clearTimeout(timeoutID);
          }

          // Set a new timeout
          const newTimeoutID = setTimeout(() => {
            setStoppedManually(false);
            recognition.stop();
          }, 10000); // Timeout after finished speaking
          setTimeoutID(newTimeoutID);
        }
      };

      recognition.onerror = (event: { error: any; }) => {
        console.error('Error occurred in recognition:', event.error);
        setStoppedManually(true);
        recognition.stop();
      };
    } else {
      alert('Speech Recognition API is not supported in this browser.');
    }
  };

  // pause speaking output
  const handlePause = () => {
    if (isPaused) {
      handleReplay();
      setIsPaused(false);
    } else {
      handleStop();
      setIsPaused(true);
    }
  };

  // clear the chat history
  const handleClear = () => {
    setMessageState((state) => {
      return {
        ...state,
        history: [],
      };
    });
  };  

  // replay the last spoken message
  const handleReplay = () => {
    // Find the last user message
    if (lastSpokenMessageIndex > 0) {
      // add a new message to the messages array with the last spoken message
      setMessageState((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            type: 'apiMessage',
            message: state.messages[lastSpokenMessageIndex].message,
          },
        ],
      }));
    }
  };

  // stop speaking and listening
  const handleStop = () => {
    stopSpeaking();
    setIsPaused(false);
    setIsSpeaking(false);
    if (listening) {
      setStoppedManually(true);
      setSpeechRecognitionComplete(true);
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  };

  return (
    <>
      <div className={styles.header}>
        <title>GAIB The Groovy AI Bot</title>
        <h1>GAIB The Groovy AI Bot</h1>
      </div>
      <Layout>
        <div className="mx-auto flex flex-col gap-4 bg-#3b82f6">
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div className={styles.imageContainer}>
                <div className={styles.generatedImage}>
                  <img
                    src={imageUrl}
                    alt="GAIB"
                    style={{
                      width: '720px',
                      height: '480px',
                      objectFit: 'scale-down',
                    }}
                  />                </div>
                <div className={styles.subtitle}>{subtitle}</div>
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.cloudform}>
                    <textarea
                      disabled={loading || isSpeaking}
                      onKeyDown={handleEnter}
                      ref={textAreaRef}
                      autoFocus={true}
                      rows={3}
                      maxLength={600}
                      id="userInput"
                      name="userInput"
                      placeholder={
                        loading
                          ? selectedPersonality === 'GAIB'
                            ? 'GAIB is generating your Anime...'
                            : 'Thinking upon your question...'
                          : selectedPersonality === 'GAIB'
                            ? 'Give me an Anime plotline to generate? Please end all spoken commands with "GAIB".'
                            : 'Give me a question to answer? Please end all spoken commands with "GAIB".'
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={styles.textarea}
                    />
                  </div>
                  <div className={styles.buttoncontainer}>
                    <div className={styles.buttoncontainer}>
                      <div className={styles.buttoncontainer}>
                        <button
                          type="submit"
                          disabled={loading || !selectedPersonality || isSpeaking}
                          onClick={(e) => {
                            e.preventDefault();
                            if (selectedPersonality) {
                              handleSubmit(e);
                            }
                          }}
                          className={styles.generatebutton}
                        >
                          {(loading || isSpeaking) ? (
                            <div className={styles.loadingwheel}>
                              <LoadingDots color="#FFA500" />
                            </div>
                          ) : (
                            // Send icon SVG in input field
                            <svg
                              viewBox="0 0 20 20"
                              className={styles.svgicon}
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={loading || isSpeaking}
                          className={`${styles.voicebutton} ${listening ? styles.listening : ''}`}
                          onClick={startSpeechRecognition}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.svgicon}
                          >
                            <path d="M12 1v6m0 0v6m-6-6h12"></path>
                            <path d="M21 12v6a3 3 0 01-3 3h-12a3 3 0 01-3-3v-6"></path>
                            <path d="M3 15l1.8-1.8c1.1-1.1 2.8-1.1 3.9 0l1.2 1.2 1.2-1.2c1.1-1.1 2.8-1.1 3.9 0L21 15"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={styles.stopvoicebutton}
                          onClick={handleStop}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.svgicon}
                          >
                            <path d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={loading || isSpeaking}
                          className={styles.replaybutton}
                          onClick={handleReplay}
                        >
                          {<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgicon}>
                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.41 3.59 8 8 8s8-3.59 8-8-3.59-8-8-8z"></path>
                          </svg>
                          }
                        </button>
                        <button
                          type="button"
                          disabled={loading || isSpeaking}
                          className={styles.clearbutton}
                          onClick={handleClear}
                        >
                          {<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgicon}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M15 9l-6 6"></path>
                            <path d="M9 9l6 6"></path>
                          </svg>
                          }
                        </button>
                        <button
                          type="button"
                          className={styles.pausebutton}
                          onClick={handlePause}
                        >
                          {<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.svgicon}>
                            <rect x="4" y="6" width="16" height="4"></rect>
                            <rect x="4" y="14" width="16" height="4"></rect>
                          </svg>
                          }
                        </button>
                      </div>
                    </div>
                    <div className={styles.dropdowncontainer}>
                      <div className={styles.dropdowncontainer}>
                        <div className={styles.labelContainer}>
                          <span className={styles.label} >Personality:</span>
                          <select
                            className={styles.dropdown}
                            disabled={isSpeaking || loading}
                            value={selectedPersonality}
                            onChange={(e) => {
                              setSelectedPersonality(e.target.value as keyof typeof PERSONALITY_PROMPTS);
                            }}
                          >
                            <option value="" disabled>
                              Choose Personality
                            </option>
                            {Object.keys(PERSONALITY_PROMPTS).map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.labelContainer}>
                          <span className={styles.label}>Gender:</span>
                          <select
                            id="gender-select"
                            className={styles.dropdown}
                            disabled={isSpeaking || loading}
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            <option value="" disabled>
                              Choose Voice Gender
                            </option>
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="NEUTRAL">Neutral</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.labelContainer}>
                        <span className={styles.label}>Audio:</span>
                        <select
                          id="audio-language-select"
                          className={styles.dropdown}
                          disabled={isSpeaking || loading}
                          value={audioLanguage}
                          onChange={(e) => setAudioLanguage(e.target.value)}
                        >
                          <option value="" disabled>
                            Choose Audio Language
                          </option>
                          {audioLanguages.map((lang: Language) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.labelContainer}>
                        <span className={styles.label}>Subtitles:</span>
                        <select
                          id="subtitle-language-select"
                          className={styles.dropdown}
                          disabled={isSpeaking || loading}
                          value={subtitleLanguage}
                          onChange={(e) => setSubtitleLanguage(e.target.value)}
                        >
                          <option value="" disabled>
                            Choose Subtitle Language
                          </option>
                          {subtitleLanguages.map((lang: Language) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.buttoncontainer}>
                      <div className={styles.buttoncontainer}>
                        <label>
                          <input
                            type="checkbox"
                            checked={speechOutputEnabled}
                            onChange={handleSpeechOutputToggle}
                          />
                          &nbsp;&nbsp; <b>Speaking Enabled</b>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className={styles.buttonContainer}>
                    <button type="button" onClick={togglePopup} className={styles.copyButton} disabled={isSpeaking || loading}>
                      <svg
                        className={styles.documentIcon}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 3H9C7.89543 3 7 3.89543 7 5V19C7 20.1046 7.89543 21 9 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM17 19H11V17H17V19ZM17 15H11V13H17V15ZM17 11H11V9H17V11ZM17 7H11V5H17V7Z"
                          fill="currentColor"
                        />
                      </svg>
                      Transcript View
                    </button>
                    {showPopup && (
                      <div className="popup" onClick={togglePopup}>
                        <div
                          className="popup-content"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <pre className={styles.preWrap}>{latestMessage.message}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerContainer}>
            <a href="https://groovy.org">The Groovy Organization</a>&nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="https://www.pexels.com">Photos provided by Pexels</a>
          </div>
        </div>
      </Layout>
    </>
  );
}

export default Home;