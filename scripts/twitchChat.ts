import tmi from 'tmi.js';

const allowStories = true;  //process.env.ALLOW_STORIES ? process.env.ALLOW_STORIES === 'true' ? true : false : false;

// TypeScript function to sanitize input by escaping special characters
const sanitizeInput = (input: string): string => {
  const escapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
    '${': '&#36;&#123;',
  };

  return input.replace(/[&<>"'`=/\${}]/g, (char) => escapeMap[char]);
};

// Get the channel name from the command line arguments
const channelName = process.argv[2];
const oAuthToken = process.env.TWITCH_OAUTH_TOKEN ? process.env.TWITCH_OAUTH_TOKEN : '';
const llmHost = process.env.LLM_HOST ? process.env.LLM_HOST : 'earth:8080';
const chatHistorySize: number = process.env.TWITCH_CHAT_HISTORY_SIZE ? parseInt(process.env.TWITCH_CHAT_HISTORY_SIZE) : 2;
const maxTokens = 80;
const temperature = 1.0;
const openApiKey: string = "FAKE_API_KEY";
const maxHistoryBytes = 4096;
const twitchUserName = process.env.TWITCH_USER_NAME ? process.env.TWITCH_USER_NAME : 'llm';

let lastMessageArray: any[] = [];
const processedMessageIds: { [id: string]: boolean } = {};
const howto: string = "Type !help to see the commands. Use !message <personality> <message> to ask a question, and !personalities to see the available personalities.";
const personalityPrompt: string = `You are Mickey Mouse in your Buddhist Chatroom where you and Buddha moderate the chatroom and help users with their questions. Carry on conversations that are short with Buddha and the Chat room members. ${howto}`;

if (!channelName) {
  console.log('Usage: node twitchChat.js <channelName>');
  process.exit(1);
}

if (!oAuthToken) {
  console.log('TWITCH_OAUTH_TOKEN environment variable not set');
  process.exit(1);
}

console.log(`channel ${channelName} starting up with user ${twitchUserName}...`);

// Create a TMI client
const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: twitchUserName,
    password: `oauth:${oAuthToken}`
  },
  channels: [channelName]
});

client.connect();

// Yoda's wisdom: A mapping to keep track of the last message timestamp for each user
const lastMessageTimestamps: { [username: string]: number } = {};

// Yoda's wisdom: Function to check for user inactivity
const checkUserInactivity = () => {
  const currentTime = Date.now();
  Object.keys(lastMessageTimestamps).forEach((username) => {
    if (currentTime - lastMessageTimestamps[username] > 30000) {  // 30 seconds
      delete lastMessageTimestamps[username];  // Remove the username to avoid multiple messages
    }
  });
};

// Yoda's wisdom: Periodically check for user inactivity
setInterval(checkUserInactivity, 30000);  // Run every 30 seconds

// Store usernames initially present in the room
let initialUsers: Set<string> = new Set();
let newUsers: Set<string> = new Set();  // Yoda's wisdom: A new set for users joining after initialization
let hasInitialized: boolean = false;

// Yoda's wisdom: Delay the initialization to ensure the bot has connected and received the initial 'join' events
setTimeout(() => {
  hasInitialized = true;
}, 60000);  // 60-second delay

// Yoda's wisdom: Welcome only new users when they join the room
client.on('join', (channel: any, username: any, self: any) => {
  if (self) return;  // Ignore messages from the bot itself

  // Yoda's wisdom: If the bot has initialized, and the user is new, welcome them
  if (hasInitialized && !initialUsers.has(username) && !newUsers.has(username)) {
    //client.say(channel, `Welcome to the channel, ${username}! Use !message <personality> <message> to ask a question, and !personalities to see the available personalities.`);
    newUsers.add(username);  // Yoda's wisdom: Add the user to the newUsers set

    // Yoda's wisdom: Set the last message timestamp for this user upon joining
    lastMessageTimestamps[username] = Date.now();
  }

  // Yoda's wisdom: Add username to the initialUsers set to avoid welcoming again
  if (!hasInitialized) {
    initialUsers.add(username);

    // Yoda's wisdom: Set the last message timestamp for this user upon joining
    lastMessageTimestamps[username] = Date.now();
  }
});

lastMessageArray.push({ "role": "system", "content": personalityPrompt });

client.on('message', async (channel: any, tags: {
  id: any; username: any;
}, message: any, self: any) => {
  // Ignore messages from the bot itself
  if (self) return;

  message = sanitizeInput(message);

  // Ignore messages that have already been processed
  if (processedMessageIds[tags.id]) {
    console.log(`Ignoring duplicate message with ID ${tags.id}`);
    return;
  }

  // Yoda's wisdom: Update the last message timestamp for this user
  if (tags.username) {
    lastMessageTimestamps[tags.username] = Date.now();
  }

  // Mark this message as processed
  processedMessageIds[tags.id] = true;

  // remove the oldest message from the array
  if (lastMessageArray.length > chatHistorySize) {
    // don't remove the oldest message if it is a system message, then remove the one after it
    if (lastMessageArray[0].role === 'system') {
      lastMessageArray.splice(1, 1);
    } else {
      lastMessageArray.shift();
    }
  }

  // remove any messages after the maxHistoryBytes are met
  let historyBytes = 0;
  let historyIndex = 0;
  lastMessageArray.forEach((messageObject: any) => {
    historyBytes += JSON.stringify(messageObject).length;
    if (historyBytes > maxHistoryBytes) {
      lastMessageArray.splice(historyIndex, lastMessageArray.length - historyIndex);
    }
    historyIndex++;
  });

  // structure tohold each users settings and personality prompts
  const userSettings: any = {};

  // add user if doesn't exist, else update last message timestamp in userSettings
  if (tags.username) {
    if (!userSettings[tags.username]) {
      userSettings[tags.username] = {};
    }
    userSettings[tags.username].lastMessageTimestamp = Date.now();
  }
  console.log(`Received message: ${message}\nfrom ${tags.username} in ${channel}\nwith tags: ${JSON.stringify(tags)}\n`)


  // check message to see if it is a command
  if (message.startsWith('!')) {
    // Do nothing
    console.log(`Ignoring command message: ${message}`);
  } else {
    let promptArray: any[] = [];
    // copy lastMessageArray into promptArrary prepending the current content member with the prompt variable
    let counter = 0;
    let gptAnswer = '';

    let isStory = false;
    // parse the message to see if it is a question or eipsode request, as a fuzzy nlp type match, where it is free form english chat, it may be called a story too
    if (allowStories && message.toLowerCase().includes('episode')) {
      isStory = true;
    }

    lastMessageArray.forEach((messageObject: any) => {
      if (messageObject.role && messageObject.content) {
        promptArray.push({ "role": messageObject.role, "content": messageObject.content });
      }
      counter++;
    });
    // add the current message to the promptArray with the final personality prompt
    promptArray.push({ "role": "user", "content": `You have a new message from ${tags.username} who said ${message}. Please respond to them by name.` });
    promptArray.push({ "role": "assistant", "content": "" });
    // save the last message in the array for the next prompt
    lastMessageArray.push({ "role": "user", "content": `${tags.username} asked ${message}` });

    console.log(`OpenAI promptArray:\n${JSON.stringify(promptArray, null, 2)}\n`);

    fetch(`http://${llmHost}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: maxTokens,
        n_predict: maxTokens,
        temperature: temperature,
        top_p: 1,
        n: 1,
        stream: false,
        messages: promptArray,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate OpenAI response:\n${response.statusText} (${response.status}) - ${response.body}\n`);
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
          const aiMessage = data.choices[0].message;
          console.log(`OpenAI response:\n${JSON.stringify(aiMessage, null, 2)}\n`);

          console.log(`OpenAI usage:\n${JSON.stringify(data.usage, null, 2)}\nfinish_reason: ${data.choices[0].finish_reason}\n`);

          gptAnswer = aiMessage.content;
          // remove ! from start of message if it exists
          if (gptAnswer.startsWith('!')) {
            gptAnswer = gptAnswer.substring(1);
          }
          client.say(channel, aiMessage.content);

          lastMessageArray.push(aiMessage);
        } else {
          console.error('No choices returned from OpenAI!\n');
          console.log(`OpenAI response:\n${JSON.stringify(data)}\n`);
        }
      })
      .catch(error => console.error('An error occurred:', error));
    // sleep for 30 seconds to allow the ai to respond
    // generate random delay between 30 and 90 seconds for timeout
    const delay = Math.floor(Math.random() * 60) + 30;
    setTimeout(() => {
      hasInitialized = true;
    }, delay);  // N-second delay
    return;
  }
});
