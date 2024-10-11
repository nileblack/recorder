import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Settings, Globe } from 'lucide-react';
import RecordingsList from './components/RecordingsList';
import SettingsModal from './components/SettingsModal';

interface Recording {
  blob: Blob;
  url: string;
  duration: number;
  sampleRate: number;
  timestamp: number;
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [duration, setDuration] = useState(0);
  const [sampleRate, setSampleRate] = useState(44100);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordings((prev) => [
          ...prev,
          { blob: audioBlob, url: audioUrl, duration, sampleRate, timestamp: Date.now() },
        ]);
        setDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key: string) => {
    const translations: { [key: string]: { zh: string, en: string } } = {
      title: { zh: '录音机', en: 'Voice Recorder' },
      startRecording: { zh: '开始录音', en: 'Start Recording' },
      stopRecording: { zh: '停止录音', en: 'Stop Recording' },
      settings: { zh: '设置', en: 'Settings' },
      currentSampleRate: { zh: '当前采样率', en: 'Current Sample Rate' },
    };
    return translations[key][language];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700">{t('title')}</h1>
          <button
            onClick={toggleLanguage}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-2 px-3 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Globe size={20} className="mr-1" /> {language === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className="text-5xl font-mono text-indigo-600 mb-2">{formatTime(duration)}</div>
          <div className="text-sm text-indigo-500">{t('currentSampleRate')}: {sampleRate} Hz</div>
        </div>
        <div className="flex justify-center space-x-4 mb-8">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
            >
              <Mic className="mr-2" size={24} /> {t('startRecording')}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
            >
              <StopCircle className="mr-2" size={24} /> {t('stopRecording')}
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Settings className="mr-2" size={24} /> {t('settings')}
          </button>
        </div>
        <RecordingsList recordings={recordings} language={language} />
      </div>
      {showSettings && (
        <SettingsModal
          sampleRate={sampleRate}
          onSampleRateChange={setSampleRate}
          onClose={() => setShowSettings(false)}
          language={language}
        />
      )}
    </div>
  );
}

export default App;