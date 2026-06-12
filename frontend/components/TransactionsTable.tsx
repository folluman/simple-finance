"use client";

import { useState } from "react";
import Image from "next/image";
import api from "../api";
import TransactionModal from "./TransactionModal";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: any | null;
  onSaveSuccess?: () => void;
}

interface TransactionsTableProps {
  transacoesFiltradas: any[];
  isLoading: boolean;
  onUpdateData: () => void;
}

export default function TransactionsTable({ transacoesFiltradas, isLoading, onUpdateData }: TransactionsTableProps) {
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);

  // Estados para Pop-ups de Exclusão
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);

  const handleEdit = (transaction: any) => {
    setTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTransactionToEdit(null);
    onUpdateData(); // Avisa a Home para recarregar tudo!
  };

  const openDeleteModal = (transaction: any) => {
    setTransactionToDelete(transaction);
    setDeleteStep(1);
  };

  const closeDeleteModal = () => {
    setTransactionToDelete(null);
    setDeleteStep(1);
  };

  const confirmDeleteStep1 = () => {
    if (!transactionToDelete) return;
    if (transactionToDelete.payment_method === 'Parcelado' && (transactionToDelete.installments?.total ?? 0) > 1) {
      setDeleteStep(2);
    } else {
      executeDelete(false); 
    }
  };

  const executeDelete = async (deleteAll: boolean) => {
    if (!transactionToDelete) return;
    try {
      await api.delete(`/api/transactions/${transactionToDelete._id}?deleteAll=${deleteAll}`);
      onUpdateData(); // Avisa a Home que apagou, para ela recalcular os cards!
      closeDeleteModal();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao excluir transação.");
    }
  };

  const formatarMoeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  const formatarData = (dataIso: string) => new Date(dataIso).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-line-gray p-4 shadow-md flex flex-col gap-6 md:p-6 xl:h-full relative">
      
      <div className="flex flex-col justify-center items-center gap-4 lg:flex-row lg:justify-between xl:items-center">
        <h2 className="text-primary-color-green font-bold text-xl md:text-2xl">Transações</h2>
      </div>

      <div className="flex-1 min-h-0 overflow-auto w-full border-2 border-solid border-line-gray px-4 pb-4 rounded-2xl custom-scrollbar">
        <table className="w-full text-left min-w-175 relative">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-line-gray">
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Nome</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Data</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Valor</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Pagamento</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Tipo</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm">Categoria</th>
              <th className="py-4 px-2 text-primary-color-green font-semibold text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500 font-medium">Carregando dados...</td></tr>
            ) : transacoesFiltradas.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500 font-medium">Nenhum lançamento encontrado.</td></tr>
            ) : (
              transacoesFiltradas.map((item) => {
                const partesTexto = item.descript ? item.descript.split(" - ") : ["Sem nome"];
                let textoPagamento = item.payment_method || "-";
                if (item.payment_method === "Parcelado" && (item.installments?.total ?? 0) > 1) {
                  textoPagamento = `Parcelado (${item.installments?.current}/${item.installments?.total})`;
                }

                return (
                  <tr key={item._id} className="border-b border-line-gray last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-2 text-text-login font-bold text-sm">{partesTexto[0]}</td>
                    <td className="py-4 px-2 text-text-login font-medium text-sm">{formatarData(item.transaction_date)}</td>
                    <td className={`py-4 px-2 font-bold text-sm ${item.type === 'receita' ? 'text-primary-color-green' : 'text-text-login'}`}>
                      {item.type === 'receita' ? '+' : ''} {formatarMoeda(item.value)}
                    </td>
                    <td className="py-4 px-2 text-text-login font-medium text-sm text-gray-600">{textoPagamento}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${item.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.type}</span>
                    </td>
                    <td className="py-4 px-2 font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.category_id?.cor_hex || '#CCC' }}></span>
                        <span className="text-text-login">{item.category_id?.category_name || "Sem categoria"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">✏️</button>
                        <button onClick={() => openDeleteModal(item)} className="text-red-500 hover:text-red-700 transition-colors" title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TransactionModal 
        isOpen={isEditModalOpen} 
        onClose={() => { 
          setIsEditModalOpen(false); 
          setTransactionToEdit(null); 
        }} // Agora só fecha e limpa o estado
        transactionToEdit={transactionToEdit}
        onSaveSuccess={onUpdateData} // Avisa a Home para recarregar tudo!
      />

      {/* POP-UPS DE EXCLUSÃO (Idênticos aos anteriores) */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col items-center text-center">
            
            <button onClick={closeDeleteModal} className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            
            {deleteStep === 1 ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-red-500 text-2xl">🗑️</span>
                </div>
                <h2 className="text-xl font-bold text-primary-color-green mb-2">Atenção!</h2>
                <p className="text-text-login font-medium text-sm mb-6">
                  Certeza que você quer excluir essa transação?
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={closeDeleteModal} className="flex-1 py-3 bg-line-gray text-primary-color-green font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button onClick={confirmDeleteStep1} className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors">Sim, excluir</button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-orange-500 text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-primary-color-green mb-2">Excluir Parcelas</h2>
                <p className="text-text-login font-medium text-sm mb-6">
                  Você quer excluir somente essa transação ou todas que estão com o mesmo nome?
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => executeDelete(false)} className="w-full py-3 border-2 border-line-gray text-primary-color-green font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors">Somente essa transação</button>
                  <button onClick={() => executeDelete(true)} className="w-full py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors shadow-sm">Excluir TODAS as parcelas</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}