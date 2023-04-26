import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import logger from '@/utils/logger';
import nlp from 'compromise';

const MAX_INPUT_LENGTH = 4096;
const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 1000; // Set the initial retry delay in milliseconds

// Use this function in your frontend components when you want to send a log message
async function consoleLog(level: string, ...args: any[]) {
  const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');

  logger.log(level, message);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function summarizeTextLocal(text: string, numSentences: number = 3): string {
  const doc = nlp(text);
  const sentences = doc.sentences().out('array');

  // Sort sentences by their length and pick the longest ones
  const sortedSentences = sentences.sort((a: string | any[], b: string | any[]) => b.length - a.length);
  const summarySentences = sortedSentences.slice(0, numSentences);

  return summarySentences.join(' ');
}

function extractKeywords(sentence: string, numberOfKeywords = 3) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question, selectedPersonality, history } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  let sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  // sanitize history
  const summarizedHistory = history ? extractKeywords(summarizeTextLocal(history)) : '';

  // Truncate the input if it exceeds the maximum length
  if (sanitizedQuestion.length > MAX_INPUT_LENGTH) {
    consoleLog('error', `Question ${sanitizedQuestion} exceeds maximum length of ${MAX_INPUT_LENGTH} characters, truncating...`)
    sanitizedQuestion = sanitizedQuestion.substring(0, MAX_INPUT_LENGTH);
  }

  consoleLog('info', "\n===\nPersonality: ", selectedPersonality, "\n===\nHistory: ", 
      history, "\n===\nsummarizedHistory: ", summarizedHistory, "\n===\nQuestion: ", 
      question, "\n===\nSanitized Question: ", sanitizedQuestion, "\n===\nRequest Body: ", 
      req.body, "\n===\n");

  const index = pinecone.Index(PINECONE_INDEX_NAME);

  let vectorStore;
  try {
    try {
      // Try to load the vector store for the selected personality
      vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings({}), {
        pineconeIndex: index,
        textKey: 'text',
        namespace: selectedPersonality.toLowerCase().trim(),
      });
    } catch (error) {
      // Use the default vector store if the selected personality is not available
      vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings({}), {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      });
    }
  } catch (error) {
    consoleLog('error', 'Error creating vector store:', error);
    return res.status(500).json({ message: 'Internal server error VS001.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: '' }));

  // Create chain
  const chain = makeChain(vectorStore, selectedPersonality, (token: string) => {
    sendData(JSON.stringify({ data: token }));
  });

  let response;
  let retries = 0;
  let success = false;

  while (!success && retries < MAX_RETRIES) {
    try {
      // Ask a question
      response = await chain.call({
        question: sanitizedQuestion,
        chat_history: history ? [history] : [],
      });

      if (!response) {
        console.error('No response from GPT');
        retries++;
        continue;
      }

      consoleLog('info', "\n===\nResponse: \n", response, "\n===\n");

      //sendData(JSON.stringify({ sourceDocs: response.sourceDocuments }));
      success = true;
    } catch (error) {
      if (error instanceof Error && error.message) {
        consoleLog('error', 'API error: ', error.message ? error.message : error);
      } else {
        consoleLog('error', 'Unknown error:', error);
      }
      retries++;

      if (retries < MAX_RETRIES) {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
        console.log('info', `Failed to connect to the GPT API after ${retries}, Retrying in ${retryDelay} ms...`);
        await sleep(retryDelay);
      } else {
        console.log('error', 'Could not contact GPT after multiple retries, giving up. Please try again later.');
        sendData(JSON.stringify({ error: 'Could not contact GPT after multiple retries, giving up. Please try again later.' }));
        break;
      }
    }
  }

  sendData('[DONE]');
  res.end();
}
