import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[min(78vw,420px)] perspective-[900px] md:w-[min(52vw,640px)] md:perspective-[1200px] lg:right-4"
      >
        <div className="mannequin-turn absolute -right-6 top-[58%] h-[85vh] w-auto origin-center -translate-y-1/2 md:right-0 md:top-1/2 md:h-[112vh]">
          <Image
            src="/atelier-form.png"
            alt=""
            priority
            width={683}
            height={1024}
            className="h-full w-auto select-none opacity-[0.32] mix-blend-multiply md:opacity-[0.42]"
          />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-vynedres-paper via-vynedres-paper/80 to-vynedres-paper/40 md:bg-gradient-to-r md:from-vynedres-paper md:via-vynedres-paper/55 md:to-transparent"
      />
      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12 md:py-16">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-luxe text-vynedres-golddeep">
          Bespoke Fit Intelligence
        </p>
        <h1 className="mt-4 font-display text-6xl font-light leading-[0.95] tracking-tight text-vynedres-ink md:text-7xl">
          VYNEDRES
          <span className="block italic text-gold-sheen">Atelier</span>
        </h1>
        <div className="rule-gold mt-6 max-w-xs" />
        <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-vynedres-ink/65">
          The quiet operating system for the modern atelier. Hold every client,
          measurement and fitting in one place — and see how a garment truly comes
          to fit, from first measure to final delivery.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        <HomeCard
          index="I"
          href="/studio/vynedres"
          title="Studio"
          body="For tailors and fashion houses — clients, orders, the production pipeline and the Fit Graph behind every garment."
          cta="Enter the studio"
        />
        <HomeCard
          index="II"
          href="/portal/vynedres"
          title="Client Portal"
          body="For your clients — follow an order's progress and submit measurements from home, in confidence."
          cta="View the client experience"
        />
      </section>

      <footer className="mt-auto flex items-center gap-4 pt-16 text-xs font-light tracking-wide text-vynedres-ink/40">
        <span>Bespoke · Made to measure</span>
        <span className="h-px flex-1 bg-vynedres-ink/10" />
        <span>VYNEDRES Atelier</span>
      </footer>
      </main>
    </div>
  );
}

function HomeCard({
  index,
  href,
  title,
  body,
  cta,
}: {
  index: string;
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border border-vynedres-ink/[0.1] bg-vynedres-paper/45 p-8 shadow-[0_1px_2px_rgba(33,28,20,0.03)] backdrop-blur-[2px] transition-all duration-500 hover:border-vynedres-gold/45 hover:bg-vynedres-paper/60 hover:shadow-[0_12px_40px_-12px_rgba(150,113,47,0.22)]"
    >
      <span className="absolute right-6 top-6 font-display text-3xl font-light text-vynedres-ink/10 transition-colors duration-500 group-hover:text-vynedres-golddeep/50">
        {index}
      </span>
      <h2 className="font-display text-3xl font-light text-vynedres-ink">
        {title}
      </h2>
      <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-vynedres-ink/60">
        {body}
      </p>
      <span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-vynedres-golddeep">
        {cta}
        <span className="transition-transform duration-500 group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
