const User = require('../models/User')
require('dotenv').config();
const asyncHandler = require('express-async-handler')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const saltRounds = 10
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD
    },
    tls: {
    rejectUnauthorized: false 
  },
  debug: true, 
  logger: true
});

// MOSTRANDO A LISTA DE USUÁRIOS
exports.user_create_list = asyncHandler(async(req, res, next) => {
    const users = await User.find().exec();
    
    res.json(users);
})

exports.user_create_post = [
body('name')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('O Nome do usuário deve ser especificado')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('O nome deve conter apenas letras e espaços.'),
body('email')
    .trim()
    .isLength({min: 11})
    .escape()
    .withMessage('Email deve ser especificado')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Por favor insira um email válido'),
body('password')
    .trim()
    .isLength({ min: 6 })
    .escape()
    .withMessage('A senha deve ser especificada'),

    asyncHandler(async(req, res, next) => {
    const username = await User.findOne({ name: req.body.name }).exec();
    const email = await User.findOne({ email: req.body.email }).exec();
    const phone = await User.findOne({ phone: req.body.phone }).exec();

    // if (username) {
    //   return res.status(400).json({ error: 'Username already exists!' });
    // } // PODE TER USUÁRIO COM NOMES IGUAIS
    if(email) {
      return res.status(400).json({ error: 'Email já existe!' });
    }

    const errors = validationResult(req);

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const user = new User ({
      name: req.body.name,
      password: hashedPassword,
      email: req.body.email,
    });

    if(!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    await user.save();

    res.status(200).json({ message: 'Usuário criado com sucesso!' });
  }
  )  
];

// LOGIN USER
exports.user_login_post = asyncHandler(async(req, res, next) => {
    try{
        const {email, password} = req.body

        const user = await User.findOne({ email }).select('+password').exec()

        if(!user) {
            return res.status(401).json({ error: 'Email ou senha inválidos!' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid) {
        res.status(400).json({message: 'Senha inválida'});
        return;
        }

        const token = jwt.sign(
          { id: user._id },

          process.env.JWT_SECRET,

          { expiresIn: '1d' }
        )

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 1 dia em milissegundos
        })

        return res.status(200).json({
          message: 'Login realizado com sucesso!',
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        })

    }
    catch (err) {
        res.status(400).json({ error: err.message })
    }
})

// BUSCAR O PERFIL DO USUÁRIO LOGADO
exports.user_profile_get = asyncHandler(async(req, res) => {
    const user = await User.findById(req.userId).exec()

    if(!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    // RETORNANDO OS DADOS DO USUÁRIO PARA O FRONT-END CONSUMIR
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    })
})

// SAIR DA CONTA
exports.user_logout_post = (req, res) => {
  res.clearCookie('token')

  res.status(200).json({ message: 'Logout realizado com sucesso!' })
}

exports.forgot_password_post = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Procura o usuário
    const user = await User.findOne({ email });
    if (!user) {
      // REGRA DE SEGURANÇA SE CASO NÃO EXISTIR O EMAIL, MESMO ASSIM VAI SER RETORNADO UMA MENSAGEM DE SUCESSO
        return res.status(200).json({ message: 'Se o e-mail existir, um código será enviado.' });
    }

    // Gera um código de 6 dígitos (Ex: 839102)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Define a validade do código
    const expiresAt = Date.now() + 15 * 60 * 1000;

    // Salva no banco de dados
    try {
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = expiresAt;
        await user.save();
        console.log("Código de recuperação salvo com sucesso no MongoDB");
    } catch (dbError) {
        console.error("ERRO AO SALVAR NO MONGODB:", dbError);
        return res.status(500).json({ message: "Erro ao salvar código no banco" });
    }

    // Prepara o e-mail
    const mailOptions = {
        from: '"SimpleFinance" <simplefinanceprojeto@gmail.com>',
        to: user.email,
        subject: 'Código de Recuperação de Senha',
        html: `
            <h2>Olá, ${user.name}</h2>
            <p>Você solicitou a recuperação de senha no SimpleFinance.</p>
            <p>Seu código de verificação é: <strong><span style="font-size: 24px; color: #00927D;">${resetCode}</span></strong></p>
            <p>Este código expira em 15 minutos.</p>
            <p>Se você não fez essa solicitação, apenas ignore este e-mail.</p>
        `
    };

    // Envia o e-mail
    try {
        console.log("Tentando conectar com o provedor de e-mail");
        await transporter.sendMail(mailOptions);
        console.log("E-MAIL ENVIADO COM SUCESSO!");
        
        res.status(200).json({ message: 'Código enviado com sucesso.' });
    } catch (emailError) {
        // A MÁGICA ACONTECE AQUI! Isso vai cuspir o erro exato no seu terminal.
        console.error("ERRO FATAL AO ENVIAR E-MAIL. DETALHES ABAIXO:");
        console.error(emailError); 
        
        res.status(500).json({ message: 'Erro interno ao enviar o e-mail. Verifique os logs do servidor.' });
    }
})

// VALIDAR O CÓDIGO E SALVAR A NOVA SENHA
exports.reset_password_post = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    // PROCURA O USUÁRIO PELO EMAIL E VERIFICA SE O CÓDIGO NÃO EXPIROU
    const user = await User.findOne({ 
        email: email,
        resetPasswordCode: code,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ error: 'Código inválido ou expirado. Solicite um novo.' });
    }

    // CRIPTOGRAFANDO NOVA SENHA
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // ATUALIZA E LIMPA O CÓDIGO PARA NAO SER UTILIZADO NOVAMENTE
    user.password = hashedPassword; 
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });
})