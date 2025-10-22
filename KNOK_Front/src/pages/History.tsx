import React, { useState, useEffect } from "react";
import { Download, Loader } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "../components/shared/Button";
// import { useAuth } from "../contexts/AuthContext"; // 더미라면 주석 처리 가능

interface FeedbackItem {
  video_id: string;
  created_at: string;
  total_score: number;
  pdf_url: string;
}

const getFaceImg = (score: number) => {
  if (score >= 80) return "/smile.png";
  if (score >= 50) return "/soso.png";
  return "/sad.png";
};

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const hh = String(today.getHours()).padStart(2, "0");
const mi = String(today.getMinutes()).padStart(2, "0");

// 오늘 날짜 더미 데이터
const DUMMY_DATA: FeedbackItem[] = [
  {
    video_id: "dummy_video_id_1",
    created_at: new Date().toISOString(),
    total_score: 90,
    pdf_url: "/dummy_interview.pdf",
  },
  {
    video_id: "dummy_video_id_2",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 어제 날짜 예시
    total_score: 67,
    pdf_url: "/dummy_interview2.pdf",
  },
];

const History: React.FC = () => {
  const [data, setData] = useState<FeedbackItem[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterDate, setFilterDate] = useState<string>("");
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);

  useEffect(() => {
    // 실제 axios 대신 더미 데이터 세팅!
    setTimeout(() => setData(DUMMY_DATA), 500);
  }, [sortOrder]);

  const filteredData = filterDate
    ? data.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().slice(0, 10);
        return itemDate === filterDate;
      })
    : data;

  const formatKST = (utcDate: string) => {
    const date = new Date(utcDate);
    date.setHours(date.getHours() + 9);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  // 더미 PDF 파일 다운로드
  const downloadPDF = async (videoId: string, createdAt: string) => {
    try {
      setLoadingVideoId(videoId);
      // 실제 서버가 아니라 public 폴더에 있는 파일 다운로드
      const found = DUMMY_DATA.find((item) => item.video_id === videoId);
      if (!found) return;
      const response = await fetch(found.pdf_url);
      const blob = await response.blob();
      saveAs(blob, `${formatKST(createdAt).replace(/[: ]/g, "_")}_interview.pdf`);
    } catch (err) {
      alert("다운로드 실패");
    } finally {
      setLoadingVideoId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">내 면접 기록</h1>

      <div className="flex justify-between mb-6">
        <div>
          <Button
            variant={sortOrder === "newest" ? "primary" : "outline"}
            onClick={() => setSortOrder("newest")}
          >
            최신순
          </Button>
          <Button
            variant={sortOrder === "oldest" ? "primary" : "outline"}
            onClick={() => setSortOrder("oldest")}
            className="ml-2"
          >
            오래된 순
          </Button>
        </div>
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="ml-2 text-sm text-primary underline"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">연습 날짜</th>
            <th className="py-2 px-4 border">다운로드</th>
            <th className="py-2 px-4 border">내 점수</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length ? (
            filteredData.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="py-2 px-4">{formatKST(row.created_at)}</td>
                <td className="py-2 px-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadPDF(row.video_id, row.created_at)}
                    disabled={loadingVideoId === row.video_id}
                  >
                    {loadingVideoId === row.video_id ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" /> 다운로드 중...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" /> PDF
                      </>
                    )}
                  </Button>
                </td>
                <td className="py-2 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {row.total_score}점
                    <img
                      src={getFaceImg(row.total_score)}
                      alt="표정"
                      className="w-6 h-6"
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">
                해당 날짜의 기록이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default History;
