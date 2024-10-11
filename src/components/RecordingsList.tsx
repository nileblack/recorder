import React from 'react';
import { Download } from 'lucide-react';

interface Recording {
  blob: Blob;
  url: string;
  duration: number;
  sampleRate: number;
  timestamp: number;
}

interface RecordingsListProps {
  recordings: Recording[];
  language: 'zh' | 'en';
}

const RecordingsList: React.FC<RecordingsListProps> = ({ recordings, language }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const downloadRecording = (recording: Recording, format: 'wav' | 'webm') => {
    const audioContext = new AudioContext();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        recording.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      const wavBlob = audioBufferToWav(renderedBuffer);
      const blobToDownload = format === 'wav' ? wavBlob : recording.blob;
      const url = URL.createObjectURL(blobToDownload);
      const a = document.createElement('a');
      a.style.display = 'none';
      const formattedDate = formatDate(recording.timestamp).replace(/[/:]/g, '-').replace(/,/g, '').replace(/ /g, '_');
      a.href = url;
      a.download = `recording_${formattedDate}_${recording.sampleRate}Hz.${format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    };

    fileReader.readAsArrayBuffer(recording.blob);
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const interleaved = new Float32Array(buffer.length * buffer.numberOfChannels);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        interleaved[i * buffer.numberOfChannels + channel] = channelData[i];
      }
    }

    const wavBuffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 4, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    const volume = 1;
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      view.setInt16(offset, interleaved[i] * (0x7FFF * volume), true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const t = (key: string) => {
    const translations: { [key: string]: { zh: string, en: string } } = {
      recordingHistory: { zh: '录音历史', en: 'Recording History' },
      noRecordings: { zh: '暂无录音', en: 'No recordings yet' },
      recording: { zh: '录音', en: 'Recording' },
      duration: { zh: '时长', en: 'Duration' },
      sampleRate: { zh: '采样率', en: 'Sample Rate' },
    };
    return translations[key][language];
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-700">{t('recordingHistory')}</h2>
      {recordings.length === 0 ? (
        <p className="text-gray-500 text-center">{t('noRecordings')}</p>
      ) : (
        <ul className="space-y-4">
          {recordings.map((recording, index) => (
            <li key={index} className="bg-indigo-50 p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-indigo-700">{t('recording')} {index + 1}</p>
                  <p className="text-sm text-indigo-600">
                    {t('duration')}: {formatTime(recording.duration)} | {t('sampleRate')}: {recording.sampleRate} Hz
                  </p>
                  <p className="text-xs text-indigo-400">{formatDate(recording.timestamp)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadRecording(recording, 'wav')}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-full text-sm flex items-center transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    <Download size={16} className="mr-1" /> WAV
                  </button>
                  <button
                    onClick={() => downloadRecording(recording, 'webm')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-full text-sm flex items-center transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    <Download size={16} className="mr-1" /> WebM
                  </button>
                </div>
              </div>
              <audio controls src={recording.url} className="mt-3 w-full" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecordingsList;