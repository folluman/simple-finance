"use client";

import Image from "next/image";
import CardFinance from "@/components/CardFinance";
import CustomPieChart from "@/components/CustomPieChart";
import YieldBarChart from "@/components/YieldBarChart";
import CustomBarChartDuo from "@/components/CustomBarChartDuo";
import InvestmentModal from "@/components/InvestmentModal";
import PlatformInvestmentsModal from "@/components/PlatformInvestmentsModal";
import { useState, useEffect } from "react";
import api from "../../../api";

interface PlataformaInfo {
  _id: string;
  platform_name: string;
  cor_hex: string;
}

interface Investimento {
  _id: string;
  value: number;
  type: string;
  platform_id: PlataformaInfo | null;
  investment_date: string;
}

export default function Investments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investimento | null>(null); // ESTADO PARA EDIÇÃO
  const [investments, setInvestments] = useState<Investimento[]>([]);
  
  const [platformToDelete, setPlatformToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // ESTADOS PARA O MODAL DA TABELA
  const [platformToManage, setPlatformToManage] = useState<{ id: string; name: string } | null>(null);

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPlatformChart, setSelectedPlatformChart] = useState<string>("Todas");

  const fetchInvestments = async () => {
    try {
      const response = await api.get("/api/investment/list");
      setInvestments(response.data);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const availableYears = investments.reduce((acc: string[], inv) => {
    if (inv.investment_date) {
      const year = new Date(inv.investment_date).getUTCFullYear().toString();
      if (!acc.includes(year)) acc.push(year);
    }
    return acc;
  }, []).sort().reverse();

  const availablePlatformsChart = investments.reduce((acc: { id: string, name: string }[], inv) => {
    if (inv.platform_id && !acc.some(p => p.id === inv.platform_id!._id)) {
      acc.push({ id: inv.platform_id._id, name: inv.platform_id.platform_name });
    }
    return acc;
  }, []);

  const platformTotals = investments.reduce(
    (acc: Record<string, { id: string; name: string; total: number; cor: string }>, inv) => {
      const platformName = inv.platform_id?.platform_name || "Desconhecida";
      const platformId = inv.platform_id?._id || "unknown";
      const platformCor = inv.platform_id?.cor_hex || "#ccc";

      if (!acc[platformId]) {
        acc[platformId] = { id: platformId, name: platformName, total: 0, cor: platformCor };
      }

      acc[platformId].total += inv.value;
      return acc;
    },
    {}
  );

  const cardsData = Object.values(platformTotals);

  const dynamicPieChartData = cardsData.map((card) => ({
    name: card.name,
    value: card.total,
    fill: card.cor,
  }));

  const yieldData = investments.reduce(
    (acc, inv) => {
      if (inv.type === "aporte") acc.aportes += inv.value;
      if (inv.type === "rendimento") acc.rendimentos += inv.value;
      return acc;
    },
    { aportes: 0, rendimentos: 0 },
  );

  type MonthlyInvestmentData = { mes: string; Aportes: number; Rendimentos: number; };

  const dynamicMonthlyInvestments: MonthlyInvestmentData[] = [
    { mes: "Jan", Aportes: 0, Rendimentos: 0 }, { mes: "Fev", Aportes: 0, Rendimentos: 0 },
    { mes: "Mar", Aportes: 0, Rendimentos: 0 }, { mes: "Abr", Aportes: 0, Rendimentos: 0 },
    { mes: "Mai", Aportes: 0, Rendimentos: 0 }, { mes: "Jun", Aportes: 0, Rendimentos: 0 },
    { mes: "Jul", Aportes: 0, Rendimentos: 0 }, { mes: "Ago", Aportes: 0, Rendimentos: 0 },
    { mes: "Set", Aportes: 0, Rendimentos: 0 }, { mes: "Out", Aportes: 0, Rendimentos: 0 },
    { mes: "Nov", Aportes: 0, Rendimentos: 0 }, { mes: "Dez", Aportes: 0, Rendimentos: 0 },
  ];

  investments.forEach((inv) => {
    if (inv.investment_date) {
      const date = new Date(inv.investment_date);
      const invYear = date.getUTCFullYear().toString();
      const invPlatformId = inv.platform_id?._id || "unknown";

      const matchYear = selectedYear === "Todas" || invYear === selectedYear;
      const matchPlatform = selectedPlatformChart === "Todas" || invPlatformId === selectedPlatformChart;

      if (matchYear && matchPlatform) {
        const monthIndex = date.getUTCMonth();
        if (inv.type === "aporte") dynamicMonthlyInvestments[monthIndex].Aportes += inv.value;
        else if (inv.type === "rendimento") dynamicMonthlyInvestments[monthIndex].Rendimentos += inv.value;
      }
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const confirmDelete = async () => {
    if (!platformToDelete || platformToDelete.id === "unknown") return;
    try {
      await api.delete(`/api/investment/platform/${platformToDelete.id}`);
      setPlatformToDelete(null);
      fetchInvestments();
    } catch (error) {
      console.error("Erro ao excluir", error);
      alert("Ocorreu um erro ao tentar excluir os investimentos.");
      setPlatformToDelete(null);
    }
  };

  // FUNÇÃO PARA ABRIR O MODAL PRINCIPAL EM MODO DE EDIÇÃO
  const handleEditInvestment = (inv: Investimento) => {
    setInvestmentToEdit(inv);
    setIsModalOpen(true);
  };

  // FILTRA OS INVESTIMENTOS DA PLATAFORMA CLICADA PARA ENVIAR À TABELA
  const currentPlatformInvestments = platformToManage
    ? investments.filter(inv => inv.platform_id?._id === platformToManage.id)
    : [];

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-8 overflow-y-auto overflow-x-hidden relative">
      <header className="flex flex-col items-center w-full gap-4 p-5 bg-line-gray rounded-2xl shadow-md md:items-center md:p-6 md:flex-row md:justify-between md:gap-6 shrink-0">
        <div className="flex flex-col md:w-4/6">
          <h2 className="text-2xl font-bold text-center text-primary-color-green md:text-left md:text-3xl">Investimentos</h2>
          <p className="mt-1 text-sm text-center text-primary-color-green md:text-left">Análise detalhada dos seus investimentos.</p>
        </div>
        <div className="flex flex-col w-full gap-4 md:w-2/6 lg:flex-row lg:justify-end">
          <button
            onClick={() => { setInvestmentToEdit(null); setIsModalOpen(true); }}
            className="flex items-center justify-center w-full gap-4 p-3 text-sm font-semibold transition-opacity cursor-pointer bg-primary-color-green md:px-6 rounded-xl text-secondary-color-green lg:w-auto hover:opacity-90"
          >
            <Image src="/img-add.png" alt="Ícone" height={20} width={20} />
            Adicionar
          </button>
        </div>
      </header>

      {cardsData.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 md:gap-6 shrink-0">
          {cardsData.map((card, index) => (
            <div key={index} className="relative group">
              <CardFinance value={formatCurrency(card.total)} title={card.name} />

              {card.id !== "unknown" && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* BOTÃO PARA ABRIR A TABELA (GERENCIAR INVESTIMENTOS) */}
                  <button
                    onClick={() => setPlatformToManage({ id: card.id, name: card.name })}
                    className="text-blue-500 bg-blue-50 p-2 rounded-full hover:bg-blue-100 text-xs font-bold"
                    title="Gerenciar investimentos desta plataforma"
                  >
                    ✏️
                  </button>
                  {/* BOTÃO EXCLUIR TODOS */}
                  <button
                    onClick={() => setPlatformToDelete({ id: card.id, name: card.name })}
                    className="text-red-500 bg-red-50 p-2 rounded-full hover:bg-red-100 text-xs font-bold"
                    title="Excluir todos os investimentos desta plataforma"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {cardsData.length === 0 && (
        <div className="flex items-center justify-center w-full p-10 bg-white rounded-2xl shadow-sm border border-line-gray">
          <p className="text-gray-500 font-medium">Você ainda não possui investimentos cadastrados.</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:flex-1 xl:min-h-75 shrink-0">
        <CustomPieChart title="Investimentos atuais" data={dynamicPieChartData.length > 0 ? dynamicPieChartData : [{ name: "Sem dados", value: 0 }]} />
        <YieldBarChart investments={investments} />
      </section>

      <section className="w-full pb-2 overflow-x-auto xl:flex-1 xl:min-h-75 shrink-0">
        <CustomBarChartDuo
          title="Total Investido por mês"
          tooltipLabel="Total Investido"
          data={dynamicMonthlyInvestments}
          filters={[
            { label: "Ano", value: selectedYear, onChange: (e) => setSelectedYear(e.target.value), options: availableYears.map(year => ({ id: year, name: year })) },
            { label: "Plataforma", value: selectedPlatformChart, onChange: (e) => setSelectedPlatformChart(e.target.value), options: availablePlatformsChart },
          ]}
        />
      </section>

      {/* MODAL ORIGINAL ADAPTADO PARA RECEBER O investmentToEdit */}
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setInvestmentToEdit(null); }}
        investmentToEdit={investmentToEdit}
        onSaveSuccess={fetchInvestments}
      />

      {/* NOVO MODAL DA TABELA */}
      <PlatformInvestmentsModal
        isOpen={!!platformToManage}
        onClose={() => setPlatformToManage(null)}
        platformName={platformToManage?.name || ""}
        investments={currentPlatformInvestments}
        onEditClick={handleEditInvestment}
        refreshData={fetchInvestments}
      />

      {platformToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">🗑️</div>
            <h3 className="text-xl font-bold text-primary-color-green mb-2">Excluir Investimentos?</h3>
            <p className="text-sm text-gray-600 mb-6 font-medium">Tem certeza que deseja excluir <strong className="text-red-500">TODOS</strong> os investimentos feitos na plataforma <strong>"{platformToDelete.name}"</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setPlatformToDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors shadow-md">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}