"use client"

import Image from "next/image"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ADICIONADOS VALUE, ONCHANGE E ESTRUTURA DE OPTIONS NA INTERFACE
interface CustomBarChartProps {
  title: string;
  tooltipLabel?: string;
  data: any[];
  filters?: { 
    label: string; 
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { id: string; name: string }[] 
  }[];
}

const chartConfig = [
  { key: 'Aportes', color: '#1F4842' },
  { key: 'Rendimentos', color: '#B8F59D' }
]

export default function CustomBarChartDuo({ title, data, filters }: CustomBarChartProps) {
  
  const renderCustomLegend = () => {
    return (
      <div className="flex justify-center items-center gap-6 mt-2">
        {chartConfig.map((item, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[12px] font-medium text-primary-color-green">{item.key}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-87.5 xl:h-full rounded-2xl border-2 border-line-gray p-6 shadow-md flex flex-col gap-4">
      <div className="flex flex-col justify-between items-center md:flex-row shrink-0 gap-4">
        <h2 className="text-primary-color-green font-bold text-lg lg:text-xl">{title}</h2>
        
        <div className="flex gap-3 w-full md:w-auto">
          {filters?.map((filter, idx) => (
            <div key={idx} className="relative w-full md:w-auto">
              {/* ADICIONADOS OS PARÂMETROS VALUE E ONCHANGE NO SELECT */}
              <select 
                value={filter.value}
                onChange={filter.onChange}
                className="appearance-none border border-line-gray text-primary-color-green font-semibold rounded-xl px-4 py-2 pr-7 outline-none cursor-pointer w-full focus:border-primary-color transition-colors text-sm"
              >
                {/* OPÇÃO PADRÃO PARA LIMPAR O FILTRO */}
                <option value="Todas">{filter.label === "Ano" ? "Todos os Anos" : "Todas as Plataformas"}</option>
                {filter.options.map((opt, i) => (
                  <option key={i} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              <Image src="/img-arrow-down.png" alt="Seta" width={12} height={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDEDEF" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#898989', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898989', fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
            
            <Tooltip 
              cursor={{ fill: '#f4f4f5' }} 
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '4px 4px 8px -1px rgb(0 0 0 / 0.1)' }} 
              formatter={(value: any, name: any) => [`R$ ${value}`, name]} 
            />
            
            <Legend verticalAlign="bottom" content={renderCustomLegend} />
            
            <Bar dataKey="Aportes" fill="#1F4842" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="Rendimentos" fill="#B8F59D" radius={[4, 4, 0, 0]} barSize={16} />
            
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}