const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');

// 🔍 ENHANCED LOGGING MIDDLEWARE
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log('\n' + '█'.repeat(80));
  console.log(`[${timestamp}] 📥 INCOMING REQUEST`);
  console.log('█'.repeat(80));
  
  // REQUEST HEADERS
  console.log(`\n🌐 CONNECTION INFO:`);
  console.log(`   • IP Address: ${ip}`);
  console.log(`   • User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
  console.log(`   • Origin: ${req.headers['origin'] || 'N/A'}`);
  
  console.log(`\n📍 REQUEST DETAILS:`);
  console.log(`   • Method: ${req.method}`);
  console.log(`   • URL: ${req.url}`);
  console.log(`   • Protocol: ${req.protocol.toUpperCase()}`);
  
  console.log(`\n📦 HEADERS:`);
  console.log(`   • Content-Type: ${req.headers['content-type']}`);
  console.log(`   • Content-Length: ${req.headers['content-length'] || 0} bytes`);
  console.log(`   • Accept: ${req.headers['accept'] || 'N/A'}`);
  console.log(`   • Accept-Encoding: ${req.headers['accept-encoding'] || 'N/A'}`);
  
  // PAYLOAD ANALYSIS
  if (req.body) {
    const bodySize = JSON.stringify(req.body).length;
    console.log(`\n📄 PAYLOAD INFO:`);
    console.log(`   • Total Size: ${bodySize} bytes (${(bodySize/1024).toFixed(2)} KB)`);
    
    if (req.body.query) {
      const query = req.body.query;
      const lines = query.split('\n').length;
      const aliases = (query.match(/v\d+:/g) || []).length;
      const verifyOtpCalls = (query.match(/verifyOtp/g) || []).length;
      const mutations = (query.match(/mutation/g) || []).length;
      
      console.log(`\n📊 GRAPHQL QUERY ANALYSIS:`);
      console.log(`   • Total Lines: ${lines}`);
      console.log(`   • Query Size: ${query.length} chars (${(query.length/1024).toFixed(2)} KB)`);
      console.log(`   • Aliases Detected: ${aliases}`);
      console.log(`   • verifyOtp() Calls: ${verifyOtpCalls}`);
      console.log(`   • Mutations: ${mutations}`);
      
      if (aliases > 0) {
        console.log(`\n🔥 ALIAS ATTACK DETECTED!`);
        console.log(`   • ${aliases} operations in 1 HTTP request`);
        console.log(`   • Amplification factor: ${aliases}x`);
        console.log(`   • Estimated DB queries: ~${aliases * 2}`);
      }
      
      // Mostra preview da query
      const preview = query.split('\n').slice(0, 15).join('\n');
      console.log(`\n📝 Query Preview (first 15 lines):`);
      console.log('─'.repeat(80));
      console.log(preview);
      if (lines > 15) {
        console.log(`\n... [${lines - 15} more lines omitted] ...`);
      }
      console.log('─'.repeat(80));
      
      // Mostra variáveis se existirem
      if (req.body.variables) {
        console.log(`\n🔧 Variables:`);
        console.log(JSON.stringify(req.body.variables, null, 2));
      }
    }
    
    // Mostra payload completo em JSON (limitado)
    const fullPayload = JSON.stringify(req.body, null, 2);
    if (fullPayload.length < 2000) {
      console.log(`\n📦 FULL PAYLOAD:`);
      console.log('─'.repeat(80));
      console.log(fullPayload);
      console.log('─'.repeat(80));
    } else {
      console.log(`\n📦 FULL PAYLOAD: [Too large - ${fullPayload.length} chars]`);
    }
  }
  
  // Captura o tempo de resposta e response body
  const start = Date.now();
  const originalSend = res.send;
  let responseBody;
  
  res.send = function(data) {
    responseBody = data;
    originalSend.call(this, data);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log(`\n${'█'.repeat(80)}`);
    console.log(`📤 RESPONSE`);
    console.log('█'.repeat(80));
    
    console.log(`\n⏱️  PERFORMANCE:`);
    console.log(`   • Response Time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`   • Operations Executed: ${operationCounter}`);
    if (operationCounter > 0) {
      console.log(`   • Avg Time/Operation: ${(duration/operationCounter).toFixed(2)}ms`);
    }
    
    console.log(`\n📊 HTTP RESPONSE:`);
    console.log(`   • Status Code: ${res.statusCode} ${getStatusText(res.statusCode)}`);
    console.log(`   • Content-Type: ${res.getHeader('content-type') || 'N/A'}`);
    console.log(`   • Content-Length: ${res.getHeader('content-length') || 'N/A'} bytes`);
    
    // Mostra preview da resposta
    if (responseBody) {
      try {
        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        const responseSize = JSON.stringify(parsed).length;
        
        console.log(`\n📦 RESPONSE BODY:`);
        console.log(`   • Size: ${responseSize} bytes (${(responseSize/1024).toFixed(2)} KB)`);
        
        if (parsed.data) {
          const keys = Object.keys(parsed.data);
          console.log(`   • Data Keys: ${keys.length}`);
          
          // Conta sucessos e erros
          let successCount = 0;
          let errorCount = 0;
          keys.forEach(key => {
            const value = parsed.data[key];
            if (value && value.status === 'success') successCount++;
            if (value && value.status === 'error') errorCount++;
          });
          
          if (successCount > 0 || errorCount > 0) {
            console.log(`   • Success: ${successCount}, Errors: ${errorCount}`);
          }
          
          // Mostra preview dos primeiros resultados
          console.log(`\n📋 Response Preview (first 5 results):`);
          console.log('─'.repeat(80));
          const preview = keys.slice(0, 5).map(key => {
            return `   ${key}: ${JSON.stringify(parsed.data[key])}`;
          }).join('\n');
          console.log(preview);
          if (keys.length > 5) {
            console.log(`\n   ... [${keys.length - 5} more results] ...`);
          }
          console.log('─'.repeat(80));
        }
        
        if (parsed.errors) {
          console.log(`\n❌ GraphQL Errors:`);
          console.log(JSON.stringify(parsed.errors, null, 2));
        }
        
        // Mostra resposta completa se for pequena
        if (responseSize < 2000) {
          console.log(`\n📄 FULL RESPONSE:`);
          console.log('─'.repeat(80));
          console.log(JSON.stringify(parsed, null, 2));
          console.log('─'.repeat(80));
        }
        
      } catch (e) {
        console.log(`\n📄 Response Body: [Could not parse JSON]`);
      }
    }
    
    console.log(`\n${'█'.repeat(80)}\n`);
  });
  
  next();
};

function getStatusText(code) {
  const statuses = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return statuses[code] || '';
}

// Simulated database with delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com', bestFriendId: '2' },
  { id: '2', name: 'Bob', email: 'bob@example.com', bestFriendId: '1' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', bestFriendId: '1' },
];

const posts = [
  { id: '1', title: 'GraphQL is awesome', content: 'Lorem ipsum...', authorId: '1' },
  { id: '2', title: 'Security matters', content: 'Always validate...', authorId: '2' },
];

const typeDefs = gql`
  directive @auth(role: String) on FIELD_DEFINITION
  directive @deprecated(reason: String) on FIELD_DEFINITION
  directive @signature(hash: String) on QUERY

  type User {
    id: ID!
    name: String!
    email: String!
    bestFriend: User
    friends: [User]
    posts: [Post]
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    relatedPosts: [Post]
  }

  type OtpResult {
    status: String!
    token: String
  }

  type Query {
    users: [User]
    user(id: ID!): User
    posts: [Post]
    post(id: ID!): Post
    verifyOtp(email: String!, code: String!, tempToken: String!): OtpResult
    heavyQuery(complexity: Int): String
    search(term: String!): [User]
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    requestOtp(email: String!): String
  }

  type Subscription {
    userCreated: User
  }
`;

// Simulated OTP storage
const otpStore = {
  'dev.backoffice@hackingclub.com': { code: '1337', tempToken: 'N35tTlpEAzuP' },
  'admin@vulnerable.app': { code: '4242', tempToken: 'TestToken123' },
};

// 🔍 Contador de operações
let operationCounter = 0;

const resolvers = {
  Query: {
    users: async () => {
      operationCounter++;
      console.log(`   [Resolver] users() called - Operation #${operationCounter}`);
      await sleep(200);
      return users;
    },
    
    user: async (_, { id }) => {
      operationCounter++;
      console.log(`   [Resolver] user(${id}) called - Operation #${operationCounter}`);
      await sleep(150);
      return users.find(u => u.id === id);
    },
    
    posts: async () => {
      operationCounter++;
      console.log(`   [Resolver] posts() called - Operation #${operationCounter}`);
      await sleep(200);
      return posts;
    },
    
    post: async (_, { id }) => {
      operationCounter++;
      console.log(`   [Resolver] post(${id}) called - Operation #${operationCounter}`);
      await sleep(150);
      return posts.find(p => p.id === id);
    },
    
    // 🎯 MONITORAMENTO DE OTP
    verifyOtp: async (_, { email, code, tempToken }) => {
      operationCounter++;
      const opNum = operationCounter;
      
      console.log(`   [Resolver] verifyOtp() #${opNum}`);
      console.log(`      • Email: ${email}`);
      console.log(`      • Code: ${code}`);
      console.log(`      • Token: ${tempToken}`);
      
      await sleep(50);
      
      const stored = otpStore[email];
      if (!stored) {
        console.log(`      ❌ Email not found`);
        return { status: 'error', token: null };
      }
      
      if (stored.tempToken !== tempToken) {
        console.log(`      ❌ Invalid temp token`);
        return { status: 'invalid_token', token: null };
      }
      
      if (stored.code === code) {
        console.log(`      ✅ SUCCESS! Valid OTP found: ${code}`);
        return { status: 'success', token: 'JWT_AUTH_TOKEN_HERE_' + Math.random() };
      }
      
      return { status: 'invalid_code', token: null };
    },
    
    heavyQuery: async (_, { complexity = 1 }) => {
      operationCounter++;
      console.log(`   [Resolver] heavyQuery(${complexity}) - Operation #${operationCounter}`);
      const iterations = Math.min(complexity, 1000000);
      let result = 0;
      for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(i);
      }
      await sleep(complexity * 10);
      return `Computed with complexity ${complexity}: ${result}`;
    },
    
    search: async (_, { term }) => {
      operationCounter++;
      console.log(`   [Resolver] search("${term}") - Operation #${operationCounter}`);
      await sleep(300);
      return users.filter(u => 
        u.name.toLowerCase().includes(term.toLowerCase()) ||
        u.email.toLowerCase().includes(term.toLowerCase())
      );
    },
  },
  
  User: {
    bestFriend: async (user) => {
      operationCounter++;
      console.log(`   [Resolver] User.bestFriend - Operation #${operationCounter}`);
      await sleep(100);
      return users.find(u => u.id === user.bestFriendId);
    },
    friends: async () => {
      operationCounter++;
      console.log(`   [Resolver] User.friends - Operation #${operationCounter}`);
      await sleep(150);
      return users;
    },
    posts: async (user) => {
      operationCounter++;
      console.log(`   [Resolver] User.posts - Operation #${operationCounter}`);
      await sleep(100);
      return posts.filter(p => p.authorId === user.id);
    },
  },
  
  Post: {
    author: async (post) => {
      operationCounter++;
      console.log(`   [Resolver] Post.author - Operation #${operationCounter}`);
      await sleep(100);
      return users.find(u => u.id === post.authorId);
    },
    relatedPosts: async () => {
      operationCounter++;
      console.log(`   [Resolver] Post.relatedPosts - Operation #${operationCounter}`);
      await sleep(200);
      return posts;
    },
  },
  
  Mutation: {
    createUser: async (_, { name, email }) => {
      operationCounter++;
      console.log(`   [Resolver] createUser("${name}") - Operation #${operationCounter}`);
      const newUser = {
        id: String(users.length + 1),
        name,
        email,
        bestFriendId: '1',
      };
      users.push(newUser);
      return newUser;
    },
    requestOtp: async (_, { email }) => {
      operationCounter++;
      console.log(`   [Resolver] requestOtp("${email}") - Operation #${operationCounter}`);
      const code = String(Math.floor(1000 + Math.random() * 9000));
      otpStore[email] = { code, tempToken: 'temp_' + Date.now() };
      console.log(`      ✅ OTP Generated: ${code}`);
      return 'OTP sent to email';
    },
  },
};

async function startServer() {
  const app = express();
  
  // Parse JSON antes do logger
  app.use(express.json({ limit: '50mb' }));
  
  // 🔍 Aplica o middleware de logging
  app.use(requestLogger);
  
  const httpServer = createServer(app);
  
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });
  
  const serverCleanup = useServer({ schema }, wsServer);
  
  const server = new ApolloServer({
    schema,
    introspection: true,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      // Plugin para resetar o contador a cada request
      {
        async requestDidStart() {
          operationCounter = 0;
          return {
            async willSendResponse() {
              if (operationCounter > 0) {
                console.log(`\n🔥 TOTAL OPERATIONS EXECUTED: ${operationCounter}`);
              }
            },
          };
        },
      },
    ],
  });
  
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🎯 VULNERABLE GRAPHQL LAB - DoS ATTACKS 🎯           ║
║                  🔍 WITH DETAILED LOGGING 🔍                 ║
╠══════════════════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}/graphql                    ║
║  WebSocket: ws://localhost:${PORT}/graphql                      ║
╠══════════════════════════════════════════════════════════════╣
║  VULNERABILITIES:                                            ║
║  • Circular Definition (nested queries)                      ║
║  • GraphQL Batching (multiple ops in one request)            ║
║  • Alias Attacks (same query, different aliases)             ║
║  • Directive Overloading                                     ║
║  • No Rate Limiting                                          ║
║  • Introspection Enabled                                     ║
║  • WebSocket without WAF                                     ║
║  • OTP Brute Force via Batching                              ║
╠══════════════════════════════════════════════════════════════╣
║  LOGGING ENABLED:                                            ║
║  ✅ All requests logged in detail                            ║
║  ✅ Alias detection                                          ║
║  ✅ Operation counter                                        ║
║  ✅ Performance metrics                                      ║
╠══════════════════════════════════════════════════════════════╣
║  TEST ACCOUNTS:                                              ║
║  • dev.backoffice@hackingclub.com (token: N35tTlpEAzuP)      ║
║  • admin@vulnerable.app (token: TestToken123)                ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);
