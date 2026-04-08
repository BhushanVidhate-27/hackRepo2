import { buttonClass } from "../lib/uiPrimitives.js";

export function renderNavbar() {
  return `
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div class="max-w-[1440px] mx-auto px-8">
        <div class="flex items-center justify-between h-20">
          <a href="#/" class="flex items-center">
            <span class="text-xl text-[#0A2540]">Thermal Analysis</span>
          </a>

          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-[#0A2540] hover:text-[#3A86FF] transition-colors">Features</a>
            <a href="#services" class="text-[#0A2540] hover:text-[#3A86FF] transition-colors">Services</a>
            <a href="#team" class="text-[#0A2540] hover:text-[#3A86FF] transition-colors">Team</a>
          </div>

          <div class="flex items-center gap-4">
            <a href="#/dashboard">
              <button class="${buttonClass({ className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white" })}">
                Start Simulation
              </button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  `;
}

