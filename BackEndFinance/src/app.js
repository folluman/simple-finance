require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const app = express()

app.set('trust proxy', 1);

const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Muitas requisições deste IP, tente novamente mais tarde."
});

const criacaoContaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: "Limite de criação de contas atingido para este IP."
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Muitas tentativas de recuperação de senha. Tente novamente após 15 minutos."
});

const corsOptions = {
  origin: process.env.NODE_ENV == 'production' 
        ? process.env.FRONTEND_URL_PROD 
        : process.env.FRONTEND_URL_DEV,

  credentials: true
}

// const corsOptions = {
//   // Vamos chumbhar a URL aqui por enquanto
//   origin: 'http://localhost:3000', 
//   credentials: true
// }

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet()); 

app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  next();
});

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('CONECTADO AO MONGODB COM SUCESSO'))
  .catch((err) => console.error('ERRO AO CONECTAR COM O MONGODB:', err))

const userRoutes = require('./routes/users')
const categoryRoutes = require('./routes/categories')
const transactionRoutes = require('./routes/transactions')

app.use('/api/', limiterGeral);
app.use('/api/users/signup', criacaoContaLimiter);
app.use('/api/users/forgot-password', forgotPasswordLimiter);
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SERVER RODANDO NA PORTA: ${PORT}`)
});

