import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const team = [
  {
    name: "Sola",
    role: "Founder & Product Lead",
  },
  {
    name: "Chibuike Chijioke",
    role: "Fullstack Developer",
  },
  {
    name: "Yetunde",
    role: "Blockchain Research Analyst",
  },
  {
    name: "Sarah",
    role: "Frontend Developer",
  },
];

const AboutTeam: React.FC = () => {
  return (
    <section className="relative py-24 bg-dark-bg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-10">Meet the Team</h2>

        <p className="text-gray-400 max-w-3xl mx-auto mb-16 text-lg">
          A passionate team driving innovation in decentralized finance with
          transparency, scalability, and trust.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {team.map((member, i) => (
            <div
              key={i}
              className="group bg-[#1A1C28] rounded-2xl p-10 border border-indigo-500/10 transition-all duration-300"
            >
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full mb-6 flex items-center justify-center text-2xl font-bold text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(79,70,229,0.25)] cursor-pointer">
                {member.name.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 transition-colors duration-300 hover:text-indigo-400 cursor-pointer">
                {member.name}
              </h3>
              <p className="text-gray-400 text-base mb-6">{member.role}</p>

              {/* Social Media Icons */}
              <div className="flex justify-center space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <FaFacebookF className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutTeam;
