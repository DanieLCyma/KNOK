// src/pages/HomePage.tsx

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/shared/Button";

// Swiper import (Navigation 모듈 제거)
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Swiper styles (navigation 스타일은 제거)
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";

// src/pages/HomePage.tsx
import rapaImg     from '../assets/rapa dx.png';
import jobkoreaImg from '../assets/jobkorea.png';
import incruitImg  from '../assets/incruit.png';
import peopleImg   from '../assets/peopleandjob.png';
import saraminImg  from '../assets/saramin.png';


// 취업 공고 사이트 목록
const jobSites = [
  { href: "https://edu.rapa.or.kr/recruitment/1250", src: rapaImg,  alt: "RAPA DX 11기" },
  { href: "https://www.jobkorea.co.kr",               src: jobkoreaImg,     alt: "잡코리아" },
  { href: "https://www.incruit.com",                  src: incruitImg,     alt: "인크루트" },
  { href: "https://www.peoplenjob.com",               src: peopleImg,     alt: "피플앤잡" },
  { href: "https://www.saramin.co.kr",                src: saraminImg,       alt: "사람인" },
];

const HomePage: React.FC = () => (
  <>
    {/* Hero Section */}
    <section className="bg-[#e1dbf6] py-8 md:py-6">
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="w-full md:w-1/2 pr-4">
          <h2 className="mb-6 max-w-[780px]">
            <span className="block text-2xl font-medium leading-tight mb-2">
              똑똑..
            </span>
            <span className="block text-3xl md:text-4xl font-medium leading-tight whitespace-nowrap">
              당신의 취업문을 두드리는 "노크"
            </span>
          </h2>
          <Link to="/interview/upload-resume">
            <Button variant="primary" size="lg" className="text-base px-6 py-3">
              AI 모의면접 시작하기
            </Button>
          </Link>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="/캐릭터 2 누끼.png"
            alt="knok 로봇 캐릭터"
            className="w-[300px] h-auto object-contain"
          />
        </div>
      </div>
    </section>

    {/* Jobs Slider Section: 좌우 화살표 제거 */}
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4 relative pb-12">
        <Swiper
          modules={[Autoplay, Pagination]}               // Navigation 모듈 삭제
          spaceBetween={20}
          slidesPerView={3}
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}               // 화살표 대신 점 페이징만
          className="!pb-8"
        >
          {jobSites.map(site => (
            <SwiperSlide key={site.href}>
              <a
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <img
                  src={site.src}
                  alt={site.alt}
                  className="h-24 md:h-32 object-contain"
                />
                <span className="mt-2 text-sm font-semibold text-[#3f3f3f]">
                  {site.alt}
                </span>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>

    {/* Services Section */}
    <section className="pt-6 pb-24 bg-white">
      <div className="container mx-auto px-4">
        <p className="text-[#8447e9] text-base font-semibold tracking-wider mb-4">
          OUR SERVICES
        </p>

        <h2 className="text-[#000000] text-4xl font-medium tracking-tighter leading-[1.2] max-w-[1128px] mb-6">
          KNOK
        </h2>

        <p className="text-[#3f3f3f] text-sm md:text-base leading-relaxed max-w-[1128px] mb-16">
          AI 기반의 심층 면접관이 자기소개서를 분석하여 맞춤 질문을 생성하고, 당신의 답변을 다각도로 평가합니다.
          정교한 AI 피드백 시스템으로 실전 역량을 강화하고 합격까지 이끄는 최적의 면접 솔루션을 경험하세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="text-center">
            <div className="w-36 h-36 mx-auto mb-8 bg-[#8447e9]/10 rounded-full flex items-center justify-center">
              <img src="/icon1.png" alt="Goal-Based Practice" className="w-24 h-24" />
            </div>
            <h3 className="text-[#8447e9] text-3xl font-medium mb-4">
              Goal-Based Practice
            </h3>
            <p className="text-[#3f3f3f] text-base leading-relaxed">
              원하는 기업과 직무를 목표로 설정하고,
              <br /> AI가 맞춤형 면접 훈련을 제공합니다.
              <br /> KNOK는 단순한 연습을 넘어, 취업이라는 목표 달성을 위한 전략적 준비를 돕습니다.
            </p>
          </div>

          <div className="text-center">
            <div className="w-36 h-36 mx-auto mb-8 bg-[#8447e9]/10 rounded-full flex items-center justify-center">
              <img src="/group.png" alt="Rapid Skill Boost" className="w-24 h-24" />
            </div>
            <h3 className="text-[#8447e9] text-3xl font-medium mb-4">
              Rapid Skill Boost
            </h3>
            <p className="text-[#3f3f3f] text-base leading-relaxed">
              단 몇 번의 연습만으로도 확실한 변화를 느껴보세요.
              <br /> AI 분석 기반의 집중 피드백으로 면접 실력이 빠르게 향상됩니다.
            </p>
          </div>

          <div className="text-center">
            <div className="w-36 h-36 mx-auto mb-8 bg-[#8447e9]/10 rounded-full flex items-center justify-center">
              <img src="/group-1.png" alt="Structured Answer Design" className="w-24 h-24" />
            </div>
            <h3 className="text-[#8447e9] text-3xl font-medium mb-4">
              Structured Answer Design
            </h3>
            <p className="text-[#3f3f3f] text-base leading-relaxed">
              AI가 논리 흐름, 일관된 답변, 키워드 연결, 핵심 전달력을 분석해
              <br /> 더 설득력 있는 응답 플로우로 다듬어드립니다.
              <br /> 논리적이고 일관된 답변 흐름으로 면접관을 사로잡으세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default HomePage;
