"use client";

import { useState, useEffect } from "react";
import api from "../api";

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformModal({ isOpen, onClose }: PlatformModalProps) {
  const [platformName, setPlatformName] = useState("");
  const [corHex, setCorHex] = useState("#2ECC71");
  const [plataformas, setPlataformas] = useState<any[]>([]);
  
  // Estados para Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estados para Pop-ups
  const [msgErro, setMsgErro] = useState(""); 
  const [platformToDelete, setPlatformToDelete] = useState<any | null>(null);

  const fetchPlataformas = async () => {
    try {
      const res = await api.get(`/api/platforms/list`);
      setPlataformas(res.data);
    } catch (error) {
      console.error("Erro ao buscar plataformas:", error);
    }
  };

  useEffect(() => { 
    if (isOpen) {
      fetchPlataformas();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setPlatformName("");
    setCorHex("#2ECC71");
    setEditingId(null);
    setMsgErro("");
    setPlatformToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformName.trim()) return;

    try {
      const payload = {
        platform_name: platformName,
        cor_hex: corHex
      };

      if (editingId) {
        await api.put(`/api/platforms/${editingId}`, payload);
      } else {
        await api.post(`/api/platforms/post`, payload);
      }
      
      resetForm();
      fetchPlataformas();
    } catch (error: any) {
      setMsgErro(error.response?.data?.error || "Erro ao salvar a plataforma.");
    }
  };

  const handleEditClick = (plat: any) => {
    setPlatformName(plat.plataform_name);
    setCorHex(plat.cor_hex);
    setEditingId(plat._id);
  };

  const confirmDelete = async () => {
    if (!platformToDelete) return;
    
    try {
      await api.delete(`/api/platforms/delete/${platformToDelete._id}`);
      setPlatformToDelete(null);
      fetchPlataformas();
    } catch (error) {
      console.error("Erro ao excluir", error);
      setMsgErro("Ocorreu um erro ao tentar excluir a plataforma.");
      setPlatformToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">✕</button>
        
        <h2 className="text-xl font-bold text-primary-color-green mb-4">Gerenciar Plataformas de Investimentos</h2>

        {/* Formulário de Criação / Edição */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6 bg-line-gray/30 p-4 rounded-2xl border border-line-gray">
          <label className="text-xs font-bold text-primary-color-green uppercase">
            {editingId ? "Editando plataforma:" : "Nova plataforma:"}
          </label>
          <input 
            type="text" 
            placeholder="Nome da plataforma de investimento" 
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="p-3 rounded-xl border border-line-gray outline-none focus:ring-1 focus:ring-primary-color-green text-sm"
          />
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={corHex} 
              onChange={(e) => setCorHex(e.target.value)} 
              title="Escolha a cor"
              className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full" 
            />
            <button className={`flex-1 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${editingId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-primary-color-green hover:opacity-90'}`}>
              {editingId ? "Salvar Alteração" : "Adicionar Plataforma"}
            </button>
            
            {editingId && (
              <button type="button" onClick={resetForm} className="px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-200 rounded-xl">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Listagem para Editar/Excluir */}
        <div className="max-h-56 overflow-y-auto custom-scrollbar pr-2">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Suas Plataformas de Investimentos</p>
          
          {plataformas.length === 0 && (
             <p className="text-sm text-gray-500 text-center py-4">Nenhuma plataforma de investimento encontrada.</p>
          )}

          {plataformas.map(plat => (
            <div key={plat._id} className="flex items-center justify-between p-3 border-b border-line-gray last:border-0 hover:bg-zinc-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: plat.cor_hex }}></div>
                <span className="text-sm font-medium text-text-login">{plat.platform_name}</span>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => handleEditClick(plat)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">✏️</button>
                <button type="button" onClick={() => setPlatformToDelete(plat)} className="text-red-500 hover:text-red-700 transition-colors" title="Excluir">🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {/* --- POP-UP DE ERRO (DUPLICIDADE) --- */}
        {msgErro && (
          <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-10">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">⚠️</div>
            <h3 className="font-bold text-primary-color-green mb-2">Atenção</h3>
            <p className="text-sm text-text-login mb-6 font-medium">{msgErro}</p>
            <button onClick={() => setMsgErro("")} className="bg-primary-color-green text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all">Entendido</button>
          </div>
        )}

        {/* --- POP-UP CUSTOMIZADO DE EXCLUSÃO --- */}
        {platformToDelete && (
          <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">🗑️</div>
            <h3 className="text-xl font-bold text-primary-color-green mb-2">Excluir plataforma?</h3>
            <p className="text-sm text-text-login mb-6 font-medium">
              Certeza que você quer excluir a plataforma de investimento?<strong className="text-primary-color-green">"{platformToDelete.platform_name}"</strong>?<br/><br/>
              <span className="text-gray-500 text-xs">Os investimentos vinculados a ela ficarão sem plataforma.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setPlatformToDelete(null)} className="flex-1 py-3 bg-line-gray text-primary-color-green font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors">
                Sim, excluir
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}