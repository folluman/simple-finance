"use client";

import { useState } from "react";
import api from "../api";

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

interface PlatformInvestmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformName: string;
  investments: Investimento[];
  onEditClick: (investimento: Investimento) => void;
  refreshData: () => void;
}

export default function PlatformInvestmentsModal({
  isOpen,
  onClose,
  platformName,
  investments,
  onEditClick,
  refreshData,
}: PlatformInvestmentsModalProps) {
  // estado para controlar o pop-up de exclusao especifica
  const [investmentToDelete, setInvestmentToDelete] = useState<Investimento | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  };

  // funcao executada apos confirmar a exclusao no pop-up
  const confirmDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    try {
      // ajustado url para o plural /investments/
      await api.delete(`/api/investment/delete/${investmentToDelete._id}`);
      setInvestmentToDelete(null);
      refreshData();
    } catch (error) {
      console.error("Erro ao excluir investimento", error);
      alert("Erro ao excluir investimento.");
      setInvestmentToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-primary-color-green mb-6">
          Investimentos - {platformName}
        </h2>

        <div className="overflow-y-auto custom-scrollbar flex-1 border border-line-gray rounded-2xl relative">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-line-gray">
              <tr>
                <th className="p-4 text-sm font-bold text-primary-color-green">Data</th>
                <th className="p-4 text-sm font-bold text-primary-color-green">Valor</th>
                <th className="p-4 text-sm font-bold text-primary-color-green">Tipo</th>
                <th className="p-4 text-sm font-bold text-primary-color-green text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Nenhum investimento encontrado.
                  </td>
                </tr>
              ) : (
                investments.map((inv) => (
                  <tr key={inv._id} className="border-b border-line-gray hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-700 font-medium">{formatDate(inv.investment_date)}</td>
                    <td className="p-4 text-sm text-gray-700 font-bold">{formatCurrency(inv.value)}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg uppercase ${
                          inv.type === "aporte" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {inv.type}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-4">
                      <button
                        onClick={() => {
                          onEditClick(inv);
                          onClose();
                        }}
                        className="text-orange-400 hover:text-orange-600 transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setInvestmentToDelete(inv)} // dispara o pop-up customizado
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP CUSTOMIZADO PARA EXCLUSÃO DE UM INVESTIMENTO ÚNICO */}
      {investmentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-[70]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">🗑️</div>
            <h3 className="text-xl font-bold text-primary-color-green mb-2">Excluir Investimento?</h3>
            <p className="text-sm text-gray-600 mb-6 font-medium">
              Tem certeza que deseja excluir o {investmentToDelete.type} no valor de <strong className="text-red-500">{formatCurrency(investmentToDelete.value)}</strong> feito em {formatDate(investmentToDelete.investment_date)}?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setInvestmentToDelete(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteInvestment} 
                className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors shadow-md"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}