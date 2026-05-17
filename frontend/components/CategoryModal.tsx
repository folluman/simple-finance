"use client";

import { useState, useEffect } from "react";
import api from "../api";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoGeralAtual: string; 
}

export default function CategoryModal({ isOpen, onClose, tipoGeralAtual }: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [corHex, setCorHex] = useState("#2ECC71");
  const [categorias, setCategorias] = useState<any[]>([]);
  
  // Estados para Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estados para Pop-ups
  const [msgErro, setMsgErro] = useState(""); 
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  const fetchCategorias = async () => {
    const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/list`, { withCredentials: true });
    setCategorias(res.data);
  };

  useEffect(() => { 
    if (isOpen) {
      fetchCategorias();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCategoryName("");
    setCorHex("#2ECC71");
    setEditingId(null);
    setMsgErro("");
    setCategoryToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingId) {
        await api.put(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingId}`, {
          category_name: categoryName,
          category_type: tipoGeralAtual.toLowerCase(),
          cor_hex: corHex
        }, { withCredentials: true });
      } else {
        await api.post(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/post`, {
          category_name: categoryName,
          category_type: tipoGeralAtual.toLowerCase(),
          cor_hex: corHex
        }, { withCredentials: true });
      }
      
      resetForm();
      fetchCategorias();
    } catch (error: any) {
      setMsgErro(error.response?.data?.error || "Erro ao salvar a categoria.");
    }
  };

  const handleEditClick = (cat: any) => {
    setCategoryName(cat.category_name);
    setCorHex(cat.cor_hex);
    setEditingId(cat._id);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/delete/${categoryToDelete._id}`, { withCredentials: true });
      setCategoryToDelete(null);
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao excluir", error);
      setMsgErro("Ocorreu um erro ao tentar excluir a categoria.");
      setCategoryToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">✕</button>
        
        <h2 className="text-xl font-bold text-primary-color-green mb-4">Gerenciar Categorias ({tipoGeralAtual})</h2>

        {/* Formulário de Criação / Edição */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6 bg-line-gray/30 p-4 rounded-2xl border border-line-gray">
          <label className="text-xs font-bold text-primary-color-green uppercase">
            {editingId ? "Editando categoria:" : "Nova categoria:"}
          </label>
          <input 
            type="text" 
            placeholder="Nome da categoria" 
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
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
              {editingId ? "Salvar Alteração" : "Adicionar Categoria"}
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
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Suas Categorias</p>
          
          {categorias.filter(c => c.category_type === tipoGeralAtual.toLowerCase()).length === 0 && (
             <p className="text-sm text-gray-500 text-center py-4">Nenhuma categoria encontrada.</p>
          )}

          {categorias.filter(c => c.category_type === tipoGeralAtual.toLowerCase()).map(cat => (
            <div key={cat._id} className="flex items-center justify-between p-3 border-b border-line-gray last:border-0 hover:bg-zinc-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.cor_hex }}></div>
                <span className="text-sm font-medium text-text-login">{cat.category_name}</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleEditClick(cat)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">✏️</button>
                <button onClick={() => setCategoryToDelete(cat)} className="text-red-500 hover:text-red-700 transition-colors" title="Excluir">🗑️</button>
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
        {categoryToDelete && (
          <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">🗑️</div>
            <h3 className="text-xl font-bold text-primary-color-green mb-2">Excluir categoria?</h3>
            <p className="text-sm text-text-login mb-6 font-medium">
              Certeza que você quer excluir a categoria <strong className="text-primary-color-green">"{categoryToDelete.category_name}"</strong>?<br/><br/>
              <span className="text-gray-500 text-xs">As transações vinculadas a ela ficarão sem categoria.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setCategoryToDelete(null)} className="flex-1 py-3 bg-line-gray text-primary-color-green font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">
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