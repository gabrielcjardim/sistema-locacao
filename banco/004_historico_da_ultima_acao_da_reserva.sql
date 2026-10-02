alter table reservas add column if not exists ultima_acao varchar(20) not null default 'confirmada';
alter table reservas add column if not exists resumo_ultima_alteracao text not null default '';

update reservas
set ultima_acao = case
  when situacao = 'cancelada' then 'cancelada'
  when situacao = 'concluida' then 'concluida'
  else 'confirmada'
end
where ultima_acao = 'confirmada';
