-- Tabela de Categorias (ex: Melhor Filme, Melhor Diretor)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Tabela de Indicados (quem está concorrendo em cada categoria)
CREATE TABLE nominees (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id),
  name TEXT NOT NULL, -- Nome do ator ou do filme
  movie TEXT -- Filme pelo qual está concorrendo
);

-- Tabela simples de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Inserir usuário e senha únicos
INSERT INTO users (username, password) VALUES ('admin', 'senha123');

-- Tabela de Palpites (o "bolão" em si)
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE, 
  category_id INT REFERENCES categories(id),
  nominee_id INT REFERENCES nominees(id),
  UNIQUE(user_id, category_id)
);
