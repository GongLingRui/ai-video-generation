import { FloatingOrbs, Navbar, HeroSection } from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <FloatingOrbs />
      <Navbar />
      <HeroSection />
    </div>
  )
}
