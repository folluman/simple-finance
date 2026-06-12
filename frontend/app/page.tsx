"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import api from "../api"
import { useRouter } from "next/navigation"

interface AuthErrors {
  nome?: boolean
  email?: boolean
  password?: boolean
  confirmPassword?: boolean
  resetCode?: boolean
}

const phrasesEffect = [
  "Controle de gastos.", 
  "Independência financeira.", 
  "Seu patrimônio crescendo.", 
  "Organização financeira."
]

export default function Login() {

  const router = useRouter()

  const [text, setText] = useState("")
  const [loop, setLoop] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const fullText = phrasesEffect[loop % phrasesEffect.length]
  const isPaused = !isDeleting && text === fullText

  useEffect(() => {
    let typingSpeed = isDeleting ? 30 : 30
    if (isPaused) {
      typingSpeed = 3000
    }
    const timer = setTimeout(() => {
      if (!isDeleting && text === fullText) {
        setIsDeleting(true)
      } else if (isDeleting && text === "") {
        setIsDeleting(false)
        setLoop(loop + 1)
      } else {
        setText(fullText.substring(0, text.length + (isDeleting ? -1 : 1)))
      }
    }, typingSpeed)
    return () => clearTimeout(timer)
  }, [text, isDeleting, loop, fullText, isPaused])

  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login")
  
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [resetCode, setResetCode] = useState("")

  const [errors, setErrors] = useState<AuthErrors>({})
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" })

  const switchMode = (mode: "login" | "register" | "forgot") => {
    setAuthMode(mode)
    setErrors({})
    setPassword("")
    setConfirmPassword("")
    setResetCode("")
    setForgotStep(1)
    setStatusMsg({ type: "", text: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o refresh padrão do formulário HTML
    const newErrors: AuthErrors = {};
    setStatusMsg({ type: "", text: "" });

    if (authMode !== "forgot" || forgotStep === 1) {
      if (!email.trim() || !email.includes("@")) newErrors.email = true;
    }

    if (authMode === "login" || authMode === "register" || (authMode === "forgot" && forgotStep === 2)) {
       if (!password.trim() || password.length < 6) newErrors.password = true;
    }

    if (authMode === "register") {
      if (!nome.trim()) newErrors.nome = true;
      if (!confirmPassword.trim() || password !== confirmPassword) newErrors.confirmPassword = true;
    }

    if (authMode === "forgot" && forgotStep === 2) {
      if (!resetCode.trim()) newErrors.resetCode = true;
      if (!confirmPassword.trim() || password !== confirmPassword) newErrors.confirmPassword = true;
    }

    setErrors(newErrors);

    // 1ª TRAVA DE SEGURANÇA: Se tiver erro no front-end, avisa o usuário e PARA a função aqui.
    if (Object.keys(newErrors).length > 0) {
      setStatusMsg({ type: "error", text: "Por favor, verifique os campos em vermelho." });
      return; 
    }

    try {
      if (authMode === "register") {
        await api.post(`/api/users/signup`, { name: nome, email, password });
        switchMode("login"); 
        setStatusMsg({ type: "success", text: "Conta criada com sucesso! Faça seu login." });

      } else if (authMode === "login") {
        await api.post(`/api/users/login`, { email, password });
        router.push('/Home')

      } else if (authMode === "forgot") {
        
        if (forgotStep === 1) {
          await api.post(`/api/users/forgot-password`, { email });
          setForgotStep(2);
          setStatusMsg({ type: "success", text: "Código enviado para o seu e-mail!" });
          
        } else if (forgotStep === 2) {
          await api.post(`/api/users/reset-password`, { 
            email, 
            code: resetCode, 
            newPassword: password 
          });
          switchMode("login");
          setStatusMsg({ type: "success", text: "Senha redefinida com sucesso!" });
        }
      }

    } catch (error: any) {
        if (error.response && error.response.data) {
          // Tenta ler o campo 'message' ou o campo 'error' que vêm do seu Controller do Node.js
          const backendMessage = error.response.data.message || error.response.data.error;
          
          if (backendMessage) {
            // Se o backend mandou texto, mostra ele!
            setStatusMsg({ type: "error", text: backendMessage });
          } else {
            // Plano B de segurança, caso o backend mande um JSON vazio no erro
            setStatusMsg({ type: "error", text: `Erro do servidor: ${error.response.status}` });
          }
        } else {
          setStatusMsg({ type: "error", text: "Não foi possível conectar ao servidor." });
        }
      }
  };

  const baseInputClass = "mt-2 bg-line-gray border p-3 rounded-2xl w-full shadow-lg placeholder:text-xs outline-none focus:ring-2 focus:ring-gradient-green transition-all"
  const errorInputClass = "border-red-500 ring-2 ring-red-500"
  const defaultInputClass = "border-transparent"

  const renderStatusMessage = () => {
    if (!statusMsg.text) return null;
    return (
      <div className={`mt-4 p-3 rounded-xl text-sm font-semibold text-center w-full ${statusMsg.type === 'success' ? 'bg-[#E6F4F1] text-primary-color-green' : 'bg-red-100 text-red-600'}`}>
        {statusMsg.text}
      </div>
    );
  };

  return (
    <div className="flex items-center min-h-dvh w-full bg-linear-to-bl from-primary-color-green to-gradient-green overscroll-none">
      <div className="flex flex-col mx-auto container px-6 py-10 gap-4 lg:flex-row lg:items-center lg:p-12 xl:gap-14">
        
        <div className="h-fit lg:w-3/6 lg:flex lg:flex-col lg:items-start">
          <div className="flex justify-center items-center gap-2 lg:gap-4">
            <h2 className="text-3xl text-center text-secondary-color-green font-semibold lg:text-right lg:text-5xl xl:text-6xl">Simple<span className="text-white">Finance</span></h2>
            <Image src="/img-logo.png" alt="Logo SimpleFinance" width={50} height={50} className="w-7 h-7 lg:w-12 lg:h-12" />
          </div>
          <p className=" mt-4 text-xl text-white font-semibold text-center lg:text-3xl lg:mt-8 lg:text-left xl:text-4xl">Controlar suas finanças nunca foi tão fácil.</p>
          <p className="text-center text-white mt-4 text-lg font-semibold lg:text-2xl lg:mt-8 xl:text-3xl">{text}<span className={`text-secondary-color-green ${isPaused ? 'animate-pulse' : ''}`}>|</span></p>
        </div>

        <div className="flex flex-col items-center bg-white p-6 rounded-2xl h-fit shadow-2xl lg:p-12 lg:w-3/6 xl:p-16">
          
          {authMode === "login" && (
            <div className="w-full flex flex-col animate-fade-in">
              <span className="text-2xl text-center text-primary-color-green font-bold lg:text-3xl lg:self-start xl:text-4xl">Bem-vindo!</span>
              <span className="mt-2 text-text-login text-center text-sm md:text-base lg:self-start">Faça o login ou crie uma conta</span>
              
              {renderStatusMessage()}

              <form onSubmit={handleSubmit} className="flex flex-col mt-6 w-full lg:mt-8">
                <div className="flex flex-col mb-4">
                  <label className="text-primary-color-green font-medium text-sm">E-mail</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Informe seu e-mail" 
                    className={`${baseInputClass} ${errors.email ? errorInputClass : defaultInputClass}`}
                  />
                </div>
                
                <div className="flex flex-col mb-2">
                  <label className="text-primary-color-green font-medium text-sm">Senha</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Informe sua senha" 
                    className={`${baseInputClass} ${errors.password ? errorInputClass : defaultInputClass}`}
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-left text-text-login mt-2 hover:text-primary-color-green transition-colors w-fit cursor-pointer"
                >
                  Esqueci minha senha
                </button>
                
                <button type="submit" className="bg-primary-color-green text-secondary-color-green font-semibold text-base p-3 rounded-2xl my-5 cursor-pointer hover:opacity-90 transition-all shadow-md">
                  Login
                </button>
              </form>
              
              <button 
                type="button"
                onClick={() => switchMode("register")}
                className="text-sm font-medium text-text-login hover:text-primary-color-green transition-colors cursor-pointer"
              >
                Não tem uma conta? <span className="font-bold underline">Crie uma!</span>
              </button>
            </div>
          )}

          {authMode === "register" && (
            <div className="w-full flex flex-col animate-fade-in">
              <span className="text-center text-2xl text-primary-color-green font-bold lg:text-3xl lg:self-start xl:text-4xl">Criar conta</span>
              <span className="mt-2 text-text-login text-center text-sm md:text-base lg:self-start">Preencha seus dados abaixo</span>
              
              {renderStatusMessage()}

              <form onSubmit={handleSubmit} className="flex flex-col mt-6 w-full lg:mt-8">
                <div className="flex flex-col mb-3">
                  <label className="text-primary-color-green font-medium text-sm">Nome</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Informe seu nome" className={`${baseInputClass} ${errors.nome ? errorInputClass : defaultInputClass}`} />
                </div>
                <div className="flex flex-col mb-3">
                  <label className="text-primary-color-green font-medium text-sm">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Informe seu e-mail" className={`${baseInputClass} ${errors.email ? errorInputClass : defaultInputClass}`} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-full flex flex-col">
                    <label className="text-primary-color-green font-medium text-sm">Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" className={`${baseInputClass} ${errors.password ? errorInputClass : defaultInputClass}`} />
                  </div>
                  <div className="w-full flex flex-col">
                    <label className="text-primary-color-green font-medium text-sm">Confirmar</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a senha" className={`${baseInputClass} ${errors.confirmPassword ? errorInputClass : defaultInputClass}`} />
                  </div>
                </div>
                
                <button type="submit" className="bg-primary-color-green text-secondary-color-green font-semibold text-base p-3 rounded-2xl mt-8 mb-5 cursor-pointer hover:opacity-90 transition-all shadow-md">
                  Criar minha conta
                </button>
              </form>
              
              <button onClick={() => switchMode("login")} className="text-sm font-medium text-text-login hover:text-primary-color-green transition-colors cursor-pointer">
                Já tem uma conta? <span className="font-bold underline">Faça login</span>
              </button>
            </div>
          )}

          {authMode === "forgot" && (
            <div className="w-full flex flex-col animate-fade-in">
              <span className="text-center text-2xl text-primary-color-green font-bold lg:text-3xl lg:self-start xl:text-4xl">Recuperar senha</span>
              
              <span className="mt-2 text-text-login text-center text-sm md:text-base lg:self-start">
                {forgotStep === 1 ? "Digite seu e-mail para receber um código" : "Insira o código recebido e a nova senha"}
              </span>
              
              {renderStatusMessage()}

              <form onSubmit={handleSubmit} className="flex flex-col mt-6 w-full lg:mt-8">
                
                {forgotStep === 1 && (
                  <div className="flex flex-col mb-4">
                    <label className="text-primary-color-green font-medium text-sm">E-mail da conta</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Informe seu e-mail" 
                      className={`${baseInputClass} ${errors.email ? errorInputClass : defaultInputClass}`}
                    />
                  </div>
                )}

                {forgotStep === 2 && (
                  <>
                    <div className="flex flex-col mb-4">
                      <label className="text-primary-color-green font-medium text-sm">Código de verificação</label>
                      <input 
                        type="text" 
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Ex: 123456" 
                        maxLength={6}
                        className={`${baseInputClass} tracking-widest text-center font-bold ${errors.resetCode ? errorInputClass : defaultInputClass}`}
                      />
                    </div>

                    <div className="flex flex-col mb-4">
                      <label className="text-primary-color-green font-medium text-sm">Nova senha</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Informe a nova senha" 
                        className={`${baseInputClass} ${errors.password ? errorInputClass : defaultInputClass}`}
                      />
                    </div>
                    
                    <div className="flex flex-col mb-2">
                      <label className="text-primary-color-green font-medium text-sm">Confirmar nova senha</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha" 
                        className={`${baseInputClass} ${errors.confirmPassword ? errorInputClass : defaultInputClass}`}
                      />
                    </div>
                  </>
                )}
                
                <button type="submit" className="bg-primary-color-green text-secondary-color-green font-semibold text-base p-3 rounded-2xl mt-8 mb-5 cursor-pointer hover:opacity-90 transition-all shadow-md">
                  {forgotStep === 1 ? "Enviar código" : "Redefinir senha"}
                </button>
              </form>
              
              <button 
                type="button"
                onClick={() => switchMode("login")}
                className="text-sm font-medium text-text-login hover:text-primary-color-green transition-colors cursor-pointer"
              >
                Lembrou a senha? <span className="font-semibold underline">Voltar para login</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}