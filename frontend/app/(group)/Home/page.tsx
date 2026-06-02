"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CardFinance from "@/components/CardFinance";
import TransactionsTable from "@/components/TransactionsTable";
import TransactionModal from "@/components/TransactionModal";
import api from "../../../api";

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function Home() {
  // PEGA A DATA ATUAL
  const dataAtual = new Date();

  // CARREGA O NOME DO USUÁRIO NA HOME
  const [userName, setUserName] = useState("Carregando...");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ACIONA O BOTÃO DE TRANSAÇÃO E CATEGORIA
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // FILTROS DA TABELA
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroAno, setFiltroAno] = useState(
    dataAtual.getFullYear().toString(),
  );
  const [filtroMes, setFiltroMes] = useState(dataAtual.getMonth().toString());
  const [filtroTipoGeral, setFiltroTipoGeral] = useState("");
  const [filtroTipoPagamento, setFiltroTipoPagamento] = useState("");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const userRes = await api.get("/api/users/me");
      setUserName(userRes.data.name);

      const [transRes, catRes] = await Promise.all([
        api.get("/api/transactions/list"),
        api.get("/api/categories/list"),
      ]);

      setTransactions(transRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.log("Erro ao carregar dados: ", error);
      setUserName("Usuário");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const limparFiltros = () => {
    setFiltroCategoria("");
    setFiltroAno("");
    setFiltroMes("");
    setFiltroTipoGeral("");
    setFiltroTipoPagamento("");
  };

  // AÇÃO QUANDO MUDA O TIPO
  const handleMudancaTipoGeral = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroTipoGeral(e.target.value);
    setFiltroCategoria("");
    if (e.target.value === "receita") {
      setFiltroTipoPagamento("");
    }
  };

  // AÇÃO QUANDO MUDA A CATEGORIA
  const handleMudancaCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setFiltroCategoria(catId);

    if (catId) {
      const categoriaSelecionada = categorias.find((c) => c._id === catId);

      if (categoriaSelecionada) {
        setFiltroTipoGeral(categoriaSelecionada.category_type);

        if (categoriaSelecionada.category_type === "receita") {
          setFiltroTipoPagamento("");
        }
      }
    }
  };

  const categoriasParaFiltro = categorias.filter((cat) => {
    if (filtroTipoGeral) {
      return cat.category_type === filtroTipoGeral;
    }
    return true;
  });

  // GARANTE A ANO DE MÊS SEMPRE APARECERAM FILTRADOS
  const anosDisponiveis = Array.from(
    new Set([
      dataAtual.getFullYear(),
      ...transactions.map((t) => new Date(t.transaction_date).getUTCFullYear()),
    ]),
  ).sort((a, b) => b - a);

  const mesesDisponiveis = Array.from(
    new Set([
      dataAtual.getMonth(),
      ...transactions.map((t) => new Date(t.transaction_date).getUTCMonth()),
    ]),
  ).sort((a, b) => a - b);

  const transacoesFiltradas = transactions.filter((t) => {
    const dataTransacao = new Date(t.transaction_date);
    const bateCategoria = filtroCategoria
      ? t.category_id?._id === filtroCategoria
      : true;
    const bateAno = filtroAno
      ? dataTransacao.getUTCFullYear().toString() === filtroAno
      : true;
    const bateMes = filtroMes
      ? dataTransacao.getUTCMonth().toString() === filtroMes
      : true;
    const bateTipoGeral = filtroTipoGeral ? t.type === filtroTipoGeral : true;
    const bateTipoPagamento = filtroTipoPagamento
      ? t.payment_method === filtroTipoPagamento
      : true;
    return (
      bateCategoria && bateAno && bateMes && bateTipoGeral && bateTipoPagamento
    );
  });

  let receitaTotal = 0;
  let gastoTotal = 0;
  let saldoAnterior = 0;
  let exibirSaldoAnterior = false;

  transacoesFiltradas.forEach((t) => {
    if (t.type === "receita") receitaTotal += t.value;
    if (t.type === "despesa") gastoTotal += t.value;
  });

  const anoReferencia = filtroAno !== "" ? Number(filtroAno) : dataAtual.getUTCFullYear();
  const mesReferencia = filtroMes !== "" ? Number(filtroMes) : 0;

  if (filtroAno !== "" || filtroMes !== "") {
    exibirSaldoAnterior = true;

    transactions.forEach(t => {
      const dataTransacao = new Date(t.transaction_date);
      const anoT = dataTransacao.getUTCFullYear();
      const mesT = dataTransacao.getUTCMonth();

      // Verifica se a transação é ANTERIOR ao filtro atual
      if (anoT < anoReferencia || (anoT === anoReferencia && mesT < mesReferencia)) {
        
        // Mantém o respeito aos outros filtros (se você filtrar "Salário", o saldo anterior só soma os Salários antigos)
        const bateCategoria = filtroCategoria ? t.category_id?._id === filtroCategoria : true;
        const bateTipoGeral = filtroTipoGeral ? t.type === filtroTipoGeral : true;
        const bateTipoPagamento = filtroTipoPagamento ? t.payment_method === filtroTipoPagamento : true;
        
        if (bateCategoria && bateTipoGeral && bateTipoPagamento) {
          if (t.type === 'receita') saldoAnterior += t.value;
          if (t.type === 'despesa') saldoAnterior -= t.value;
        }
      }
    });
  }

  const totalDisponivel = saldoAnterior + receitaTotal;
  const saldoAtual = totalDisponivel - gastoTotal;
  let taxaUtilizacao = 0;
  if (totalDisponivel > 0) {
    taxaUtilizacao = Math.round((gastoTotal / totalDisponivel) * 100);
  } else if (gastoTotal > 0) {
    // NÃO TEM DINHEIRO DISPONÍVEL MAS GASTOUS A TAXA É +100%
    taxaUtilizacao = 100; 
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getTextoReceita = () => {
    const nomeMes = filtroMes !== "" ? NOMES_MESES[Number(filtroMes)] : "";
    const nomeAno = filtroAno !== "" ? filtroAno : "";

    if (nomeMes && nomeAno) return `Total disponível em ${nomeMes} de ${nomeAno}:`;
    if (nomeMes) return `Total disponível em ${nomeMes}:`;
    if (nomeAno) return `Total disponível no ano ${nomeAno}:`;
    return "Total disponível de todos os períodos:";
  };

  return (
    <div className="w-full p-4 flex flex-col gap-6 md:p-8">
      <header className="flex flex-col justify-between items-start gap-4 bg-line-gray p-5 rounded-2xl w-full shadow-md md:flex-row md:items-center md:p-6">
        <div className="flex flex-col gap-1 md:w-3/6">
          <span className="text-primary-color-green font-semibold text-xl md:text-2xl my-2">
            Bem-vindo(a),{" "}
            <span className="text-gradient-green">
              {userName.charAt(0).toUpperCase() + userName.slice(1)}
            </span>
            .
          </span>
          <span className="flex gap-2 items-center text-primary-color-green font-semibold text-sm md:text-base">
            {getTextoReceita()}{" "}
            <span className="text-gradient-green ml-1">
              {formatarMoeda(totalDisponivel)}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-3/6 xl:flex-row xl:justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-color-green p-3 md:px-6 rounded-xl flex items-center justify-center gap-3 text-secondary-color-green font-semibold text-sm w-full md:w-auto hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Image src="/img-add.png" alt="Ícone nova transação" height={20} width={20} />
            Nova transação
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 rounded-2xl border-2 border-line-gray shadow-sm">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <span className="text-primary-color-green font-bold text-sm mr-2 hidden xl:block">
            Filtros:
          </span>

          <div className="relative flex-1 min-w-35">
            <select
              value={filtroTipoGeral}
              onChange={handleMudancaTipoGeral}
              className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-xl px-4 py-2 pr-7 outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm"
            >
              <option value="" disabled>Transações</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <Image
              src="/img-arrow-down.png"
              alt="Seta"
              width={12}
              height={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 min-w-35">
            <select
              value={filtroTipoPagamento}
              onChange={(e) => setFiltroTipoPagamento(e.target.value)}
              disabled={filtroTipoGeral === "receita"}
              className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-xl px-4 py-2 pr-7 outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="" disabled>Pagamentos</option>
              <option value="À vista">À vista</option>
              <option value="Parcelado">Parcelado</option>
            </select>
            <Image
              src="/img-arrow-down.png"
              alt="Seta"
              width={12}
              height={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 min-w-25">
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-xl px-4 py-2 pr-7 outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm"
            >
              <option value="" disabled>Ano</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
            <Image
              src="/img-arrow-down.png"
              alt="Seta"
              width={12}
              height={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 min-w-30">
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-lg px-4 py-2 pr-7 bg-transparent outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm"
            >
              <option value="" disabled>Mês</option>
              {mesesDisponiveis.map((mesIndex) => (
                <option key={mesIndex} value={mesIndex}>
                  {NOMES_MESES[mesIndex]}
                </option>
              ))}
            </select>
            <Image
              src="/img-arrow-down.png"
              alt="Seta"
              width={12}
              height={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 min-w-40">
            <select
              value={filtroCategoria}
              onChange={handleMudancaCategoria}
              className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-lg px-4 py-2 pr-7 bg-transparent outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm"
            >
              <option value="">Todas as Categorias</option>
              {categoriasParaFiltro.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
            <Image
              src="/img-arrow-down.png"
              alt="Seta"
              width={12}
              height={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        {(filtroTipoGeral ||
          filtroTipoPagamento ||
          filtroAno ||
          filtroMes ||
          filtroCategoria) && (
          <button
            onClick={limparFiltros}
            className="bg-line-gray text-text-login px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors shrink-0"
            title="Limpar todos os filtros"
          >
            ✕ Limpar
          </button>
        )}
      </div>

    
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <CardFinance
          title="Saldo em conta"
          value={formatarMoeda(saldoAtual)}
          border={true}
          icon="/img-coin-card.png"
          bgColor="bg-white"
          textColor="text-primary-color-green"
          bgIcon="bg-tertiary-color-green"
          editButton={false}
          saldoAnteriorAzul={exibirSaldoAnterior ? `Acumulado do mês anterior: ${formatarMoeda(saldoAnterior)}` : undefined} 
        />
        <CardFinance
          title="Taxa de utilização"
          value={`${taxaUtilizacao}%`}
          border={true}
          icon="/img-percent-card.png"
          bgColor="bg-white"
          textColor="text-primary-color-green"
          bgIcon="bg-tertiary-color-green"
          editButton={false}
          usageFee={taxaUtilizacao} 
        />
        <CardFinance
          title="Soma de gastos"
          value={formatarMoeda(gastoTotal)}
          border={true}
          icon="/img-down.png"
          bgColor="bg-white"
          textColor="text-primary-color-green"
          bgIcon="bg-tertiary-color-green"
          editButton={false}
        />
      </section>

      <section className="flex flex-col">
        <TransactionsTable
          transacoesFiltradas={transacoesFiltradas}
          isLoading={isLoading}
          onUpdateData={fetchDashboardData}
        />
      </section>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchDashboardData}
      />
    </div>
  );
}