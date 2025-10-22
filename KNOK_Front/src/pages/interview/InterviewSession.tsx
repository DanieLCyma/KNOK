import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/shared/Button";
import {
  usePostureTracking,
  resetPostureBaseline,
} from "../../hooks/usePostureTracking";
import { encodeWAV } from "../../utils/encodeWAV";
import { useAuth } from "../../contexts/AuthContext";
import { sleep } from "@/utils/sleep";

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  audio_url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MAX_ANSWER_DURATION = 90;
const S3_BASE_URL = "https://knok-tts.s3.ap-northeast-2.amazonaws.com/";

export const InterviewSession = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const resumeRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionVideoChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>("");
  const interviewStartRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);

  const auth = useAuth();
  const videoIdRef = useRef(
    `interview_${auth.userEmail || "anonymous"}_${Date.now()}`
  );
  const videoId = videoIdRef.current;

  const [micConnected, setMicConnected] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [recordTime, setRecordTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"쉬움" | "중간" | "어려움">(
    "중간"
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const { countsRef, segmentsRef } = usePostureTracking(
    videoRef,
    videoId,
    questionStartTimeRef.current
  );

  // Float32 PCM → Int16 PCM 변환
  const convertFloat32ToInt16 = (buffer: Float32Array): Uint8Array => {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Uint8Array(result.buffer);
  };

  useEffect(() => {
    if (isInterviewActive && isRecording && !isPreparing && questions[qIdx]) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      recordTimerRef.current = window.setInterval(() => {
        setRecordTime((prev) => Math.min(prev + 1, MAX_ANSWER_DURATION));
      }, 1000);

      timeoutRef.current = window.setTimeout(async () => {
        clearInterval(recordTimerRef.current!);
        await stopRecording();
        handleNext();
      }, MAX_ANSWER_DURATION * 1000);
    }

    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isInterviewActive, isRecording, isPreparing, qIdx, questions]);

  // 초기 카메라/마이크 셋업
  useEffect(() => {
    setRecordTime(0);
    let analyser: AnalyserNode;
    let animId: number;
    let mediaStream: MediaStream | null = null;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { channelCount: 1, sampleRate: 16000, sampleSize: 16 },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        mediaStream = stream;
        setMicConnected(true);

        const AudioCtx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return alert("AudioContext 미지원");
        const audioCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          console.log("🔄 오디오 컨텍스트 재시작 중");
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
          setMicLevel(Math.min(100, (avg / 255) * 100));
          animId = requestAnimationFrame(draw);
        };
        draw();
      } catch (err) {
        console.error("getUserMedia error:", err);
        navigate("/interview/check-environment");
      }
    };

    setupMedia();
    return () => {
      cancelAnimationFrame(animId);
      audioContextRef.current?.close();
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [navigate]);

  // 면접 시작 핸들러
  const onStart = async () => {
    const token = auth.token;
    if (!token) return alert("로그인이 필요합니다.");
    setIsLoading(true);
    try {
      // 질문 및 TTS 음성 생성 요청
      const generateRes = await fetch(
        `${API_BASE}/generate-resume-questions/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ difficulty }),
        }
      );
      if (!generateRes.ok) {
        throw new Error(
          `질문 생성 실패: ${
            generateRes.statusText || String(generateRes.status)
          }`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const qRes = await fetch(`${API_BASE}/get_all_questions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!qRes.ok) throw new Error(qRes.statusText || String(qRes.status));
      const { questions: questionMap } = await qRes.json();

      const email = auth.userEmail ? auth.userEmail.split("@")[0] : "anonymous";
      
      const filteredQuestionList = (
        Object.entries(questionMap) as [string, string][]
      ).map(([id, text]) => ({
        id,
        text,
        type: "behavioral",
        difficulty: "medium",
        audio_url: `${S3_BASE_URL}${email}/questions${id}.wav`,
      }));

      // 자기소개 질문 맨 앞으로
      const sortedQuestionList = [...filteredQuestionList].sort((a, b) => {
        if (a.text.includes("자기소개")) return -1;
        if (b.text.includes("자기소개")) return 1;
        const getNumericId = (id: string) => {
          const match = id.match(/\d+/);
          return match ? parseInt(match[0]) : Number.MAX_SAFE_INTEGER;
        };
        return getNumericId(a.id) - getNumericId(b.id);
      });

      if (sortedQuestionList.length === 5) {
        const clonedIdx = 2;
        const copied = { ...sortedQuestionList[clonedIdx] };
        copied.id = `${copied.id}_copy`;
        copied.text += " (보충 질문)";

        sortedQuestionList.splice(4, 0, copied);
      }

      setQuestions(sortedQuestionList);
      
      // 이력서 텍스트 가져오기
      try {
        const rRes = await fetch(`${API_BASE}/get-resume-text/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rRes.ok) {
          const { resume_text } = await rRes.json();
          setResumeText(resume_text || "");
          resumeRef.current = resume_text || "";
        }
      } catch (resumeError) {
        console.error("이력서 텍스트 가져오기 실패:", resumeError);
      }

      setQIdx(0);
      setIsInterviewActive(true);
      interviewStartRef.current = Date.now();
      questionStartTimeRef.current = Date.now();
    } catch (err) {
      console.error("면접 시작 실패:", err);
      alert("면접 시작 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 꼬리질문 판단
  const decideFollowup = async (
    userAnswer: string,
    questionIndex: number
  ): Promise<boolean> => {
    const token = auth.token;
    if (!token || !resumeRef.current) return false;
    const payload = {
      resume_text: resumeRef.current,
      user_answer: userAnswer.trim(),
      base_question_number: parseInt(
        questions[questionIndex].id.match(/\d+/)?.[0] || "0",
        10
      ),
      interview_id: videoId,
      existing_question_numbers: questions.map((q) => q.id),
    };
    console.log("[꼬리질문 요청]", payload);
    const res = await fetch(`${API_BASE}/followup/check/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    console.log("[꼬리질문 응답]", res.status, res.statusText);
    if (!res.ok) return false;
    const data = await res.json();
    console.log("[꼬리질문 데이터]", data);

    /* ② audio_url 없으면 10초 기다렸다 재조회 */
    if (data.followup && !data.audio_url) {
      await sleep(15000); // 10초 blocking (컴포넌트 언마운트 시 취소하려면 AbortController 사용)

      // 보조 엔드포인트 예시: GET /followup/audio/<qNum>
      const audioRes = await fetch(
        `${API_BASE}/followup/audio/question${data.question_number}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (audioRes.ok) {
        const { audio_url } = await audioRes.json();
        console.log("🎧 follow-up audio url ▶", audio_url);
        data.audio_url = audio_url; // 성공 시 삽입
      }
      // 실패해도 텍스트만 먼저 추가하도록 지나감
    }

    if (data.followup && data.question && data.question_number) {
      setQuestions((prev) => {
        const updated = [
          ...prev.slice(0, questionIndex + 1),
          {
            id: data.question_number,
            text: data.question,
            type: "behavioral",
            difficulty: "medium",
            audio_url: data.audio_url,
          },
          ...prev.slice(questionIndex + 1),
        ];
        console.log("꼬리질문 추가 후 updated 배열:", updated);
        setTimeout(() => setQIdx(questionIndex + 1), 0);
        return updated;
      });
      return true;
    }
    return false;
  };

  // 질문 인덱스 변경시 오디오 재생
  useEffect(() => {
    if (isInterviewActive && questions[qIdx]) {
      playQuestionAudio();
    }
    // eslint-disable-next-line
  }, [isInterviewActive, qIdx, questions]);

  // 질문 오디오 재생
  const playQuestionAudio = async () => {
    if (!questions[qIdx]) return;
    try {
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audioUrl = questions[qIdx].audio_url;
      if (audioUrl) {
        try {
          const response = await fetch(audioUrl);
          if (!response.ok)
            throw new Error(`오디오 fetch 실패: ${response.status}`);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          if (!audioRef.current) {
            const audioElement = document.createElement("audio");
            audioElement.hidden = true;
            document.body.appendChild(audioElement);
            audioRef.current = audioElement;
          }
          audioRef.current.src = blobUrl;
          audioRef.current.onended = () => {
            setIsPlayingAudio(false);
            startRecording();
            URL.revokeObjectURL(blobUrl);
          };
          audioRef.current.onerror = (e) => {
            setIsPlayingAudio(false);
            startRecording();
            URL.revokeObjectURL(blobUrl);
          };
          await audioRef.current.play();
        } catch (fetchError) {
          setIsPlayingAudio(false);
          startRecording();
        }
      } else {
        setIsPlayingAudio(false);
        startRecording();
      }
    } catch (error) {
      setIsPlayingAudio(false);
      startRecording();
    }
  };

  // 녹음 및 WebSocket 시작
  const startRecording = async () => {
    if (!questions[qIdx] || !streamRef.current) return;

    resetPostureBaseline(); // Reset posture tracking for new question
    setRecordTime(0);
    setIsRecording(true);
    setIsPreparing(false);

    const token = auth.token; // Use auth.token
    const ws = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_BASE_URL}/ws/transcribe?email=${
        auth.userEmail
      }&question_id=${questions[qIdx].id}&token=${token}`
    );
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("✅ WebSocket 연결됨");
      const audioCtx = audioContextRef.current!;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(streamRef.current!);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        console.log("🎤 onaudioprocess 호출됨"); // 로그 추가
        const floatData = e.inputBuffer.getChannelData(0);
        const pcm = convertFloat32ToInt16(floatData);
        if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
        audioChunksRef.current.push(new Float32Array(floatData));
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "upload_id") {
          setUploadId(data.upload_id);
          return;
        }
        if (data.transcript) {
          setTranscript((prev) => {
            const updated = prev + data.transcript + "\n";
            transcriptRef.current = updated;
            return updated;
          });
        }
      } catch {}
    };
    ws.onerror = (e) => {
      console.error("WebSocket 오류", e);
    };
    ws.onclose = (event) => {
      console.log("WebSocket 종료", event.code, event.reason);
    };
  };

  // 녹음 종료, 업로드, 꼬리질문 판단
  const stopRecording = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsRecording(false);
    setIsPreparing(true);

    // 비디오 클립 업로드
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      await new Promise((res) => setTimeout(res, 300));
      const videoBlob = new Blob(questionVideoChunksRef.current, {
        type: "video/webm",
      });
      const videoFile = new File([videoBlob], "clip.webm", {
        type: "video/webm",
      });
      const clipForm = new FormData();
      clipForm.append("video", videoFile);
      clipForm.append("interview_id", videoId);
      clipForm.append("question_id", questions[qIdx].id);
      const token = auth.token;
      await fetch(`${API_BASE}/video/upload-question-clip/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: clipForm,
      }).catch(console.error);
    }

    // 자세 클립 분할
    const duration = recordTime;
    const relSegments = segmentsRef.current
      .filter((s) => s.start < duration && s.end > 0)
      .map((s) => ({
        start: Math.max(0, s.start),
        end: Math.min(duration, s.end),
      }));
    if (relSegments.length > 0) {
      const segmentPayload = {
        interview_id: videoId,
        question_id: questions[qIdx].id,
        segments: relSegments,
        feedbacks: relSegments.map(() => ""),
      };
      const token = auth.token;
      await fetch(`${API_BASE}/video/extract-question-clip-segments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(segmentPayload),
      });
    }

    // WebSocket 종료
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(new TextEncoder().encode("END"));
      await new Promise((res) => setTimeout(res, 300));
      wsRef.current.close();
    }
    processorRef.current?.disconnect();

    // 오디오 업로드
    const token = auth.token;
    const wavBlob = encodeWAV(
      audioChunksRef.current.reduce((acc, cur) => {
        const tmp = new Float32Array(acc.length + cur.length);
        tmp.set(acc);
        tmp.set(cur, acc.length);
        return tmp;
      }, new Float32Array()),
      16000
    );
    const audioForm = new FormData();
    audioForm.append(
      "audio",
      new File([wavBlob], "answer.wav", { type: "audio/wav" })
    );
    audioForm.append(
      "transcript",
      new Blob([transcriptRef.current], { type: "text/plain" })
    );
    audioForm.append("email", auth.userEmail || "anonymous");
    audioForm.append("question_id", questions[qIdx].id);
    if (uploadId) {
      audioForm.append("upload_id", uploadId);
    }

    await fetch(`${API_BASE}/audio/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: audioForm,
    }).catch(console.error);

    // ✅ 꼬리질문 판단 조건 강화
    const refinedTranscript = transcriptRef.current.trim();
    console.log("📌 꼬리질문 판단용 transcript:", refinedTranscript);

    if (
      refinedTranscript &&
      refinedTranscript.toLowerCase() !== "blob" &&
      refinedTranscript.length > 5
    ) {
      console.log("✅ 꼬리질문 판단 조건 만족, API 호출 진행");
      await decideFollowup(refinedTranscript, qIdx);
    } else {
      console.warn(
        "⚠️ transcript가 무의미하거나 너무 짧아 꼬리질문 생략됨:",
        refinedTranscript
      );
    }

    setIsPreparing(false);
    audioChunksRef.current = [];
    questionVideoChunksRef.current = [];
  };

  // 면접 종료
  const endInterview = async () => {
    setIsLoading(true);
    const token = auth.token; // Use auth.token
    if (!token) return;

    // Final full interview video processing (이제 전체 영상 업로드 안함)
    if (!uploadId) {
      console.warn("Upload ID가 없어 최종 분석을 건너뛰고 피드백 페이지로 이동합니다.");
      navigate("/interview/feedback", {
        state: {
          upload_id: videoId, // Use videoId as interview_id
          segments: [], // Segments will be fetched in FeedbackReport
          analysis: {},
          clips: [],
        },
      });
      setQuestions([]);
      setQIdx(0);
      setIsInterviewActive(false);
      setTranscript("");
      audioChunksRef.current = [];
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
      setIsLoading(false);
      return;
    }

    // Existing posture analysis upload remains (countsRef.current)
    // This part should still be done to analyze voice data after last question
    if (uploadId && countsRef.current) {
      try {
        console.log("분석 요청 전 uploadId:", uploadId);
        console.log("분석 요청 전 posture_count:", countsRef.current);
        const analyzePayload = {
          upload_id: uploadId,
          posture_count: countsRef.current,
        };
        console.log("▶ Final analyze-voice 요청 데이터:", analyzePayload);

        const r2 = await fetch(`${API_BASE}/analyze-voice/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(analyzePayload),
          credentials : "include",
        });

        if (!r2.ok) {
          const errorText = r2.statusText || String(r2.status);
          console.error("▶ analyze-voice API 오류:", r2.status, errorText);
          throw new Error(`분석 API 실패: ${errorText}`);
        }
        const { analysis } = await r2.json();
        navigate("/interview/feedback", {
          state: {
            upload_id: videoId, // Use videoId as interview_id
            segments: [], // Segments will be fetched in FeedbackReport
            analysis,
            clips: [], // Clips will be fetched in FeedbackReport
          },
        });
      } catch (e) {
        console.error("최종 분석 실패:", e);
        console.error("실패 당시 uploadId:", uploadId);
        console.error("실패 당시 posture_count:", countsRef.current);
        //alert("피드백 페이지로 이동합니다.");
        navigate("/interview/feedback", {
          state: {
            upload_id: videoId, // Use videoId as interview_id
            segments: [], // Segments will be fetched in FeedbackReport
            analysis: {},
            clips: [], // Clips will be fetched in FeedbackReport
          },
        });
      }
    } else {
      navigate("/interview/feedback", {
        state: {
          upload_id: videoId,
          segments: [],
          analysis: {},
          clips: [],
        },
      });
    }

    setQuestions([]);
    setQIdx(0);
    setIsInterviewActive(false);
    setTranscript("");
    audioChunksRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  // 다음 질문 혹은 면접 종료
  const handleNext = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    if (isRecording) await stopRecording();
    if (qIdx < questions.length - 1) {
      resetPostureBaseline(); // Reset posture baseline for the next question
      setQIdx((prev) => prev + 1);
      setTranscript("");
      audioChunksRef.current = [];

      // Start recording for the next question
      if (streamRef.current) {
        questionVideoChunksRef.current = []; // Clear chunks for the new question's video
        const newRecorder = new MediaRecorder(streamRef.current, {
          mimeType: "video/webm",
        });
        newRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) questionVideoChunksRef.current.push(e.data);
        };
        newRecorder.start();
        mediaRecorderRef.current = newRecorder;
        questionStartTimeRef.current = Date.now(); // Update start time for the new question
      }
    } else {
      endInterview();
    }
  };

  return (
    <div className="pt-[92px] relative min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col items-start space-y-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
              <div>
                <span className="text-xs mr-2">마이크 상태:</span>
                <span
                  className={micConnected ? "text-green-400" : "text-red-400"}
                >
                  {micConnected ? "연결됨" : "미연결"}
                </span>
              </div>
              <div className="w-32 h-2 bg-gray-600 rounded overflow-hidden">
                <div
                  className="h-full bg-green-400"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {!isInterviewActive ? (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">면접 준비</h2>
              <p className="text-gray-400 mb-6">
                이력서 기반 질문을 가져오고 녹음을 준비합니다.
              </p>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  질문 난이도 선택
                </h3>
                <div className="flex gap-2">
                  {["쉬움", "중간", "어려움"].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setDifficulty(level as "쉬움" | "중간" | "어려움")
                      }
                      className={`px-4 py-1 w-16 rounded-full text-sm border text-center transition
                        ${
                          difficulty === level
                            ? "bg-purple-600 text-white border-transparent font-semibold"
                            : "bg-transparent text-gray-300 border-gray-400 hover:bg-gray-600"
                        }
                      `}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={onStart}
                className="w-full"
                size="lg"
                disabled={isLoading || !micConnected}
                isLoading={isLoading}
              >
                AI 면접 시작하기
              </Button>
            </div>
          ) : isPreparing ? (
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center space-y-4">
              <p className="text-gray-300">다음 질문 준비 중…</p>
              <svg
                className="w-10 h-10 animate-spin text-primary"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">현재 질문</h3>
                <span className="text-sm text-gray-400">
                  {qIdx + 1}/{questions.length}
                </span>
              </div>
              <p className="text-gray-300">{questions[qIdx]?.text}</p>
              {isPlayingAudio && (
                <div className="mt-2 flex items-center text-sm text-blue-400">
                  <svg
                    className="w-4 h-4 mr-1 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                  질문 음성 재생 중...
                </div>
              )}
              {isRecording && (
                <p className="mt-4 text-sm text-gray-400">
                  남은 답변 시간: {MAX_ANSWER_DURATION - recordTime}초
                </p>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleNext}
                disabled={isLoading || isPlayingAudio}
              >
                {qIdx < questions.length - 1 ? "다음 질문" : "면접 종료"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-xs mx-4 space-y-4">
            <h3 className="text-gray-900 text-lg font-semibold">
              {isLoading ? "처리 중..." : "피드백 생성 중..."}
            </h3>
            <svg
              className="mx-auto w-12 h-12 animate-spin text-primary"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        </div>
      )}
      <audio ref={audioRef} hidden />
    </div>
  );
};
