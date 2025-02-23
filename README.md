# Groovy

## Introduction

Groovy is a multilingual chatbot capable of understanding, speaking, and translating any language in both text and audio formats. It can adopt various AI bot modes or personalities, each tailored for specific tasks. Groovy also features an Anime generation theme that crafts stories based on data from PDFs stored in the vector database. You can stream feeds through Groovy to interpret them in various ways through the configuration. Groovy allows full configurability of all aspects of the internals + gives output audio/images subtitles meme/Anime Manga style.

## Twitch stream automated feed 24/7 capability with AI Bot to help support and allow chat members to control output of Groovy 

Twitch stream of Groovy with Chat AI Bot episode playback ability: [groovyaibot](https://twitch.tv/groovyaibot)

There is a Twitch AI Chatbot here [Twitch AI Bot](scripts/twitchChat.ts) That you can run the bot with `npm twitch <yourchannelname>` and talk to Groovy in various ways if setup.

```text
# Twitch chatbot command control setup
TWITCH_OAUTH_TOKEN=<twitch oauth token here>
NEXT_PUBLIC_TWITCH_CHANNEL_ID=

TWITCH_ALLOWED_USER_ID=<your user id user.uid in your firestore>
TWITCH_MESSAGE_LIMIT=500
```

You can run news stories via mediastack, program episodes with control codes in the prompt to adjust settings per episode.

Sharing the stories via a Manga reader is now possible. Example [Groovy Board](http://gaib.groovy.org/QH2CMQlUgrHDvfTR8yOt) you can run an AI social media site and feed with the main board /board allows you to view all the stories users have shared.

You can mostly run without firebase and other services, yet it is not very fun :). With firebase and Google services Groovy becomes a fully interactive assistant and sensory output capable AI entity.

Contributions welcome, please send PRs for any improvements you can help make in Groovy. Looking for developers to help push Groovy to become an engine for streaming your stuff, so anyone can share and monetize their art through Groovy!!! Rebranding it for yourself could be done, contact me if you want customizations beyond open source / public contributions / efforts.

## Key Features

- **Fan Fiction Episode Script Generation**: Groovy can generate a series of story episodes for a "season" set, maintaining context throughout.
- **Question Iteration**: Groovy allows a chain of questions and answers following an initial question.
- **Multilingual Speech and Listening**: Enabled by `GOOGLE_APPLICATION_CREDENTIALS` and `GOOGLE_APPLICATION_CREDENTIALS_JSON`, Groovy supports multilingual speech and can convert spoken language into written text. Users can speak into Groovy for voice command control.
- **Chat Context and Episodic Story Context**: These features enable the creation of story arcs.
- **Configurable Personalities**: Groovy can adopt many modes.
- **Story or Question Mode**: Each personality can operate in either story or question mode.
- **Multilingual Subtitles**: Groovy provides multilingual subtitles of Anime quality.
- **Meme Images**: Groovy generates meme images for each subtitle line, enabling visual storytelling via memes.
- **Image Generation and Fetching**: Enabled by `PEXELS_API_KEY`, `DEEPAI_API_KEY`, `DEEPAI_GRID_SIZE`, `DEEPAI_WIDTH`, and `DEEPAI_HEIGHT`, Groovy can fetch images from Pexels and generate images from text using DeepAI. Also Groovy supports Dall-E and GetImg.AI too, you can use either of the 3 variations of image generation.
- **Image Saving**: Enabled by `NEXT_PUBLIC_ENABLE_IMAGE_SAVING` and `GCS_BUCKET_NAME`, Groovy can save generated images to Google Cloud Storage.
- **Control**: Users can control the number of maxTokens, documents used, and the number of episodes created on a topic.
- **Transcript View**: Users can copy/paste the markup output.
- **Anime View Mode or Basic Terminal Output Mode**: Users can choose between these two modes.
- **Full-Screen View**: This feature allows display of only the images and subtitles or terminal output on TVs etc. casting.
- **User Authentication and Token Tracking**: Enabled by `FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_REGION`, Groovy can authenticate users via Firebase and track tokens per user [Firebase setup](README_FIREBASE.md).
- **Stripe Payments and Token Allocation**: Enabled by `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PRICE_ID`, `NEXT_PUBLIC_PREMIUM_TOKEN_BALANCE` and `NEXT_PUBLIC_FREE_TOKEN_START`, Groovy supports Stripe payments for premium users with token allocation per month. Free user tokens can be configured.
- **News Feed via Mediastack**: Enabled by `MEDIASTACK_API_KEY`, Groovy supports newsfeed input for generation of the output.
- **OpenAI Model Configuration**: Enabled by `MODEL_NAME`, `GPT_MAX_TOKENS`, `PRESENCE_PENALTY`, `FREQUENCY_PENALTY`, `TEMPERATURE_STORY`, and `TEMPERATURE_QUESTION`, Groovy can configure the behavior of the OpenAI model it uses.
- **Debug Mode**: Enabled by `DEBUG`, Groovy can run in debug mode for troubleshooting and development purposes.
- **Docker Cloudrun**: Able to handle setup in cloudrun out of the box with documentation and configuration [Cloudrun setup](CLOUDRUN.md).
- **Twitch Chatbot**: Connect to a twitch channel IRC based chatbot for twitch channel, taking question/story requests and responding with generated summary and plays it back automatically. Requires Twitch OAuth token and setup, then can run pnpm run twitch that uses scripts/twitchChat.ts to recieve and send messages back and forth. You have to have firebase/firestore for this feature, that is where the chat messages are stored to bridge the client with the twitch server.

## AI Bot Modes

Groovy can adopt various modes, including:

- **Analyst**: As an expert analyst, Groovy can analyze any information given and report back the answers or related stories.
- **Anime**: Groovy creates a screenplay for an Anime Episode using the story title and context as inspiration. It formats the story as a screenplay script for an Anime TV show from Japan in markdown format with the story title and script body.
- **BookOfMormon**: Groovy adopts the persona of a prophet from the Book of Mormon.
- **Buddhist**: Groovy adopts the persona of an incarnate Bodhisattva from the Dhammapada and embodies all the various characters from the Buddhist scriptures.
- **Cactus**: Groovy adopts the persona of a cactus shaman from Peru who has a deep connection to the earth and plant spirits.
- **ChatPDF**: Groovy uses the given pieces of context to answer the question at the end.
- **Christian**: Groovy adopts the persona of Jesus from the New Testament.
- **CondensedNews**: Groovy summarizes news stories into a one to three sentence quick blurb.
- **Developer**: Groovy acts as an expert software developer.
- **Engineer**: Groovy designs software architecture as an expert architecture engineer.
- **HappyFunNews**: As a joyful news reporter, Groovy presents news stories with a fun and silly perspective, making comedy out of the world.
- **Hebrew**: Groovy adopts the persona of Abraham from the Torah.
- **Interviewer**: Groovy conducts interviews for a software engineer position, focusing on video engineering.
- **Muslim**: Groovy adopts the persona of Mohammed from the Quran.
- **NewsReporter**: As a news reporter, Groovy presents stories in an informative way, analyzing them when possible.
- **Poet**: Groovy generates professional-quality poetry.
- **SongWriter**: Groovy generates songs with guitar chords inline with the lyrics.
- **Stories**: Groovy creates a screenplay for an Episode using the story title and context as inspiration. It formats the story as a screenplay script for a TV show in markdown format with the story title and script body.
- **Therapist**: Groovy acts as an expert therapist with a PHD in psychology, providing advice and guidance.
- **Vedic**: Groovy adopts the persona of a Vedic sage from the Upanishads or other various characters from the Vedic scriptures.
- **VideoEngineer**: Groovy acts as an expert in video engineering in all aspects for media capture, transcoding, streaming CDNs, and any related concepts.


![Groovy Frontend](https://storage.googleapis.com/gaib/gaib/gaib_multimodal_overview.png)


![Groovy News](https://storage.googleapis.com/gaib/gaib/gaib_news_fetch.png)

## Tech Stack

The tech stack used includes LangChain, Pinecone, TypeScript, OpenAI, and Next.js. LangChain is a framework that makes it easier to build scalable AI/LLM apps and chatbots. Pinecone is a vector store for storing embeddings and your PDF in text to later retrieve similar docs.

## Setup

To set up the Groovy project, follow these steps:

1. **Clone the repository**: Use the command `git clone https://github.com/groovybits/gaib.git` to clone the repository to your local machine.
2. **Install the dependencies**: Navigate to the project directory and run `yarn install` to install all the necessary dependencies.
3. **Set up your `.env` file**:
   - Copy `.env.example` into `.env`. Your `.env` file should look like this: [Example](https://github.com/groovybits/gaib/blob/main/.env.example)
   - Visit [OpenAI](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) to retrieve API keys and insert them into your `.env` file as `OPENAI_API_KEY`.
   - Visit [Pinecone](https://pinecone.io/) to create and retrieve your API keys, and also retrieve your environment and index name from the dashboard. Insert these into your `.env` file as `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, and `PINECONE_INDEX_NAME`.
   - Visit [Mediastack](https://mediastack.com/) to retrieve your API key and insert it into your `.env` file as `MEDIASTACK_API_KEY`.
   - Visit [Pexels](https://www.pexels.com/api/) to retrieve your API key and insert it into your `.env` file as `PEXELS_API_KEY`.
   - Visit [DeepAI](https://deepai.org/) to retrieve your API key and insert it into your `.env` file as `DEEPAI_API_KEY`.
   - Visit [GetImgAI](https://getimg.ai/) to retrieve your API key and insert it into your `.env` file as `GETIMG_API_KEY`.
   - Visit [Google Cloud](https://cloud.google.com/) to enable the Speech-to-Text API and download the JSON key file. Insert the path to this file into your `.env` file as `GOOGLE_APPLICATION_CREDENTIALS` or the contents of the file as `GOOGLE_APPLICATION_CREDENTIALS_JSON`.
   - Visit [Google Cloud](https://cloud.google.com/) to enable the Cloud Translation API and retrieve your API key. Insert this key into your `.env` file as `GOOGLE_TRANSLATE_API_KEY`.
   - Visit [Firebase](https://firebase.google.com/) to set up a project and retrieve your API key, Auth domain, App ID, Storage bucket, Messaging sender ID, and Project ID. Insert these into your `.env` file as `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
   - Visit [Stripe](https://stripe.com/) to retrieve your public key, secret key, and price ID. Insert these into your `.env` file as `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_STRIPE_PRICE_ID`.

4. **Set up the `PINECONE_NAME_SPACE` in `.env`**: This should be a default `namespace` where you'd like to store your embeddings on Pinecone. When you run `yarn run ingest <namespace> <document>` you can use different namespaces. This namespace will later be used for queries and retrieval. The different personalities check if the namespace exists for their names too, so they can focus on a set of data.
5. **Configure the OpenAI SDK**: In `utils/makechain.ts`, you'll find the main
OpenAI SDK code. Change `modelName` in `new OpenAIChat` to `gpt-3.5-turbo` if you don't have access to `gpt-4`. Please verify outside this repo that you have access to `gpt-4`, otherwise the application will not work with it. There are personalities setup in [personalityPrompts.ts](https://github.com/groovybits/gaib/blob/main/config/personalityPrompts.ts)
6. **Set up Google Cloud Storage**: If you plan to enable image saving, you'll need to set up a Google Cloud Storage bucket and provide its name as `GCS_BUCKET_NAME` in your `.env` file.
7. **Set up Firebase for user tracking**: If you plan to track tokens per user, you'll need to set up a Firebase project and provide the necessary credentials in your `.env` file.
8. **Set up Stripe for payments**: If you plan to support Stripe payments for premium users with token allocation per month, you'll need to set up a Stripe account and provide the necessary credentials in your `.env` file.
9. **Set up Mediastack for newsfeed input**: If you plan to support newsfeed input for generation of the output, you'll need to set up a Mediastack account and provide the necessary credentials in your `.env` file.
10. **Set up image generation and fetching**: If you plan to use Pexels for image fetching or DeepAI for image generation, you'll need to set up accounts with these services and provide the necessary credentials in your `.env` file.
11. **Configure the OpenAI model**: You can configure the behavior of the OpenAI model Groovy uses by setting the `MODEL_NAME`, `GPT_MAX_TOKENS`, `PRESENCE_PENALTY`, `FREQUENCY_PENALTY`, `TEMPERATURE_STORY`, and `TEMPERATURE_QUESTION` variables in your `.env` file.
12. **Set up debug mode**: If you plan to run Groovy in debug mode for troubleshooting and development purposes, you'll need to set `DEBUG` to `true` in your `.env` file.

Remember to replace all placeholder values in the `.env` file with your actual keys and IDs. After you've set up your `.env` file, you're ready to run Groovy!

## Environment Variables

Environment Variables
The Groovy project uses several environment variables for configuration. These are set in the .env file in the root of the project. Here's a brief explanation of each:

- `OPENAI_API_KEY`: This is your OpenAI API key. It's used to authenticate with the OpenAI API.
- `PINECONE_API_KEY`: This is your Pinecone API key. It's used to authenticate with the Pinecone API.
- `PINECONE_ENVIRONMENT`: This is the Pinecone environment name. It should match the one on your Pinecone dashboard.
- `PINECONE_INDEX_NAME`: This is the Pinecone index name. It should match the one on your Pinecone dashboard.
- `PINECONE_NAME_SPACE`: This is the namespace where you'd like to store your embeddings on Pinecone when you run `yarn run ingest`.
- `OTHER_PINECONE_NAMESPACES`: These are other namespaces where you'd like to store your embeddings on Pinecone.
- `MEDIASTACK_API_KEY`: This is your Mediastack API key. It's used to fetch newsfeed input for generation of the output.
- `GOOGLE_APPLICATION_CREDENTIALS`: This is the path to your Google Cloud Platform JSON key file. It's used to authenticate with Google Cloud Speech-to-Text API.
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: This is the contents of your Google Cloud Platform JSON key file. It's an alternative to `GOOGLE_APPLICATION_CREDENTIALS`.
- `GOOGLE_TRANSLATE_API_KEY`: This is your Google Cloud Translation API key. It's used to authenticate with Google Cloud Translation API.
- `PEXELS_API_KEY`: This is your Pexels API key. It's used to fetch images from Pexels.
- `DEEPAI_API_KEY`: This is your DeepAI API key. It's used to generate images from text using DeepAI.
- `DEEPAI_GRID_SIZE`, `DEEPAI_WIDTH`, `DEEPAI_HEIGHT`: These are settings for the DeepAI image generation.
- `NEXT_PUBLIC_IMAGE_SERVICE`: This is the service to use for image generation. It can be either `pexels` or `deepai`.
- `NEXT_PUBLIC_ENABLE_IMAGE_SAVING`: This is a boolean value that determines whether to save generated images.
- `GCS_BUCKET_NAME`: This is the name of your Google Cloud Storage bucket where images are saved.
- `NEXT_PUBLIC_IMAGE_GENERATION_PROMPT`: This is the prompt to use for image generation.
- `FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_REGION`: These are your Firebase project settings. They're used to authenticate with Firebase.
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`: These are your Stripe API keys. They're used to authenticate with Stripe for payments.
- `NEXT_PUBLIC_STRIPE_PRICE_ID`: This is the ID of the Stripe price object for the subscription plan you want to use.
- `NEXT_PUBLIC_PREMIUM_TOKEN_BALANCE`: This is the number of tokens allocated to premium users.
- `NEXT_PUBLIC_FREE_TOKEN_START`: This is the number of tokens allocated to free users.
- `NEXT_PUBLIC_GAIB_IMAGE_DIRECTORY_URL`: This is the URL of the base directory where GAIB images are stored.
- `NEXT_PUBLIC_GAIB_IMAGE_MAX_NUMBER`: This is the maximum number of Groovy images to use.
- `NEXT_PUBLIC_GAIB_DEFAULT_IMAGE`: This is the default Groovy image to use.
- `MODEL_NAME`: This is the name of the OpenAI model you're using.
- `GPT_MAX_TOKENS`: This is the maximum number of tokens that the GPT model can generate in a single response.
- `PRESENCE_PENALTY`: This is the penalty for new tokens that are not present in the original prompt.
- `FREQUENCY_PENALTY`: This is the penalty for tokens that are generated too frequently.
- `TEMPERATURE_STORY`: This is the temperature setting for story generation. Higher values make the output more random, while lower values make it more deterministic.
- `TEMPERATURE_QUESTION`: This is the temperature setting for question generation. Higher values make the output more random, while lower values make it more deterministic.
- `HOST`: This is the host address where the application is running.
- `PORT`: This is the port where the application is running.
- `DEBUG`: This is a boolean value that determines whether to run the application in debug mode.

Please note that you need to copy .env.example to .env and replace the placeholders in the .env file with your actual keys and IDs.

## Convert your PDF files to embeddings

This repo can load multiple PDF files:

1. Inside the `docs` folder, add your PDF files or folders containing PDF files.
2. Run the script `npm run ingest <namespace> <filename>` to 'ingest' and embed your doc. If you run into errors, troubleshoot below. I recommened doing 1 at a time for confirmation each works properly. Some documents can fail and break the processing of all of the docs.
3. Check the Pinecone dashboard to verify your namespace and vectors have been added.

## Run the app

Once you've verified that the embeddings and content have been successfully added to your Pinecone, you can run the app `yarn run dev` to launch the local dev environment, and then type a question in the chat interface at https://localhost:3000. For production you would use `yarn start` run Groovy. There is a Dockerfile which can help avoid running on your local system.

## Docker and Cloud Build

The project includes a Dockerfile for building a Docker image and a cloudbuild.yaml file for Google Cloud Build. The Dockerfile sets up a Node.js environment, installs the project dependencies, and sets up the necessary environment variables. The cloudbuild.yaml file is used by Google Cloud Build to build a Docker image and push it to the Google Container Registry.

### Dockerfile

The Dockerfile is a text file that contains all the commands a user could call on the command line to assemble an image. It is used to automate the deployment of applications inside lightweight, portable, self-sufficient containers.

In the case of Groovy, the Dockerfile sets up a Node.js environment, installs the project dependencies, and sets up the necessary environment variables.

### cloudbuild.yaml

The cloudbuild.yaml file is a configuration file that defines how Cloud Build should build your application. It specifies a list of build steps, where each build step is run in a Docker container.

In the case of Groovy, the cloudbuild.yaml file is used to build a Docker image and push it to the Google Container Registry. It specifies the Docker build command and passes in the necessary build arguments, which include the environment variables required by Groovy.

Here is a brief overview of the steps defined in the cloudbuild.yaml file:

The Docker build command is run with the -t option to tag the image with the name gcr.io/$PROJECT_ID/github.com/groovybits/gaib:$COMMIT_SHA.

The --build-arg option is used to pass in the environment variables as build arguments. Each environment variable is prefixed with an underscore (_). These environment variables are used to configure Groovy and include keys for various services such as OpenAI, Pinecone, Firebase, Stripe, and others.

The built image is then pushed to the Google Container Registry.

### Deploying to Google Cloud Run

Once you have your Dockerfile and cloudbuild.yaml file set up, you can deploy Groovy to Google Cloud Run. Google Cloud Run is a managed platform that enables you to run stateless containers that are invocable via HTTP requests.

To deploy Groovy to Google Cloud Run, you would typically follow these steps:

Submit your build to Google Cloud Build using the gcloud builds submit --config cloudbuild.yaml . command. This command tells Google Cloud Build to start a new build using the configuration specified in cloudbuild.yaml.

After the build completes, deploy the Docker image to Google Cloud Run using the gcloud run deploy --image gcr.io/PROJECT-ID/IMAGE --platform managed command. Replace PROJECT-ID with your Google Cloud project ID and IMAGE with the name of the Docker image.

During the deployment, you'll be asked to specify the service name, region, and whether to allow unauthenticated invocations. After the deployment completes, you'll see an output with the public URL of your deployed application.

Remember to replace all placeholder values with your actual values. After you've deployed your application, you're ready to use Groovy on Google Cloud Run!

### Full Cloudrun documentation [Cloudrun setup](CLOUDRUN.md)

## Troubleshooting

This project is moving fast and furious. If you have any questions, please ask by filing a ticket on GitHub, and help will be provided. Contributions are even better!

For general errors, make sure you're running the latest Node version, try a different PDF or convert your PDF to text first, `console.log` the `env` variables to make sure they are exposed, and ensure you're using the same versions of LangChain and Pinecone as this repo.

For Pinecone errors, ensure your Pinecone dashboard `environment` and `index` match the ones in the `pinecone.ts` and `.env` files, check that you've set the vector dimensions to `1536`, and ensure your Pinecone namespace is in lowercase. Pinecone indexes of users on the Starter (free) plan are deleted after 7 days of inactivity. To prevent this, send an API request to Pinecone to reset the counter before 7 days. If all else fails, retry from scratch with a new Pinecone project, index, and cloned repo.

## Conclusion

The Groovy project is a powerful, multilingual AI chatbot that can be used for a variety of purposes. It is built using modern technologies and is highly customizable. Whether you're looking to generate fan fiction, answer questions in a specific domain, or create a chatbot with a unique personality, Groovy has you covered.

## Credit

This project is a fork and customization of "GPT-4 & LangChain - Create a ChatGPT Chatbot for Your PDF Files". You can find the original project [here](https://github.com/mayooear/gpt4-pdf-chatbot-langchain). This fork has refactored the base chatbot into something completely different for more multi-modal forms of output and control over the form of transformation for GPT output.

© 2023 Chris Kennedy, The Groovy Organization
