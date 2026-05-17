"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../api";

export default function sideMenu({ children }: { children: React.ReactNode }) {
  const handleLogout = async () => {
    try {
      await api.post(
        `/api/users/logout`,
        {},
      );

      window.location.href = '/';

    } catch (error) {
      console.log("Erro ao fazer logout: ", error);
      alert("Não foi possível sair da conta no momento");
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const menuLinks = [
    { href: "/Home", label: "Início", icon: "/img-home.png" },
    { href: "/Dashboard", label: "Dashboard", icon: "/img-dashboard.png" },
    // { href: "/Investments", label: "Investimentos", icon: "/img-investments.png" },
  ];

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden lg:flex-row">
      {/* HEADER MOBILE */}

      <header className="lg:hidden flex items-center justify-between bg-primary-color-green p-6 shadow-md z-30 relative">
        <div className="flex items-center gap-2">
          <span className="text-xl text-secondary-color-green font-semibold">
           Simple<span className="text-white">Finance</span>
          </span>
          <Image src="/img-logo.png" alt="Logo" width={24} height={24} />
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-secondary-color-green cursor-pointer"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      {/* MENU MOBILE */}

      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ease-in-out ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} lg:hidden`}
      >
        {/* FUNDO ESCURO TRANSPARENTE */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500"
          onClick={closeMenu}
        ></div>

        {/* MENU LATERAL ANIMADO */}
        <aside
          className={`absolute top-0 left-0 w-64 h-full bg-primary-color-green flex flex-col p-6 shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            onClick={closeMenu}
            className="absolute top-4 right-4 text-secondary-color-green p-2 cursor-pointer"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2 mb-12 mt-4">
            <span className="text-2xl text-secondary-color-green font-semibold">
              Simple<span className="text-white">Finance</span>
            </span>
            <Image src="/img-logo.png" alt="Logo" width={24} height={24} />
          </div>

          <nav className="flex flex-col gap-8">
            {menuLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`flex items-center gap-3 text-md text-tertiary-color-green font-semibold hover:text-secondary-color-green transition-all duration-500 transform ${isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}`}
                style={{ transitionDelay: `${index * 100 + 200}ms` }}
              >
                <Image
                  src={link.icon}
                  alt={`Ícone ${link.label}`}
                  width={24}
                  height={24}
                />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-tertiary-color-green text-md font-semibold hover:text-secondary-color-green transition-colors mt-auto cursor-pointer"
          >
            <Image
              src="/img-exit.png"
              alt="Ícone sair"
              width={24}
              height={24}
            />
            Sair
          </button>
        </aside>
      </div>

      {/* MENU LATERAL DESKTOP */}

      <aside className="hidden w-52 bg-primary-color-green flex-col p-6 shadow-xl z-10 lg:flex xl:w-62">
        <div className="flex items-center gap-2 mb-12 mt-4">
          <span className="text-2xl text-secondary-color-green font-semibold">
            Simple<span className="text-white">Finance</span>
          </span>
          <Image src="/img-logo.png" alt="Logo" width={24} height={24} />
        </div>

        <nav className="flex flex-col gap-8">
          {menuLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 text-md text-tertiary-color-green font-semibold hover:text-secondary-color-green transition-colors"
            >
              <Image
                src={link.icon}
                alt={`Ícone ${link.label}`}
                width={24}
                height={24}
              />
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-tertiary-color-green text-md font-semibold hover:text-secondary-color-green transition-colors mt-auto cursor-pointer"
        >
          <Image src="/img-exit.png" alt="Ícone sair" width={24} height={24} />
          Sair
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
