import Image from "next/image";
import Link from "next/link";
import { Logo } from "../components/Logo";
import HeroImage from "../public/hero.webp";

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
      <Image
        src={HeroImage}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/55 to-cyan-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.45)_100%)]" />

      <div className="relative z-10 px-6 text-center max-w-2xl">
        <div className="animate-fade-up">
          <Logo size="large" />
        </div>

        <p className="animate-fade-up animate-delay-1 mt-6 text-lg md:text-xl text-slate-200/90 leading-relaxed font-light">
          The AI-powered SaaS solution to generate SEO-optimized blog posts in
          minutes. High-quality content, without sacrificing your time.
        </p>

        <div className="animate-fade-up animate-delay-2 mt-10 flex flex-col items-center gap-3">
          <Link
            href="/post/new"
            className="btn max-w-xs hover:no-underline shadow-lg shadow-green-900/40 hover:scale-[1.02] active:scale-[0.99] transition-transform"
          >
            Begin
          </Link>
          <span className="text-sm text-slate-400">
            Sign in to start generating posts
          </span>
        </div>
      </div>
    </div>
  );
}
