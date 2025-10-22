// src/components/pages/interview/EnvironmentCheck.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared/Button';

export const EnvironmentCheck: React.FC = () => {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [videoConnected, setVideoConnected] = useState(false);
  const [micConnected, setMicConnected] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [testAudioURL, setTestAudioURL] = useState<string>("");

  useEffect(() => {
    const startCameraAndMic = async () => {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }
        setVideoConnected(true);
      } catch (e) {
        console.error('카메라 연결 실패', e);
        setVideoConnected(false);
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = audioStream;
        setMicConnected(true);

        const context = new AudioContext();
        audioContextRef.current = context;
        const source = context.createMediaStreamSource(audioStream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
          const percent = Math.min(100, (avg / 255) * 100);
          setMicLevel(percent);
          requestAnimationFrame(draw);
        };
        draw();
      } catch (e) {
        console.error('마이크 연결 실패', e);
        setMicConnected(false);
      }
    };

    startCameraAndMic();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (testAudioURL) {
        URL.revokeObjectURL(testAudioURL);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMicTest = async () => {
    if (!micConnected || !micStreamRef.current) {
      alert('마이크가 연결되지 않았습니다.');
      return;
    }

    try {
      const recorder = new MediaRecorder(micStreamRef.current);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setTestAudioURL((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return url;
        });
      };

      recorder.start();
      setTimeout(() => {
        recorder.stop();
      }, 3000);
    } catch (e) {
      console.error('마이크 녹음 테스트 실패', e);
      alert('마이크 녹음 테스트 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            환경 점검
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            카메라와 마이크가 정상적으로 동작하는지 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white shadow rounded-lg p-6">
          <div>
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {videoConnected ? '카메라 연결됨' : '카메라 연결 실패'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-700">마이크 상태</span>
              {micConnected ? (
                <span className="text-green-600 font-semibold">✔ 연결됨</span>
              ) : (
                <span className="text-red-600 font-semibold">✖ 미연결</span>
              )}
            </div>

            {micConnected && (
              <div className="mb-4">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <div className="text-xs mt-2 text-gray-500">마이크 볼륨 게이지</div>
              </div>
            )}

            <Button onClick={handleMicTest} className="mt-2">
              3초간 마이크 녹음 테스트
            </Button>

            {testAudioURL && (
              <div className="mt-4">
                <audio controls src={testAudioURL} className="w-full">
                  브라우저가 오디오 재생을 지원하지 않습니다.
                </audio>
                <div className="text-xs mt-1 text-gray-500">
                  녹음된 오디오를 재생 중입니다.
                </div>
              </div>
            )}

            <ul className="mt-5 text-sm text-gray-600 list-disc list-inside">
              <li>녹음된 오디오가 나오는지 확인하세요.</li>
              <li>녹음된 소리가 없다면 브라우저/OS 설정 및 장치 연결을 확인하세요.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            이전으로
          </Button>
          <Button
            onClick={() => navigate('/interview/session')}
            disabled={!(videoConnected && micConnected)}
          >
            AI 면접 시작하기
          </Button>
        </div>
      </div>
    </main>
  );
};
