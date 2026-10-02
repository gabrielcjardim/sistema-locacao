create extension if not exists pgcrypto;

create table if not exists acomodacoes (
  id uuid primary key default gen_random_uuid(),
  identificacao varchar(100) not null,
  tipo varchar(50) not null,
  andar_localizacao varchar(100),
  capacidade_pessoas integer not null check (capacidade_pessoas > 0),
  numero_quartos integer not null default 1 check (numero_quartos > 0),
  valor_base_diaria numeric(12,2) not null default 0 check (valor_base_diaria >= 0),
  situacao varchar(30) not null default 'disponivel',
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists acomodacoes_por_situacao on acomodacoes (situacao);
alter table acomodacoes add column if not exists numero_quartos integer not null default 1;

create table if not exists hospedes (
  id uuid primary key default gen_random_uuid(), nome_completo varchar(180) not null,
  cpf varchar(14) unique, telefone varchar(30) not null, email varchar(180), observacoes text,
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(), acomodacao_id uuid not null references acomodacoes(id),
  hospede_responsavel_id uuid not null references hospedes(id), data_entrada timestamptz not null,
  data_saida timestamptz not null, hora_entrada varchar(5) not null default '14:00',
  hora_saida varchar(5) not null default '11:00', quantidade_hospedes integer not null check (quantidade_hospedes > 0),
  valor_total numeric(12,2) not null check (valor_total >= 0), tipo_locacao varchar(30) not null,
  valor_calculado numeric(12,2) not null default 0 check (valor_calculado >= 0),
  ajuste_valor numeric(12,2) not null default 0, motivo_ajuste varchar(300) not null default '',
  situacao varchar(30) not null default 'confirmada', criado_em timestamptz not null default now(),
  constraint periodo_valido check (data_saida > data_entrada)
);

create index if not exists reservas_por_acomodacao_periodo on reservas (acomodacao_id, data_entrada, data_saida);
alter table reservas add column if not exists valor_calculado numeric(12,2) not null default 0;
alter table reservas add column if not exists ajuste_valor numeric(12,2) not null default 0;
alter table reservas add column if not exists motivo_ajuste varchar(300) not null default '';
alter table reservas add column if not exists hora_entrada varchar(5) not null default '14:00';
alter table reservas add column if not exists hora_saida varchar(5) not null default '11:00';
update reservas set data_entrada = date_trunc('day', data_entrada) + hora_entrada::time, data_saida = date_trunc('day', data_saida) + hora_saida::time;
update reservas set valor_calculado = valor_total where valor_calculado = 0 and valor_total <> 0 and ajuste_valor = 0;

create table if not exists regras_de_preco (
  id uuid primary key default gen_random_uuid(), nome varchar(100) not null,
  data_inicial timestamptz not null, data_final timestamptz not null,
  valor_diaria numeric(12,2) not null check (valor_diaria > 0),
  acomodacao_id uuid references acomodacoes(id), ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint periodo_preco_valido check (data_final >= data_inicial)
);

create index if not exists regras_de_preco_por_periodo on regras_de_preco (data_inicial, data_final, acomodacao_id);

create table if not exists configuracoes_sistema (
  id smallint primary key default 1 check (id = 1),
  cor_principal varchar(7) not null default '#FF5C00',
  cores_recentes jsonb not null default '["#FF5C00"]'::jsonb,
  atualizado_em timestamptz not null default now()
);

insert into configuracoes_sistema (id, cor_principal) values (1, '#FF5C00') on conflict (id) do nothing;
alter table configuracoes_sistema add column if not exists cores_recentes jsonb not null default '["#FF5C00"]'::jsonb;

create table if not exists bloqueios_agenda (
  id uuid primary key default gen_random_uuid(), acomodacao_id uuid not null references acomodacoes(id),
  data_inicial timestamptz not null, data_final timestamptz not null, motivo varchar(200) not null,
  criado_em timestamptz not null default now(), constraint periodo_bloqueio_valido check (data_final >= data_inicial)
);
create index if not exists bloqueios_por_acomodacao_periodo on bloqueios_agenda (acomodacao_id, data_inicial, data_final);

create table if not exists vistorias (
  id uuid primary key default gen_random_uuid(), reserva_id uuid not null references reservas(id),
  acomodacao_id uuid not null references acomodacoes(id), tipo varchar(10) not null,
  data_vistoria timestamptz not null, responsavel varchar(120) not null,
  itens jsonb not null default '[]'::jsonb, observacoes text not null default '',
  situacao varchar(20) not null default 'pendente', criado_em timestamptz not null default now()
);
create index if not exists vistorias_por_reserva on vistorias (reserva_id, tipo);

create table if not exists lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(), tipo varchar(10) not null,
  descricao varchar(180) not null, categoria varchar(100) not null,
  valor numeric(12,2) not null check (valor > 0), data_vencimento timestamptz not null,
  data_pagamento timestamptz, situacao varchar(20) not null default 'pendente',
  reserva_id uuid references reservas(id), observacoes text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists lancamentos_por_vencimento on lancamentos_financeiros (data_vencimento, situacao);

create table if not exists usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  nome varchar(120) not null,
  usuario varchar(80) not null,
  usuario_normalizado varchar(80) not null unique,
  senha_hash varchar(200) not null,
  perfil varchar(30) not null default 'operador',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists usuarios_por_situacao on usuarios_sistema (ativo, nome);
alter table usuarios_sistema add column if not exists perfil varchar(30) not null default 'operador';
