import Image from "next/image";

interface CardProps {
  icon?: string
  editButton?: boolean
  border?: boolean
  title: string
  value: string
  bgColor?: string
  textColor?: string
  bgIcon?: string
  usageFee?: number
  saldoAnteriorAzul?: string;
}

export default function CardFinance({ icon, editButton, border, title, value, bgColor, textColor, bgIcon, usageFee, saldoAnteriorAzul }: CardProps) {

  const borderSolid = border ? "border-1 border-solid border-line-gray" : ""

  // VERIFICA SE PASSOU O LIMITE
  const estourouLimite = usageFee !== undefined && usageFee > 100;

  return (
    <div className={`flex flex-col rounded-2xl p-4 ${bgColor} shadow-md ${borderSolid} w-full md:p-5`}>
      
      <div className="flex justify-between items-start">
          {icon ? (
            <div className={`p-1 ${bgIcon} rounded-lg md:p-2`}>
              <Image
                src={icon}
                alt={`Ícone ${title}`}
                title={`Ícone ${title}`}
                width={30}
                height={30}
                className="w-5 h-5 md:w-6 md:h-6"
              />
            </div>
          ) : (
            <div></div>
          )}
          
          <div className="flex flex-col items-end gap-2 text-right">
            {saldoAnteriorAzul && (
              <span className="text-gradient-green font-bold text-xs md:text-sm">
                {saldoAnteriorAzul}
              </span>
            )}

            {editButton && (
              <button className="cursor-pointer hover:opacity-70 transition-opacity">
                <Image
                  src="/img-edit.png"
                  alt="ícone de Edição"
                  title="Clique aqui para editar o valor do patrimônio total"
                  width={24}
                  height={24}
                />
              </button>
            )}
          </div>
      </div>
      
      <div className="flex flex-col gap-1 mt-3 xl:h-18 xl:justify-center">
        {/* SE ESTOURAR O TEXTO A BARRA FICA VERMELHA DO CONTRARIO FICA A COR PADRAO */}
        <span className={`${estourouLimite ? 'text-red-500' : textColor} font-semibold text-lg md:text-xl xl:text-2xl`}>
          {value}
        </span>
        
        {usageFee !== undefined && (
          <div className={`w-full rounded-full h-2 my-1 ${estourouLimite ? 'bg-red-100' : 'bg-primary-color-green'}`}>
            <div 
              // BARRA FICA VERMELHA SE PASSAR DE 100
              className={`${estourouLimite ? 'bg-red-500' : 'bg-secondary-color-green'} h-2 rounded-full transition-all duration-1000 ease-out`} 
              style={{ width: `${estourouLimite ? 100 : usageFee}%` }}
            > 
            </div>
          </div>
        )}
        <span className={`${textColor} font-semibold text-sm md:text-md`}>{title}</span>
      </div>
    </div>
  )
}