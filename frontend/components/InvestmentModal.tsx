"use client";

import { useState, useEffect } from "react";
import api from "../api";
import PlatformModal from "./PlatformModal";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentToEdit?: any | null;
  onSaveSuccess?: () => void;
}

interface FormErrors {
  data?: boolean;
  valor?: boolean;
  plataforma?: boolean;
}
interface PlatformBanco {
  _id: string;
  platform_name: string;
  cor_hex: string;
}

export default function InvestmentModal({
  isOpen,
  onClose,
  investmentToEdit,
  onSaveSuccess,
}: InvestmentModalProps) {
  const [tipo, setTipo] = useState<"Aporte" | "Rendimento">("Aporte");
  const [plataformaId, setPlataformaId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformBanco[]>([]);

  const fetchPlataformas = async () => {
    try {
      const response = await api.get(`/api/platforms/list`);
      setPlatforms(response.data);
    } catch (error) {
      console.error("Erro ao buscar plataformas:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlataformas();
      setErrors({});

      if (investmentToEdit) {
        setTipo(
          investmentToEdit.type === "rendimento" ? "Rendimento" : "Aporte",
        );

        // CORREÇÃO AQUI: Se for um objeto, pega o ._id, se for string, pega direto
        const platId =
          typeof investmentToEdit.platform_id === "object" &&
          investmentToEdit.platform_id !== null
            ? investmentToEdit.platform_id._id
            : investmentToEdit.platform_id || "";

        setPlataformaId(platId);

        const formatter = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
        setValor(formatter.format(investmentToEdit.value));

        const d = new Date(investmentToEdit.investment_date);
        const isoDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        setData(isoDate);
      } else {
        setTipo("Aporte");
        setPlataformaId("");
        setValor("");
        setData("");
      }
    }
  }, [isOpen, investmentToEdit]);

  useEffect(() => {
    if (!isPlatformModalOpen && isOpen) {
      fetchPlataformas();
    }
  }, [isPlatformModalOpen]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue === "") {
      setValor("");
      return;
    }
    const numericValue = parseInt(rawValue, 10) / 100;
    setValor(
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(numericValue),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!data.trim()) newErrors.data = true;
    if (!valor.trim() || valor === "R$ 0,00") newErrors.valor = true;
    if (!plataformaId) newErrors.plataforma = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const numericValor = parseFloat(
          valor.replace(/[R$\s\.]/g, "").replace(",", "."),
        );

        const payload = {
          type: tipo.toLowerCase(),
          platform_id: plataformaId,
          value: numericValor,
          investment_date: data,
        };
        
        if (investmentToEdit) {
          await api.put(`/api/investment/${investmentToEdit._id}`, payload);
        } else {
          await api.post(`/api/investment/post`, payload);
        }

        console.log("Payload limpo enviado para a API:", payload);

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        onClose();
      } catch (error: any) {
        console.error("Erro ao salvar investimento:", error);
        alert("Ocorreu um erro ao salvar o investimento.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-125 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-primary-color-green mb-6">
          {investmentToEdit ? "Editar investimento" : "Novo investimento"}
        </h2>

        <form className="flex flex-col gap-5 p-2">
          <div className="flex gap-4 p-1 bg-line-gray rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTipo("Aporte");
                setErrors({ ...errors, plataforma: false });
              }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipo === "Aporte" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}
            >
              Aporte
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo("Rendimento");
                setErrors({ ...errors, plataforma: false });
              }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipo === "Rendimento" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}
            >
              Rendimento
            </button>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label className="text-primary-color-green font-semibold text-sm">
              Plataforma
            </label>
            <div className="flex flex-row items-center gap-3 w-full">
              <select
                value={plataformaId}
                onChange={(e) => {
                  setPlataformaId(e.target.value);
                  setErrors({ ...errors, plataforma: false });
                }}
                className={`bg-line-gray border rounded-xl p-3.5 outline-none transition-all focus:ring-1 focus:ring-primary-color-green text-sm text-primary-color-green font-medium flex-1 ${errors.plataforma ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`}
              >
                <option value="" disabled>
                  Selecione a plataforma
                </option>
                {platforms.map((plat) => (
                  <option key={plat._id} value={plat._id}>
                    {plat.platform_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsPlatformModalOpen(true)}
                className="bg-[#049680] text-secondary-color-green w-12 h-[48px] shrink-0 flex items-center justify-center rounded-xl hover:opacity-90 font-bold text-2xl"
                title="Gerenciar Plataformas"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-primary-color-green font-semibold text-sm">
                Valor
              </label>
              <input
                type="text"
                value={valor}
                onChange={handleCurrencyChange}
                placeholder="R$ 0,00"
                className={`bg-line-gray border rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm font-semibold text-primary-color-green ${errors.valor ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`}
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-primary-color-green font-semibold text-sm">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={`bg-line-gray border rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm font-medium text-primary-color-green ${errors.data ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-primary-color-green text-secondary-color-green font-semibold text-base py-3.5 w-full rounded-xl hover:opacity-95 shadow-md mt-4"
          >
            {investmentToEdit ? "Salvar Alterações" : "Salvar investimento"}
          </button>
        </form>
      </div>

      <PlatformModal
        isOpen={isPlatformModalOpen}
        onClose={() => setIsPlatformModalOpen(false)}
      />
    </div>
  );
}
