
````markdown
# Palestra: Hacking GraphQL - O Custo da Flexibilidade

Repositório oficial da palestra apresentada por **Gabriel Kauan (Moluck)**.
Aqui você encontra os scripts de exploração e o laboratório vulnerável demonstrado ao vivo.

## 📂 Conteúdo

* **`exploit.py`**: Script Python automatizado para explorar as vulnerabilidades (Introspection, DoS, Brute-force).
* **`graphql-dos-lab-v2/`**: Código fonte do laboratório vulnerável (Node.js + Apollo Server).
* **`graphql-dos-lab-with-logging-v2.zip`**: Versão compactada do lab para fácil distribuição.

## 🚀 Como Rodar o Lab

Você precisará do Docker e Docker Compose instalados.

1.  Entre na pasta do lab:
    ```bash
    cd graphql-dos-lab-v2
    ```

2.  Suba o container:
    ```bash
    docker-compose up -d --build
    ```

3.  Acesse o Playground no navegador:
    * URL: `http://localhost:4000/graphql`

## 💀 Executando os Ataques

O script `exploit.py` contém os módulos para cada ataque demonstrado.

**Instalação de dependências:**
```bash
pip install requests
````

**Exemplos de uso:**

```bash
# 1. Introspection (Mapeamento)
python3 exploit.py 1

# 2. Batching Attack (Bypass de Rate Limit)
python3 exploit.py 3 100

# 3. OTP Brute Force (Alias Overloading)
python3 exploit.py 5
```

````
