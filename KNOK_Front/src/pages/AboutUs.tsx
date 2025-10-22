import { useRef } from "react";
import { motion } from "framer-motion";

const teamMembers = [
  {
    id: "jaeyeob",
    name: "김재엽",
    github: "wera4677",
    image: "/재엽.png",   // public/재엽.png
    message: "어? 금지\n 모여있기 금지\n 표정 심각해지기 금지\n 회의 길어지기 금지\n 갑자기 진지해지기 금지\n ",
  },
  {
    id: "taeyoung",
    name: "김태영",
    github: "taeyoung0823",
    image: "/태영.png",   // public/태영.png
    message: "배포할 때 손이 안 떨린다? 그건 아직 진짜 장애를 안 겪어본 거야.",
  },
  {
    id: "geonho",
    name: "이건호",
    github: "DanieLCyma",
    image: "/건호.png",   // public/건호.png
    message: "끊임없이 배우고, 성장하는 개발자가 되겠습니다.",
  },
  {
    id: "yuna",
    name: "전유나",
    github: "yunajeon",
    image: "/유나.png",   // public/유나.png
    message: "사용자 경험을 최우선으로 생각하는 개발자가 되겠습니다.",
  },
  {
    id: "donguk",
    name: "최동욱",
    github: "ddungddangi",
    image: "/동욱.png",   // public/동욱.png
    message: "print(hello world)",
  },
];

export default function AboutUs() {
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMessage = (id: string) => {
    const el = messageRefs.current[id];
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-secondary py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-primary text-base font-semibold tracking-wider uppercase">
            VISION
          </h2>
          <h1 className="mt-4 text-4xl font-medium tracking-tight text-gray-900 max-w-4xl leading-snug">
            "Knok은 AI 기반의 대화형 면접 시뮬레이션으로,<br />
            당신의 성공적인 취업 여정을 돕는 데 집중합니다."
          </h1>
        </div>
      </section>

      {/* Profile Icons */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-primary text-base font-semibold tracking-wider uppercase mb-12">
            ORGANIZATION
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <button
                  onClick={() => scrollToMessage(member.id)}
                  className="focus:outline-none"
                >
                  <div className="w-52 h-52 rounded-full border-2 border-primary overflow-hidden mx-auto mb-4">
                    <img src={member.image} className="w-full h-full object-cover" />
                  </div>
                </button>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <a
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-1 text-sm text-gray-700 hover:text-primary"
                >
                  <img src="/github.png" className="w-5 h-5 mr-1" />
                  {member.github}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Messages with Floating Profile */}
      <section className="bg-gray-100 py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {teamMembers.map((member) => (
            <div key={member.id} className="relative">
              <button
                onClick={() => scrollToMessage(member.id)}
                className="absolute -left-12 top-1/2 transform -translate-y-1/2 focus:outline-none"
              >
                <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden bg-white">
                  <img src={member.image} className="w-full h-full object-cover" />
                </div>
              </button>
              <div
                ref={(el) => (messageRefs.current[member.id] = el)}
                className="bg-white border border-gray-300 rounded-xl p-8 pl-32 shadow-sm min-h-[160px]"
              >
                <p className="text-lg text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                  {member.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
