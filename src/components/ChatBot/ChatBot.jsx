import { useState, useEffect } from "react";
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";
import "./ChatBot.css";
import { FaMicrophone, FaStopCircle } from "react-icons/fa";

const Mp3Recorder = new MicRecorder({ bitrate: 128 });

function ChatBot() {
  const [input, setInput] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setIsBlocked(false))
      .catch(() => setIsBlocked(true));
  }, []);

  const startRecording = () => {
    if (isBlocked) {
      console.log("Permission Denied");
    } else {
      Mp3Recorder.start()
        .then(() => setIsRecording(true))
        .catch((e) => console.log(e));
    }
  };

  const stopRecording = async () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(async ([buffer, blob]) => {
        const blobURL = URL.createObjectURL(blob);
        setBlobURL(blobURL);
        setIsRecording(false);

        setIsTranscribing(true);
        const formData = new FormData();
        const audioBlob = await fetch(blobURL).then((res) => res.blob());
        formData.append("audio_file", audioBlob, "audio.mp3");

        try {
          const response = await axios.post(
            "http://localhost:8000/audio",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          const { transcription } = response.data;
          console.log(transcription);
          setMessages([
            ...messages,
            { type: "transcription", content: transcription },
          ]);
          handleBotResponse(transcription);
          console.log("Transcription successful");
        } catch (error) {
          console.error("Upload and transcribe error", error);
        } finally {
          setIsTranscribing(false);
        }
      })
      .catch((e) => console.log(e));
  };

  const handleSendMessage = () => {
    setMessages((prevMessage) => [
      ...prevMessage,
      { type: "user", content: input },
    ]);
    handleBotResponse(input);
    setInput("");
  };

  const handleBotResponse = async (message) => {
    setIsLoading(true);
    try {
      const createdAt = new Date().toISOString();
      const responseBot = await axios.post(
        "http://localhost:8000/question",
        { text: message, createdAt },
        { headers: { "Content-Type": "application/json" } }
      );

      const { relevant_answer } = responseBot.data;
      speakResponse(relevant_answer); // Speak the bot's response
    } catch (error) {
      console.error("Error fetching bot response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (message) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/text",
        { text: message[0] },
        {
          responseType: "json",
        }
      );

      const { base64_audio } = response.data;

      //decode the base64 audio data
      const audioData = atob(base64_audio);

      //convert the audio data to a Uint8Array
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      //create a blob from the Uint8array
      const audioBlob = new Blob([audioArray], { type: "audio/wav" });
      //create a URL Object for the blob
      const audioURL = URL.createObjectURL(audioBlob);
      const messageObject = {
        type: "bot",
        content: [
          { type: "text", value: message },
          { type: "audio", value: audioURL },
        ],
      };
      setMessages((prevMessage) => [...prevMessage, messageObject]);
    } catch (error) {
      console.error("Error in TTS API call", error);
    }
  };

  return (
    <div className="chatBot">
      <div className="container-text">
        {messages.map((message, index) => (
          <div className={`user ${message.type}`} key={index}>
            {message.type === "user" || message.type === "transcription" ? (
              <div className="bubble-user">{message.content}</div>
            ) : (
              <div className="bubble-bot">
                {message.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.type === "text" && <p>{item.value}</p>}
                    {item.type === "audio" && (
                      <audio controls autoPlay={true} src={item.value}></audio>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <div className="form-chat-container">
          <input
            type="text"
            className="form-chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a Message"
          />
          <button
            type="submit"
            className="button-send"
            onClick={handleSendMessage}
          >
            Send
          </button>
          <div className="recorder">
            {isRecording ? (
              <button
                className="stopRecord"
                onClick={() => {
                  stopRecording();
                }}
                disabled={!isRecording}
              >
                <FaStopCircle />
              </button>
            ) : (
              <button
                className="startRecord"
                onClick={startRecording}
                disabled={isRecording || isTranscribing}
              >
                <FaMicrophone />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
