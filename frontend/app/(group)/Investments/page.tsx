import Image from "next/image"
import CardFinance from "@/components/CardFinance"
import CustomPieChart from "@/components/CustomPieChart"
import YieldBarChart from "@/components/YieldBarChart"
import CustomBarChart from "@/components/CustomBarChart"

const investmentData = [
  { name: "Nubank", value: 60671.24 },
  { name: "XP Investimentos", value: 10671.24 },
  { name: "Rico", value: 13525.41 },
  { name: "Binance", value: 2346.71 },
]

const monthlyInvestments = [
  { mes: 'Jan', total: 1500 }, { mes: 'Fev', total: 1800 }, { mes: 'Mar', total: 1200 },
  { mes: 'Abr', total: 2500 }, { mes: 'Mai', total: 2000 }, { mes: 'Jun', total: 3100 },
  { mes: 'Jul', total: 2800 }, { mes: 'Ago', total: 3500 }, { mes: 'Set', total: 4000 },
  { mes: 'Out', total: 3800 }, { mes: 'Nov', total: 4200 }, { mes: 'Dez', total: 5000 },
]

export default function Investments() {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-6 md:p-8 overflow-y-auto overflow-x-hidden">
      
      <header className="flex flex-col items-center w-full gap-4 p-5 bg-line-gray rounded-2xl shadow-md md:items-center md:p-6 md:flex-row md:justify-between md:gap-6 shrink-0">
        <div className="flex flex-col md:w-4/6">
          <h2 className="text-primary-color-green font-bold text-2xl text-center md:text-left md:text-3xl">
            Investimentos
          </h2>
          <p className="text-primary-color-green mt-1 text-sm text-center md:text-left">
            Análise detalhada dos seus investimentos.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-2/6 lg:flex-row lg:justify-end">
          <button className="bg-primary-color-green p-3 md:px-6 rounded-xl flex items-center justify-center gap-3 text-secondary-color-green font-semibold text-sm w-full lg:w-auto hover:opacity-90 transition-opacity cursor-pointer">
            <Image
              src="/img-add.png"
              alt="Ícone adicionar investimento"
              title="Clique aqui para adicionar investimento"
              height={20}
              width={20}
            />
            Adicionar
          </button>
          <button className="bg-primary-color-green p-3 md:px-6 rounded-xl flex items-center justify-center gap-3 text-secondary-color-green font-semibold text-sm w-full lg:w-auto hover:opacity-90 transition-opacity cursor-pointer">
            <Image
              src="/img-launch.png"
              alt="Ícone novo lançamento"
              title="Clique aqui para fazer um novo lançamento"
              height={22}
              width={22}
            />
            Novo lançamento
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 shrink-0">
        <CardFinance value="R$ 13.525,41" title="Rico" />
        <CardFinance value="R$ 2.346,71" title="Binance" />
        <CardFinance value="R$ 10.671,24" title="XP Investimentos" />
        <CardFinance value="R$ 60.671,24" title="Nubank" />          
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:flex-1 xl:min-h-75 w-full shrink-0">
        <CustomPieChart title="Investimentos atuais" data={investmentData} />
        <YieldBarChart />
      </section>

      <section className="xl:flex-1 xl:min-h-75 w-full shrink-0 overflow-x-auto pb-2">
          <CustomBarChart 
            title="Total Investido por mês"
            tooltipLabel="Total Investido"
            data={monthlyInvestments}
            filters={[
              { label: 'Ano', options: ['2026', '2025'] },
              { label: 'Plataforma', options: ['Todas', 'Nubank', 'XP Investimentos', 'Rico', 'Binance'] }
            ]}
          />
      </section>
    </div>
  )
}