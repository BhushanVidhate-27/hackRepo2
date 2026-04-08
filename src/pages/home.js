export function renderHomePage() {
  return {
    title: "Thermal Analysis",
    html: `
      <div class="min-h-screen">
        ${renderHeroSection()}
        ${renderFeaturesSection()}
        ${renderServicesSection()}
        ${renderTeamSection()}
        ${renderFooter()}
      </div>
    `,
    afterRender() {
      // nothing for now
    },
  };
}

function renderHeroSection() {
  return `
    <section id="top" class="relative overflow-hidden bg-gradient-to-b from-white to-[#F8F9FB] pt-20 pb-24">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 right-0 w-[600px] h-[600px] bg-[#3A86FF] opacity-5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0A2540] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-[1440px] mx-auto px-8 relative z-10">
        <div class="min-h-[65vh] flex items-center justify-center">
          <div class="w-full max-w-4xl text-center space-y-8">
            <h1 class="text-5xl lg:text-6xl text-[#0A2540] leading-tight">
              Smart Thermal Analysis for
              <span class="bg-gradient-to-r from-[#3A86FF] to-[#0A2540] bg-clip-text text-transparent">
                Next-Gen Engineering
              </span>
            </h1>

            <p class="text-xl text-gray-600 leading-relaxed">
              Leverage advanced CFD simulations and AI-powered insights to optimize composite wall designs.
              Analyze temperature distribution, predict energy efficiency, and make data-driven decisions in minutes.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#/dashboard">
                <button class="bg-[#3A86FF] hover:bg-[#2A76EF] text-white text-lg px-8 py-6 h-10 rounded-md inline-flex items-center justify-center">
                  Start Simulation
                  <i data-lucide="arrow-right" class="ml-2 w-5 h-5"></i>
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFeaturesSection() {
  return `
    <section id="features" class="py-24 bg-[#F8F9FB]">
      <div class="max-w-[1440px] mx-auto px-6 sm:px-8">
        <div class="text-center mb-20">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#3A86FF]/10 text-[#3A86FF] rounded-full text-sm mb-4">
            Platform Features
          </div>
          <h2 class="text-4xl text-[#0A2540] mb-4">Powered by Advanced Technology</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Industry-leading tools backed by cutting-edge science and engineering
          </p>
        </div>

        <div class="space-y-24">
          ${renderFeatureBlock({
            title: "COD Simulation Engine",
            description:
              "Our proprietary computational fluid dynamics engine delivers precision thermal analysis with 95%+ accuracy. Utilizing advanced finite element methods, it simulates heat transfer across complex multi-layer composite structures in real-time.",
            imageGradient: "from-red-500 via-orange-500 to-yellow-500",
            imageSrc: "/src/assets/cod-simulation-engine.svg",
            imageAlt: "COD simulation engine visualization",
            stats: [
              { label: "Accuracy", value: "95%" },
              { label: "Speed", value: "<30s" },
            ],
            even: true,
          })}

          ${renderFeatureBlock({
            title: "Real-time Graph",
            description:
              "Dynamic visualizations update instantly as you adjust parameters. Drag sliders to see temperature curves, heat flux, and energy efficiency metrics change in real-time, enabling rapid design iteration.",
            imageGradient: "from-blue-500 via-cyan-500 to-teal-500",
            imageSrc: "/src/assets/real-time-graph.svg",
            imageAlt: "Real-time graph visualization",
            stats: [
              { label: "Response Time", value: "<100ms" },
              { label: "Data Points", value: "10k+" },
            ],
            even: false,
          })}
        </div>
      </div>
    </section>
  `;
}

function renderFeatureBlock({ title, description, imageGradient, imageSrc, imageAlt, stats, even }) {
  const orderImg = even ? "" : "lg:order-2";
  const orderText = even ? "" : "lg:order-1";
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div class="${orderImg}">
        <div class="relative">
          <div class="relative">
            <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br ${imageGradient} p-1">
              <div class="w-full h-full bg-white rounded-xl p-6 flex items-center justify-center">
                <img src="${imageSrc}" alt="${imageAlt}" class="w-full h-full object-contain" loading="lazy" />
              </div>
            </div>

            <div class="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-gray-200">
              <div class="flex gap-6">
                ${stats
                  .map(
                    (s) => `
                      <div class="text-center">
                        <div class="text-2xl text-[#3A86FF]">${s.value}</div>
                        <div class="text-xs text-gray-600">${s.label}</div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="${orderText}">
        <h3 class="text-3xl text-[#0A2540] mb-4">${title}</h3>
        <p class="text-lg text-gray-600 leading-relaxed mb-6">${description}</p>
        <div class="flex flex-wrap gap-3">
          <div class="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">Real-time Processing</div>
          <div class="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">Cloud-powered</div>
          <div class="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">Enterprise Ready</div>
        </div>
      </div>
    </div>
  `;
}

function renderServicesSection() {
  const services = [
    {
      title: "CFD Thermal Simulation",
      description:
        "Advanced computational fluid dynamics engine that simulates precise temperature distribution across composite wall structures with industry-leading accuracy.",
    },
    {
      title: "Real-Time Analytics",
      description:
        "Interactive graphs and visualizations update instantly as you adjust parameters, enabling rapid iteration and informed decision-making.",
    },
    {
      title: "Failure Prediction System",
      description:
        "Proactive alerts identify potential thermal stress points and structural weaknesses before they become critical issues in production.",
    },
    {
      title: "Industry-Specific Modes",
      description:
        "Pre-configured templates for cold storage, HVAC systems, industrial facilities, and more, tailored to meet specific industry standards.",
    },
    {
      title: "Professional Reports",
      description:
        "Generate comprehensive, presentation-ready reports with detailed analysis, visualizations, and actionable recommendations for stakeholders.",
    },
  ];

  return `
    <section id="services" class="py-24 bg-white">
      <div class="max-w-[1440px] mx-auto px-6 sm:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#3A86FF]/10 text-[#3A86FF] rounded-full text-sm mb-4">
            Our Services
          </div>
          <h2 class="text-4xl text-[#0A2540] mb-4">Complete Thermal Engineering Suite</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to design, analyze, and optimize thermal performance in one powerful platform
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-8">
          ${services
            .map(
              (s) => `
                <div class="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]">
                  <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 h-full hover:shadow-xl transition-all duration-300 border-gray-200 group cursor-pointer max-w-[420px] mx-auto">
                    <h3 class="text-xl text-[#0A2540] mb-3">${s.title}</h3>
                    <p class="text-gray-600 leading-relaxed">${s.description}</p>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderTeamSection() {
  return `
    <section id="team" class="py-24 bg-[#F8F9FB]">
      <div class="max-w-[1440px] mx-auto px-8">
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#3A86FF]/10 text-[#3A86FF] rounded-full text-sm mb-4">
            Our Team
          </div>
          <h2 class="text-4xl text-[#0A2540] mb-4">Meet our Team</h2>
          <h1 class="text-5xl md:text-6xl font-extrabold tracking-wider bg-gradient-to-r from-gray-500 via-gray-800 to-black bg-clip-text text-transparent">
            DEXTRO
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
            We are a diverse group of professionals dedicated to advancing the field of technology.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="bg-[#0A2540] text-white">
      <div class="max-w-[1440px] mx-auto px-8 py-20">
        <div class="flex flex-col items-center text-center mb-16">
          <a href="#/" class="mb-4">
            <span class="text-2xl font-semibold tracking-wide">Thermal Analysis</span>
          </a>

          <p class="text-gray-300 text-lg max-w-xl leading-relaxed mb-6">
            Next-generation thermal analysis powered by CFD technology, delivering precision insights for advanced engineering solutions.
          </p>

          <div class="flex gap-4">
            ${["linkedin", "github", "twitter", "youtube"]
              .map(
                (i) => `
                  <button class="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#3A86FF] transition-all duration-300 flex items-center justify-center hover:scale-110">
                    <i data-lucide="${i}" class="w-5 h-5"></i>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="border-t border-white/10 pt-8 flex flex-col items-center gap-3">
          <p class="text-lg font-semibold tracking-wide text-white">Dextro</p>
          <p class="text-gray-400 text-base text-center">
            Designed by <span class="text-white font-medium">Team Dextro</span> for
            <span class="text-white font-medium"> Pentas Insulations Pvt Ltd</span>
          </p>
          <p class="text-gray-500 text-sm mt-2">© ${year} Dextro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

