import { useEffect } from 'react';
import {
  LandingNavbar,
  HeroSection,
  ValueStrip,
  FeaturesSection,
  HowItWorks,
  AITutorShowcase,
  StudyWorkflow,
  AnalyticsShowcase,
  WhyStudyAI,
  FinalCTA,
  LandingFooter
} from '../components/landing/index.js';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'StudyAI — Study Smarter. Understand Faster.';
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-x-hidden relative">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />

      {/* Ambient background glowing orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* 1. Transparent / Blurred Sticky Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Value / Trust Strip */}
        <ValueStrip />

        {/* 4. Features Section */}
        <FeaturesSection />

        {/* 5. How It Works */}
        <HowItWorks />

        {/* 6. AI Tutor Deep-Dive Showcase */}
        <AITutorShowcase />

        {/* 7. Lecture -> Summary -> Quiz Workflow Transformation */}
        <StudyWorkflow />

        {/* 8. Analytics & Diagnostic Showcase */}
        <AnalyticsShowcase />

        {/* 9. Why Students Choose StudyAI */}
        <WhyStudyAI />

        {/* 10. Final Call to Action */}
        <FinalCTA />
      </main>

      {/* 11. Clean Professional Footer */}
      <LandingFooter />
    </div>
  );
}
