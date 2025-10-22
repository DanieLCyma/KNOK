import React, { useRef, useState } from "react";
import { Button } from "../../components/shared/Button";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import html2pdf from "html2pdf.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// 더미 데이터 선언 (6가지 평가항목)
const MOCK_FEEDBACK = {
  summary:
    "전반적으로 논리적인 답변과 침착한 태도가 인상적이었습니다. 꼬리 질문에도 당황하지 않고 차분하게 답변한 점이 좋았고, 실제 경험을 바탕으로 한 구체적 설명이 신뢰감을 높였습니다.",
  detail: {
    일관성:
      "답변 전반에 걸쳐 논리적 일관성이 유지되었으며, 질문과 무관한 내용의 반복이나 중복 없이 자연스럽게 흐름을 이어갔습니다.",
    논리성:
      "각 질문에 대해 명확한 근거와 이유를 제시하여 주장을 논리적으로 전달했습니다. 특히 자신의 경험과 배운 점을 구체적으로 연결해 설명한 부분이 좋았습니다.",
    대처능력:
      "예상하지 못한 추가 질문에도 침착하게 자신의 생각을 정리해 답변하였으며, 답변 도중 잠시 멈췄으나 빠르게 상황을 수습하고 논지를 잃지 않았습니다.",
    구체성:
      "단순히 원론적인 답변에 그치지 않고 실제 프로젝트, 협업 경험, 문제 해결 사례 등 구체적인 에피소드를 적극적으로 활용해 설득력을 높였습니다.",
    말하기방식:
      "적당한 속도와 정확한 발음으로 또렷하게 답변을 이어갔으며, 복잡한 내용도 조리 있게 정리해 전달하는 점이 긍정적으로 평가되었습니다.",
    면접태도:
      "자신감 있는 목소리와 바른 자세를 유지했으며, 질문자와 적절히 시선을 맞추는 등 면접 예절을 잘 지켰습니다. 다만 일부 답변에서 긴장한 듯한 표정이 살짝 나타났습니다.",
  },
  chart: {
    일관성: 4,
    논리성: 4.5,
    대처능력: 4,
    구체성: 3.5,
    말하기방식: 4,
    면접태도: 3.5,
  },
  score: 90,
};

const MOCK_CLIPS = [
  {
    clipUrl: "/1.webm",
    thumbnailUrl: "thumbnail.png",
  },
  {
    clipUrl: "/2.webm",
    thumbnailUrl: "thumbnail.png",
  },
  {
    clipUrl: "/3.webm",
    thumbnailUrl: "thumbnail.png",
  },
];

// ZIP 다운로드: 더미 zip 생성 (간단하게 Blob으로)
const createDummyZipBlob = () => {
  const text = "피드백 ZIP 파일입니다.";
  return new Blob([text], { type: "application/zip" });
};

const FeedbackReport: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfUploaded, setIsPdfUploaded] = useState(true); // PDF 업로드 항상 true(시연)
  const reportRef = useRef<HTMLDivElement>(null);

  // PDF 다운로드/업로드: 실제 업로드 없이 Blob만 다운로드
  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 0,
      filename: "feedback.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] as unknown as string[] },
    };
    await html2pdf().set(opt).from(reportRef.current).save();
  };

  // ZIP 다운로드 핸들러 (가짜)
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = createDummyZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      alert("ZIP 다운로드 완료");
    } catch (err) {
      alert("다운로드 중 에러 발생: " + err);
    } finally {
      setIsDownloading(false);
    }
  };

  // 차트 옵션
  const chartOptions: ChartOptions<"radar"> = {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1 },
        pointLabels: { font: { size: 16 } },
      },
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { font: { size: 14 } },
      },
    },
  };

  // 표정 이미지 (score 기준)
  const score = MOCK_FEEDBACK.score || 0;
  const expressionImg =
    score >= 80
      ? "/smile.png"
      : score >= 50
      ? "/soso.png"
      : "/sad.png";

  // 날짜 표시 (오늘 날짜)
  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 pt-12">
      {/* ZIP/PDF 다운로드 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleDownload} disabled={isDownloading || !isPdfUploaded}>
          {isDownloading ? "다운로드 중..." : "ZIP 다운로드"}
        </Button>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white shadow rounded-xl p-6">
        <h1 className="text-3xl font-bold text-center">피드백 리포트</h1>
        <p className="text-center text-sm text-gray-500">면접 일자: {todayStr}</p>

        {/* 종합 소견 + 면접관 표정 */}
        <div className="grid grid-cols-10 gap-4">
          <div className="col-span-7 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2 text-center">종합 소견</h2>
            <p>{MOCK_FEEDBACK.summary}</p>
          </div>
          <div className="col-span-3 p-4 border rounded flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-2">면접관 표정</h2>
            <img src={expressionImg} alt="표정" className="w-24 h-24" />
          </div>
        </div>

        {/* 차트 */}
        <div className="p-4 border rounded mb-6">
          <h2 className="text-xl font-semibold text-center mb-2">면접 결과 분석</h2>
          <Radar
            data={{
              labels: Object.keys(MOCK_FEEDBACK.chart),
              datasets: [
                {
                  label: "면접 평가",
                  data: Object.values(MOCK_FEEDBACK.chart),
                  backgroundColor: "rgba(147, 51, 234, 0.4)",
                  borderColor: "#9333ea",
                  borderWidth: 2,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>

        {/* 상세 분석 */}
        <div className="page-break">
          <div className="p-4 border rounded space-y-4">
            <h2 className="text-xl font-semibold text-center mb-2">상세 분석</h2>
            {Object.entries(MOCK_FEEDBACK.detail).map(([title, content]) => (
              <div key={title}>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="pl-2">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 썸네일 & 클립 */}
      {MOCK_CLIPS.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">추출된 클립</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_CLIPS.map((c, i) => (
              <div key={i} className="border rounded-lg p-4">
                <img
                  src={c.thumbnailUrl}
                  alt={`Clip ${i + 1}`}
                  className="w-full h-auto mb-2 rounded-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/no_thumbnail.png";
                  }}
                />
                <a
                  href={c.clipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  클립 {i + 1} 보기
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FeedbackReport;
