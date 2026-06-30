import Image from "next/image";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#2E3135] flex flex-col items-center justify-center px-6 text-white">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/img/logo.png"
          alt="Logo"
          width={184}
          height={60}
          priority
        />
      </div>

      {/* Icon */}
      <div className="mb-8 opacity-60">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-20 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
       Site down
      </h1>

      {/* Subheading */}
      <p className="text-lg md:text-xl text-white/70 text-center max-w-xl mb-10">
        Your site is currently down 
      </p>

      {/* Divider */}
      <div className="w-16 h-px bg-white/30 mb-10" />

      {/* Contact nudge
      <p className="text-sm text-white/50 text-center">
        For urgent enquiries, reach us at{" "}
        <a
          href="mailto:info@yourfreightpartner.com"
          className="text-white underline underline-offset-4 hover:text-white/80 transition-colors"
        >
          
        </a>
      </p> */}
    </div>
  );
}
