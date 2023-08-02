import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import Link from 'next/link';
import copy from 'copy-to-clipboard';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import PexelsCredit from '@/components/PexelsCredit';
import { ParsedUrlQuery } from 'querystring';
import Layout from '@/components/Layout';
import { Story } from '@/types/story'; // Import the new Story type
import { useSpeakText } from '@/utils/speakText';

const adSenseCode = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ? process.env.NEXT_PUBLIC_ADSENSE_PUB_ID : '';

const Global: NextPage<{ initialStory: Story | null }> = ({ initialStory }) => {
  const router = useRouter();
  const { storyId }: ParsedUrlQuery = router.query;
  const [selectedStory, setSelectedStory] = useState(initialStory);
  const [currentScene, setCurrentScene] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [leftHover, setLeftHover] = useState(false);
  const [rightHover, setRightHover] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0); // Add this line to keep track of the current sentence
  const { stopSpeaking, speakAudioUrl } = useSpeakText();
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoPage, setAutoPage] = useState(true);

  useEffect(() => {
    if (storyId && typeof storyId === 'string') {
      const fetchStory = async () => {
        // Fetch the story JSON data from the Google Cloud Storage bucket
        const response = await fetch(`https://storage.googleapis.com/gaib/stories/${storyId}/data.json`);
        if (response.ok) {
          const storyData: Story = await response.json();
          setSelectedStory(storyData);
        }
      };
      fetchStory();
    }
  }, [storyId]);

  const stopAutoPaging = () => {
    if (autoPage) {
      setAutoPage(false);
    } else {
      setAutoPage(true);
    }
  };

  const stopSpeakingText = () => {
    if (autoSpeak) {
      setAutoSpeak(false);
      stopSpeaking(); // Call the stopSpeaking function from useSpeakText
    } else {
      setAutoSpeak(true);
      if (autoPage) {
        nextPage();
      }
    }
  };

  // Modify the handleShareClick function to stop auto-paging and speaking when the link is clicked
  const handleShareClick = (storyId: string | string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    copy(`${baseUrl}/${storyId}`);
    stopAutoPaging();
    stopSpeakingText();
    alert(`Copied ${baseUrl}/${storyId} to clipboard!`);
  };

  const handleFacebookShareClick = (storyId: string | string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${baseUrl}/${storyId}`)}`, '_blank');
  };

  useEffect(() => {
    if (autoPage) {
      nextPage();
    }
  }, [currentScene, currentSentence]);

  const nextPage = async () => {
    if (selectedStory) {
      if (selectedStory.scenes) {
        let spoke = false;
        let spokenText = '';

        // Speak the text if autoSpeak is enabled and the current sentence has an audio file
        if (autoSpeak && selectedStory.scenes
          && selectedStory.scenes[currentScene]
          && selectedStory.scenes[currentScene].sentences
          && selectedStory.scenes[currentScene].sentences[currentSentence]
          && selectedStory.scenes[currentScene].sentences[currentSentence].audioFile)
        {
          await speakAudioUrl(selectedStory.scenes[currentScene].sentences[currentSentence].audioFile);

          if (selectedStory.scenes[currentScene].sentences[currentSentence].text) {
            spokenText = selectedStory.scenes[currentScene].sentences[currentSentence].text;
          } else {
            spokenText = selectedStory.prompt;
          }
          spoke = true;
        }

        // Sleep for the length of the spoken text if autoPage is enabled and the text was spoken
        if (autoPage && !spoke) {
          // sleep time of the spoken text would take to read
          await new Promise((resolve) => setTimeout(resolve, spokenText.length * 100));
        }

        // Move to the next sentence if there is one, otherwise move to the next scene
        if (currentSentence < selectedStory.scenes[currentScene].sentences.length - 1) {
          setCurrentSentence(prevSentence => prevSentence + 1);
        } else if (currentScene < selectedStory.scenes.length - 1) {
          setCurrentScene(prevScene => prevScene + 1);
          setCurrentSentence(0); // Reset sentence index when moving to the next scene
        }
      }
    }
  };

  const previousPage = async () => {
    if (selectedStory) {
      if (selectedStory.scenes) {
        if (currentSentence > 0) {
          setCurrentSentence(currentSentence - 1);
        } else if (currentScene > 0) {
          setCurrentScene(currentScene - 1);
          setCurrentSentence(selectedStory.scenes[currentScene - 1].sentences.length - 1); // Set sentence index to the last sentence of the previous scene
        }
        if (autoSpeak && selectedStory.scenes
          && selectedStory.scenes[currentScene]
          && selectedStory.scenes[currentScene].sentences
          && selectedStory.scenes[currentScene].sentences[currentSentence]
          && selectedStory.scenes[currentScene].sentences[currentSentence].audioFile)
        {
          await speakAudioUrl(selectedStory.scenes[currentScene].sentences[currentSentence].audioFile);
        }
      }
    }
  };

  const handleLinkedInShareClick = (storyId: string | string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${baseUrl}/${storyId}`)}`, '_blank');
  };

  const handleTwitterShareClick = (storyId: string | string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${baseUrl}/${storyId}`)}`, '_blank');
  };

  // toggle the full screen state
  const toggleFullScreen = () => {
    const readerImageContainer = document.querySelector(`.${styles.readerImageContainer}`);
    const image = document.querySelector(`.${styles.generatedImage} img`);

    if (!document.fullscreenElement) {
      if (readerImageContainer?.requestFullscreen) {
        readerImageContainer.requestFullscreen();
        image?.classList.add(styles.readerFullScreenImage);
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        image?.classList.remove(styles.readerFullScreenImage);
        setIsFullScreen(false);
      }
    }
  };

  if (selectedStory) {
    const currentSceneData = selectedStory.scenes ? selectedStory.scenes[currentScene] : null; // Get current scene data
    const imageUrl = currentSceneData ? currentSceneData.imageUrl : selectedStory.imageUrl; // Use image from the current scene

    // Get the text from the current sentence in the current scene
    let sentenceText = '';
    
    if (currentSceneData &&
      currentSceneData.sentences &&
      currentSceneData && currentSceneData.sentences[currentSentence] &&
      currentSceneData.sentences[currentSentence].text &&
      currentSceneData.sentences[currentSentence].text) {
      sentenceText = currentSceneData.sentences[currentSentence].text;
    } else {
      sentenceText = selectedStory.prompt;
    }

    return (
      <>
        <Head>
          <title>{selectedStory.title}</title>
          <meta name="description" content={sentenceText} />
          <meta property="og:title" content={selectedStory.title} />
          <meta property="og:description" content={sentenceText} />
          <meta property="og:image" content={selectedStory.imageUrl} />
          <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/${storyId}`} />
          <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseCode}`} crossOrigin="anonymous"></script>
        </Head>
        <Layout>
          <div className="mx-auto flex flex-col gap-4 bg-#FFCC33">
            <div className={styles.main}>
              <div className={styles.cloud}>
                <div
                  className={styles.readerImageContainer}
                  style={{
                    position: isFullScreen ? "fixed" : "relative",
                    top: isFullScreen ? 0 : "auto",
                    left: isFullScreen ? 0 : "auto",
                    width: isFullScreen ? "auto" : "auto",
                    height: isFullScreen ? "100vh" : "100%",
                    zIndex: isFullScreen ? 1000 : "auto",
                    backgroundColor: isFullScreen ? "black" : "transparent",
                  }}
                >
                  <div className={styles.readerImage}>
                    <button
                      type="button"
                      className={styles.fullscreenButton}
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                      }}
                      onClick={toggleFullScreen}
                    >
                      {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    </button>
                    <img
                      src={imageUrl}
                      alt="Scene"
                    />
                    <div className={isFullScreen ? `${styles.readerFullScreenSubtitle}` : styles.subtitle}>
                      <p>{sentenceText}</p>
                    </div>
                    <>
                      <div
                        style={{
                          position: "absolute",
                          top: "10%", // adjust this value as needed to leave space for the fullscreen button
                          bottom: 0,
                          left: 0,
                          width: "50%", // covers the left half of the image area
                          cursor: "pointer", // changes the cursor to a hand when hovering over the div
                          backgroundColor: leftHover ? "rgba(0, 0, 0, 0.1)" : "transparent",
                        }}
                        onClick={previousPage}
                        onMouseEnter={() => setLeftHover(true)} // set state to true when mouse enters
                        onMouseLeave={() => setLeftHover(false)} // set state to false when mouse leaves                      
                      >
                        <button
                          style={{
                            position: "absolute",
                            top: "65%",
                            left: "90px",
                            transform: "translateY(-65%)",
                          }}
                          className={styles.readerPager}
                        >
                          {/* Previous Page Click left side of screen */}
                        </button>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: "10%", // adjust this value as needed to leave space for the fullscreen button
                          bottom: 0,
                          right: 0,
                          width: "50%", // covers the right half of the image area
                          cursor: "pointer", // changes the cursor to a hand when hovering over the div
                          backgroundColor: rightHover ? "rgba(0, 0, 0, 0.1)" : "transparent",
                        }}
                        onClick={nextPage} // attach the event handler to the div
                        onMouseEnter={() => setRightHover(true)} // set state to true when mouse enters
                        onMouseLeave={() => setRightHover(false)} // set state to false when mouse leaves    
                      >
                        <button
                          style={{
                            position: "absolute",
                            top: "65%",
                            right: "90px",
                            transform: "translateY(-65%)",
                            transition: "background-color 0.3s", // smooth transition
                          }}
                          className={styles.readerPager}
                        >
                          {/* Previous Page Click left side of screen */}
                        </button>
                      </div>
                    </>
                  </div>
                </div>
              </div>
              <Link href="/feed" className={styles.footer}>
                <a>Story Board</a>
              </Link>&nbsp;&nbsp;&nbsp;&nbsp;
              <button className={styles.footer} onClick={() => { storyId && handleShareClick(storyId); stopAutoPaging(); stopSpeakingText(); }}>Copy Link</button>&nbsp;&nbsp;|&nbsp;&nbsp;
              <button className={styles.footer} onClick={() => { storyId && handleFacebookShareClick(storyId); stopAutoPaging(); stopSpeakingText(); }}>Share on Facebook</button>&nbsp;&nbsp;|&nbsp;&nbsp;
              <button className={styles.footer} onClick={() => { storyId && handleLinkedInShareClick(storyId); stopAutoPaging(); stopSpeakingText(); }}>Share on LinkedIn</button>&nbsp;&nbsp;|&nbsp;&nbsp;
              <button className={styles.footer} onClick={() => { storyId && handleTwitterShareClick(storyId); stopAutoPaging(); stopSpeakingText(); }}>Share on Twitter</button>&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <button className={styles.footer} onClick={stopAutoPaging}>{autoPage ? 'Disable Auto-Paging' : 'Enable Auto-Paging'}</button>&nbsp;&nbsp;|&nbsp;&nbsp;
              <button className={styles.footer} onClick={stopSpeakingText}>{autoSpeak ? 'Disable Speaking' : 'Enable Speaking'}</button>
            </div>
            <div className={styles.feedSection}>
              <div className={styles.feed}>
                <Link href="https://twitch.tv/groovyaibot" className={styles.header}>
                  <a>Create a Story</a>
                </Link>
              </div>
              <div className={`${styles.footer} ${styles.center}`}>
                <div className={styles.footerContainer}>
                  <a href="https://groovy.org">Groovy</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                  <a href="https://github.com/groovybits/gaib">Groovy Code</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                  <a href="https://twitch.tv/groovyaibot">Create Story</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                  <a href="https://youtube.com/@groovyaibot">YouTube</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                  <a href="https://facebook.com/groovyorg">Facebook</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return null;
};

Global.getInitialProps = async (ctx: NextPageContext) => {
  const { storyId }: ParsedUrlQuery = ctx.query;
  let initialStory: Story | null = null;

  if (storyId && typeof storyId === 'string') {
    const response = await fetch(`https://storage.googleapis.com/gaib/stories/${storyId}/data.json`);
    if (response.ok) {
      const storyData = await response.json();
      initialStory = { id: storyId, ...storyData };
    }
  }

  return { initialStory };
};

export default Global;
