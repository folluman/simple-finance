"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CategoryModal from "./CategoryModal";
import api from "../api";
import CryptoJS from 'crypto-js';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: any | null;
  onSaveSuccess?: () => void;
}

interface FormErrors { nome?: boolean; data?: boolean; valor?: boolean; qtdParcelas?: boolean; categoria?: boolean; }
interface CategoriaDoBanco { _id: string; category_name: string; category_type: string; cor_hex: string; }

export default function TransactionModal({ isOpen, onClose, transactionToEdit, onSaveSuccess }: TransactionModalProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [tipoGeral, setTipoGeral] = useState<"Receita" | "Despesa">("Despesa");
  const [tipoDespesa, setTipoDespesa] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("À Vista");
  const [categorias, setCategorias] = useState<CategoriaDoBanco[]>([]);

  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [comentario, setComentario] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const fetchCategorias = async () => {
    try {
      const response = await api.get(`/api/categories/list`);
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategorias(); 
      setErrors({});

      if (transactionToEdit) {
        // MODO EDIÇÃO: Preenche os dados
        setTipoGeral(transactionToEdit.type === "receita" ? "Receita" : "Despesa");
        setTipoDespesa(transactionToEdit.category_id?._id || "");
        setTipoPagamento(transactionToEdit.payment_method || "À Vista");
        
        // Separa Nome e Comentário
        const partesTexto = transactionToEdit.descript ? transactionToEdit.descript.split(" - ") : [""];
        setNome(partesTexto[0] || "");
        setComentario(partesTexto.length > 1 ? partesTexto.slice(1).join(" - ") : "");

        // Formata o valor para a máscara R$ X,XX
        const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        setValor(formatter.format(transactionToEdit.value));

        // Formata a data para o input date (YYYY-MM-DD)
        const d = new Date(transactionToEdit.transaction_date);
        const isoDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        setData(isoDate);

        // Se tiver parcelas
        if (transactionToEdit.installments?.total) {
          setQtdParcelas(transactionToEdit.installments.total.toString());
        } else {
          setQtdParcelas("");
        }

      } else {
        setTipoGeral("Despesa");
        setTipoDespesa("");
        setTipoPagamento("À Vista");
        setNome("");
        setData("");
        setValor("");
        setComentario("");
        setQtdParcelas("");
      }
    }
  }, [isOpen, transactionToEdit]);

  useEffect(() => {
    if (!isCategoryModalOpen && isOpen) fetchCategorias();
  }, [isCategoryModalOpen]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") { setValor(""); return; }
    const numericValue = parseInt(value, 10) / 100;
    setValor(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numericValue));
  };

  const calcularTotalParcelado = () => {
    if (!valor || !qtdParcelas) return "R$ 0,00";
    const numericValor = parseFloat(valor.replace(/[R$\s\.]/g, "").replace(",", "."));
    const total = numericValor * parseInt(qtdParcelas, 10);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!nome.trim()) newErrors.nome = true;
    if (!data.trim()) newErrors.data = true;
    if (!valor.trim() || valor === "R$ 0,00") newErrors.valor = true;
    if (!tipoDespesa) newErrors.categoria = true;

    if (tipoGeral === "Despesa" && tipoPagamento === "Parcelado") {
      if (!qtdParcelas.trim() || parseInt(qtdParcelas) <= 0) newErrors.qtdParcelas = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const numericValor = parseFloat(valor.replace(/[R$\s\.]/g, "").replace(",", "."));
        const descricaoCompleta = comentario ? `${nome} - ${comentario}` : nome;

        const payload = {
          type: tipoGeral.toLowerCase(),
          category_id: tipoDespesa,
          value: numericValor,
          transaction_date: data,
          descript: descricaoCompleta,
          payment_method: tipoGeral === "Despesa" ? tipoPagamento : undefined,
          total_installments: tipoPagamento === "Parcelado" ? parseInt(qtdParcelas, 10) : 1
        };

        // Envia o payload DIRETO, sem envelopar em { data: ... }
        if (transactionToEdit) {
           await api.put(`/api/transactions/${transactionToEdit._id}`, payload);
           console.log("Editado com sucesso!");
        } else {
           await api.post(`/api/transactions/post`, payload);
           console.log("Criado com sucesso!");
        }

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        onClose(); 
      } catch (error: any) {
        console.error("Erro ao salvar transação:", error);
        alert("Ocorreu um erro ao salvar a transação.");
      }
    }
  };

  if (!isOpen) return null;

  const categoriasFiltradas = categorias.filter((cat) => cat.category_type === tipoGeral.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-125 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

        <h2 className="text-2xl font-bold text-primary-color-green mb-6">
          {transactionToEdit ? "Editar transação" : "Nova transação"}
        </h2>

        <form className="flex flex-col gap-5 p-2">
          {/* Toggle de Tipo */}
          <div className="flex gap-4 p-1 bg-line-gray rounded-xl">
            <button type="button" onClick={() => { setTipoGeral("Despesa"); setTipoDespesa(""); setErrors({ ...errors, categoria: false }); }} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipoGeral === "Despesa" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}>Despesa</button>
            <button type="button" onClick={() => { setTipoGeral("Receita"); setTipoDespesa(""); setErrors({ ...errors, categoria: false }); }} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipoGeral === "Receita" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}>Receita</button>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-primary-color-green font-semibold text-sm">Categoria</label>
            <div className="flex flex-row items-center gap-3 w-full">
              <select value={tipoDespesa} onChange={(e) => { setTipoDespesa(e.target.value); setErrors({ ...errors, categoria: false }); }} className={`bg-line-gray border rounded-xl p-3.5 outline-none transition-all focus:ring-1 focus:ring-primary-color-green text-sm text-primary-color-green font-medium flex-1 ${errors.categoria ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`}>
                <option value="" disabled>Selecione a categoria</option>
                {categoriasFiltradas.map((cat) => ( <option key={cat._id} value={cat._id}>{cat.category_name}</option> ))}
              </select>
              {/* <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="bg-[#049680] text-secondary-color-green w-12 h-[48px] shrink-0 flex items-center justify-center rounded-xl hover:opacity-90 font-bold text-2xl" title="Gerenciar Categorias">⛯</button> */}
              <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="bg-[#049680] text-secondary-color-green w-12 h-[48px] shrink-0 flex items-center justify-center rounded-xl hover:opacity-90 font-bold text-2xl" title="Gerenciar Categorias">+</button>
            </div>
          </div>

          {/* Opção À Vista / Parcelado */}
          {tipoGeral === "Despesa" && (
            <div className="flex gap-4 p-1 bg-line-gray rounded-xl mt-2">
              <button type="button" onClick={() => setTipoPagamento("À Vista")} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipoPagamento === "À Vista" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}>À Vista</button>
              <button type="button" onClick={() => setTipoPagamento("Parcelado")} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${tipoPagamento === "Parcelado" ? "bg-white text-primary-color-green shadow-sm" : "text-gray-500"}`}>Parcelado</button>
            </div>
          )}

          {/* Valor e Data */}
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-primary-color-green font-semibold text-sm">{tipoPagamento === "Parcelado" && tipoGeral === "Despesa" ? "Valor da Parcela" : "Valor"}</label>
              <input type="text" value={valor} onChange={handleCurrencyChange} placeholder="R$ 0,00" className={`bg-line-gray border rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm font-semibold text-primary-color-green ${errors.valor ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`} />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-primary-color-green font-semibold text-sm">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`bg-line-gray border rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm font-medium text-primary-color-green ${errors.data ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`} />
            </div>
          </div>

          {/* Parcelas e Valor Total */}
          {tipoGeral === "Despesa" && tipoPagamento === "Parcelado" && (
            <div className="flex flex-col md:flex-row gap-5 bg-[#E2F7D8] p-4 rounded-xl border border-secondary-color-green">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-primary-color-green font-semibold text-sm">Qtd. Parcelas</label>
                <input type="number" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} placeholder="Ex: 12" className={`bg-white border rounded-xl p-3 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm ${errors.qtdParcelas ? "border-red-500 ring-1 ring-red-500" : "border-transparent"}`} />
              </div>
              <div className="flex flex-col gap-2 w-full justify-center">
                <label className="text-primary-color-green font-semibold text-sm">Valor Total</label>
                <span className="text-lg font-bold text-primary-color-green">{calcularTotalParcelado()}</span>
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-primary-color-green font-semibold text-sm">Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Delivery com Ifood..." className={`bg-line-gray border rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm ${errors.nome ? "border-red-500 ring-1 ring-red-500" : "border-line-gray"}`} />
          </div>

          {/* Comentário */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-primary-color-green font-semibold text-sm">Comentário <span className="text-gray-400 font-normal">(Opcional)</span></label>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Adicione um detalhe..." rows={2} className="bg-line-gray border border-line-gray rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary-color-green w-full text-sm resize-none custom-scrollbar" />
          </div>

          <button onClick={handleSave} className="bg-primary-color-green text-secondary-color-green font-semibold text-base py-3.5 w-full rounded-xl hover:opacity-95 shadow-md mt-2">
            {transactionToEdit ? "Salvar Alterações" : "Salvar lançamento"}
          </button>
        </form>
      </div>
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} tipoGeralAtual={tipoGeral} />
    </div>
  );
}