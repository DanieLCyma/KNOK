import { useEffect, useRef } from "react";
/*
import { Pose } from "@mediapipe/pose";
import { FaceMesh, NormalizedLandmark } from "@mediapipe/face_mesh";
import * as mpPose from "@mediapipe/pose";
import * as mpFaceMesh from "@mediapipe/face_mesh";
import type { NormalizedLandmark } from '@mediapipe/face_mesh';
*/
declare global {
  interface Window {
    Pose: any;
    FaceMesh: any;
  }
}

type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;
type PostureReason = "shoulder" | "headDown" | "ear" | "gaze";

let _postureBaseline = Date.now();
export function resetPostureBaseline() {
  _postureBaseline = Date.now();
}

export function usePostureTracking(
  videoRef: React.RefObject<HTMLVideoElement>,
  videoId: string,
  baseTimeMs: number
) {
  const countsRef = useRef<Record<PostureReason, number>>({
    shoulder: 0,
    headDown: 0,
    ear: 0,
    gaze: 0,
  });
  const segmentsRef = useRef<
    { reason: PostureReason; start: number; end: number }[]
  >([]);
  const startBadTimeRef = useRef<number | null>(null);
  const currentReasonRef = useRef<PostureReason | null>(null);

  useEffect(() => {
    countsRef.current = { shoulder: 0, headDown: 0, ear: 0, gaze: 0 };
    segmentsRef.current = [];
    resetPostureBaseline();

    if (!videoRef.current) return;
    const pose = new window.Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.setOptions({
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    let latestFaceLandmarks: NormalizedLandmark[] | null = null;
    faceMesh.onResults((results: any) => {
      latestFaceLandmarks = results.multiFaceLandmarks?.[0] ?? null;
    });

    const videoStart = Date.now();
    const getVideoTime = () => (Date.now() - videoStart) / 1000;

    pose.onResults((results: any) => {
      const lm = results.poseLandmarks;
      if (!lm) {
        startBadTimeRef.current = null;
        currentReasonRef.current = null;
        return;
      }

      const lShoulder = lm[11],
        rShoulder = lm[12],
        nose = lm[0],
        lEar = lm[7],
        rEar = lm[8];
      const shoulderAngle =
        (Math.atan2(lShoulder.y - rShoulder.y, lShoulder.x - rShoulder.x) *
          180) /
        Math.PI;
      const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
      const headDown = nose.y > avgShoulderY + 0.1;
      const earAngle =
        (Math.atan2(lEar.y - rEar.y, lEar.x - rEar.x) * 180) / Math.PI;

      let gazeOff = false;
      if (latestFaceLandmarks) {
        const leftIris = latestFaceLandmarks[468];
        const leftEyeLeft = latestFaceLandmarks[33];
        const leftEyeRight = latestFaceLandmarks[133];
        const eyeRange = leftEyeRight.x - leftEyeLeft.x;
        const irisPos =
          eyeRange > 0 ? (leftIris.x - leftEyeLeft.x) / eyeRange : 0.5;
        gazeOff = irisPos < 0.35 || irisPos > 0.65;
      }

      let reason: PostureReason | null = null;
      if (Math.abs(shoulderAngle) > 10) reason = "shoulder";
      else if (Math.abs(earAngle) > 10) reason = "ear";
      else if (headDown) reason = "headDown";
      else if (gazeOff) reason = "gaze";

      if (reason) {
        if (currentReasonRef.current !== reason) {
          currentReasonRef.current = reason;
          startBadTimeRef.current = Date.now();
        } else if (
          startBadTimeRef.current &&
          Date.now() - startBadTimeRef.current >= 3000
        ) {
          const startTime = (startBadTimeRef.current - _postureBaseline) / 1000;
          const endTime = (Date.now() - _postureBaseline) / 1000;
          segmentsRef.current.push({
            reason,
            start: startTime,
            end: endTime,
          });
          countsRef.current[reason]++;
          currentReasonRef.current = null;
          startBadTimeRef.current = null;
        }
      } else {
        currentReasonRef.current = null;
        startBadTimeRef.current = null;
      }
    });

    const intervalId = setInterval(async () => {
      const video = videoRef.current!;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      await faceMesh.send({ image: canvas });
      await pose.send({ image: canvas });
    }, 3000);

    return () => {
      clearInterval(intervalId);
      segmentsRef.current = segmentsRef.current.filter(
        (s) => s.end - s.start >= 0.5
      );
      fetch(`${API_BASE}/posture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          count: countsRef.current,
          segments: segmentsRef.current,
        }),
      });
    };
  }, [videoRef, videoId]);

  return {
    countsRef,
    segmentsRef,
  };
}
