const coresANSI = {
    reset: "\x1b[0m",
    amarelo: "\x1b[33m",
    verde: "\x1b[32m",
    ciano: "\x1b[36m",
    roxo: "\x1b[35m"
};

const bannerVisual = `
${coresANSI.roxo}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${coresANSI.reset}
${coresANSI.amarelo}    ⚔️  A V A R E S  -  M M O R P G  2 D  ⚔️${coresANSI.reset}
${coresANSI.roxo}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${coresANSI.reset}
${coresANSI.ciano}    Apoie o projeto PIX: ${coresANSI.verde}70986804436${coresANSI.reset}
${coresANSI.roxo}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${coresANSI.reset}
`;

console.clear();
console.log(bannerVisual);

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/register', async (req, res) => {
    try {
        const { user, pass } = req.body;
        const account = await db.collection('contas').findOne({ user });
        if (account) return res.status(400).json({ message: 'USUÁRIO JÁ CADASTRADO' });
        
        const lastAccount = await db.collection('contas').find().sort({ fixedId: -1 }).limit(1).toArray();
        const nextId = (lastAccount.length > 0 ? lastAccount[0].fixedId : 0) + 1;

        const isMestre = user.toLowerCase() === 'mestre';
        const newAccount = { 
            user,
            pass, 
            characters: [], 
            adminLevel: isMestre ? 8 : 0, 
            adminRole: isMestre ? 'Dono' : 'Player',
            fixedId: nextId,
            clanTag: null,
            clanRole: null
        };
        await db.collection('contas').insertOne(newAccount);
        console.log(`Novo registro (Mongo): ${user} | ID Fixo: ${nextId}`);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/login', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ success: false, message: 'BANCO DE DADOS INDISPONÍVEL.' });
        }

        const { user, pass } = req.body;
        if (!user || !pass) {
            return res.status(400).json({ success: false, message: 'USUÁRIO E SENHA OBRIGATÓRIOS' });
        }

        const account = await db.collection('contas').findOne({ user });
        
        if (!account || account.pass !== pass) {
            return res.status(401).json({ success: false, message: 'DADOS INVÁLIDOS' });
        }

        // Apenas recusa se o socket ainda estiver ativo na lista de players
        const isAlreadyOnline = Array.from(onlineAccounts).includes(user.toLowerCase());
        if (isAlreadyOnline) {
            return res.status(403).json({ success: false, message: 'CONTA JÁ CONECTADA EM OUTRO LOCAL' });
        }

        const isMestre = user.toLowerCase() === 'mestre';
        const finalAdminLevel = isMestre ? 8 : (account.adminLevel || 0);
        const finalAdminRole = isMestre ? 'Dono' : (account.adminRole || 'Player');

        console.log(`Login (Mongo): ${user} | ID: ${account.fixedId}`);
        
        const charData = (account.characters && account.characters[0]) ? account.characters[0] : null;

        res.json({ 
            success: true,
            user, 
            characters: account.characters || [],
            adminLevel: finalAdminLevel,
            adminRole: finalAdminRole,
            fixedId: account.fixedId,
            x: charData ? charData.x : 400,
            y: charData ? charData.y : 450,
            gold: charData ? charData.gold : 1000,
            health: charData ? charData.health : 100,
            clanTag: (charData && charData.clanTag) ? charData.clanTag : null,
            clanRole: (charData && charData.clanRole) ? charData.clanRole : null
        });
    } catch (e) { 
        console.error("Erro na rota de login:", e);
        res.status(500).json({ success: false, message: 'ERRO INTERNO NO SERVIDOR' }); 
    }
});


app.get('/api/characters', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ success: false, message: 'BANCO DE DADOS INDISPONÍVEL.' });
        }
        const { user } = req.query;
        if (!user) return res.status(400).json({ success: false, message: 'Usuário não informado' });
        const account = await db.collection('contas').findOne({ user });
        if (!account) return res.status(404).json({ success: false, message: 'Conta não encontrada' });
        res.json({ success: true, characters: account.characters || [] });
    } catch (e) { 
        console.error("Erro ao buscar personagens:", e);
        res.status(500).json({ success: false, message: 'ERRO AO BUSCAR PERSONAGENS' }); 
    }
});

// --- API DE CLÃS ---
app.get('/api/clans', async (req, res) => {
    try {
        const clans = await db.collection('clans').find().toArray();
        res.json({ success: true, clans });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/clans/create', async (req, res) => {
    try {
        const { name, tag, leader } = req.body;
        const existing = await db.collection('clans').findOne({ $or: [{ name }, { tag }] });
        if (existing) return res.status(400).json({ message: "Nome ou Tag já em uso!" });

        const newClan = {
            name, tag, leader,
            members: [leader],
            history: [`${new Date().toLocaleDateString()}: Clã fundado por ${leader}`],
            dominationTime: 0,
            stats: { kills: 0, spar: 0 }
        };
        await db.collection('clans').insertOne(newClan);
        
        // Persiste a tag e o cargo no personagem do líder no MongoDB
        await db.collection('contas').updateOne(
            { "characters.name": leader },
            { 
                $set: { 
                    "characters.$.clanTag": tag, 
                    "characters.$.clanRole": "Líder" 
                } 
            }
        );
        
        // Atualiza o cache imediatamente
        cachedClans[tag] = { leader: leader, members: [leader] };
        
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/clans/join', async (req, res) => {
    try {
        const { tag, playerName, leaderName } = req.body;
        const clan = await db.collection('clans').findOne({ tag });
        if (!clan) return res.status(404).json({ message: "Clã não encontrado" });
        if (clan.members.length >= 15) return res.status(400).json({ message: "Clã lotado (Máx 15)" });
        if (clan.leader !== leaderName) return res.status(403).json({ message: "Apenas o líder pode recrutar" });

        await db.collection('clans').updateOne({ tag }, { $push: { members: playerName } });
        await db.collection('contas').updateOne({ "characters.name": playerName }, { $set: { "characters.0.clanTag": tag } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/characters', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ success: false, message: 'BANCO DE DADOS INDISPONÍVEL.' });
        }
        const { user, charData } = req.body;
        const account = await db.collection('contas').findOne({ user });
        if (!account) return res.status(404).json({ success: false, message: 'Conta não encontrada' });
        
        charData.charId = `#avares${account.fixedId}`;
        await db.collection('contas').updateOne({ user }, { $set: { characters: [charData] } });
        res.json({ success: true, charId: charData.charId });
    } catch (e) { 
        console.error("Erro ao salvar personagem:", e);
        res.status(500).json({ success: false, message: 'ERRO AO SALVAR PERSONAGEM' }); 
    }
});

const mongoUri = "mongodb+srv://rafaellimaaypa_db_user:Avares2026@cluster0.2z21fd6.mongodb.net/?appName=Cluster0";
let db = null;
let worldObjects = [];

// Estado Global de Dominação
let territories = {
    castle: { 
        name: "Camelot", 
        owner: null, 
        lastCapture: null, 
        x: 2500, 
        y: 500, 
        doorHp: 500, 
        doorMaxHp: 500, 
        doorOpen: false 
    },
    boat: { name: "Navio Pirata", owner: null, lastCapture: null, x: 2800, y: 2000 }
};

// Função de inicialização robusta
async function startServer() {
    console.log("[STARTUP] Iniciando conexão com MongoDB Atlas...");
    
    const client = new MongoClient(mongoUri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000
    });

    try {
        await client.connect();
        db = client.db("avaris_mmorpg");
        console.log("[MONGO] Conectado com sucesso!");

        // Tenta carregar o mapa. Se falhar, inicia vazio mas não derruba o servidor.
        try {
            worldObjects = await db.collection('mapa').find().toArray();
            console.log(`[MONGO] ${worldObjects.length} objetos do mapa carregados.`);
        } catch (mapError) {
            console.error("[MONGO] Erro ao carregar mapa inicial:", mapError.message);
            worldObjects = [];
        }

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`[SERVER] Rodando na porta ${PORT}`);
            console.log(`[INFO] URL de conexão: ${mongoUri.split('@')[1]}`);
        });

        // Loop de Dominação (Adiciona tempo a cada 1 minuto)
        setInterval(async () => {
            for (const key in territories) {
                const ter = territories[key];
                if (ter.owner) {
                    await db.collection('clans').updateOne(
                        { tag: ter.owner },
                        { $inc: { dominationTime: 1 } }
                    );
                }
            }
        }, 60000);

        // --- SISTEMA DE AUTO-SAVE GLOBAL (A cada 60 segundos) ---
        setInterval(async () => {
            const activePlayerIds = Object.keys(players);
            if (activePlayerIds.length === 0) return;

            console.log(`[AUTO-SAVE] Processando salvamento de ${activePlayerIds.length} jogadores...`);
            
            for (const socketId of activePlayerIds) {
                const p = players[socketId];
                const user = p?.accountUser;
                
                if (user && db) {
                    try {
                        console.log(`[AUTO-SAVE DEBUG] Gravando progresso de: ${user}`);
                        await db.collection('contas').updateOne(
                            { user: user.toLowerCase() },
                            { $set: { 
                                "characters.0.x": Math.round(p.x),
                                "characters.0.y": Math.round(p.y),
                                "characters.0.gold": p.gold,
                                "characters.0.health": p.health,
                                "characters.0.inventory": p.inventory || [],
                                "characters.0.equippedWeapon": p.equippedWeapon || null,
                                "characters.0.equippedClothes": p.equippedClothes || null,
                                "characters.0.bank": p.bank || 0
                            }}
                        );
                    } catch (err) {
                        console.error(`[AUTO-SAVE ERROR] Falha ao salvar ${user}:`, err.message);
                    }
                }
            }
        }, 60000);

    } catch (err) {
        console.error("[CRITICAL] Erro fatal de conexão MongoDB:");
        console.error("Mensagem:", err.message);
        console.error("Stack:", err.stack);
        console.log("[RETRY] O servidor tentará manter a porta aberta, mas as rotas de DB falharão.");
        
        // Inicia o servidor mesmo sem DB para evitar 503 do Render no boot, 
        // mas as rotas retornarão erro controlado.
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`[SERVER-FAILOVER] Rodando sem DB na porta ${PORT}`);
        });
    }
}

startServer();

// Gerenciamento de Jogadores Online e Cache de Clãs
let players = {};
let onlineAccounts = new Set();
let cachedClans = {}; // { tag: { leader: name, members: [] } }

function checkPortals(socket, p) {
    if (!p || !worldObjects) return;
    
    // Agora utilizamos apenas os objetos dinâmicos do mapa (PORTAL_INVISIVEL)
    // Isso evita triggers fantasmas em coordenadas fixas como a do Banco (200, 300)
    for (const obj of worldObjects) {
        if (obj.key && obj.key.toUpperCase() === 'PORTAL_INVISIVEL' && obj.destX !== undefined) {
            const dist = Math.sqrt(Math.pow(p.x - obj.x, 2) + Math.pow(p.y - obj.y, 2));
            const radius = obj.radius || 40;

            if (dist < radius) {
                p.x = obj.destX;
                p.y = obj.destY;
                console.log(`[TELEPORTE] Jogador ${p.name} atravessou portal para: ${p.x}, ${p.y}`);
                socket.emit('teleportPlayer', { x: p.x, y: p.y });
                return true;
            }
        }
    }
    return false;
}

async function loadClansCache() {
    if (!db) return;
    const clans = await db.collection('clans').find().toArray();
    clans.forEach(c => {
        cachedClans[c.tag] = { leader: c.leader, members: c.members || [] };
    });
}

io.on('connection', (socket) => {
    console.log(`Nova conexão socket: ${socket.id}`);

    socket.on('joinGame', async (playerData) => {
        if (Object.keys(cachedClans).length === 0) await loadClansCache();
        
        // Vínculo imediato e obrigatório do usuário ao socket para qualquer jogador
        const accountUser = playerData.accountUser ? playerData.accountUser.toLowerCase() : null;
        
        if (!accountUser) {
            console.warn(`[JOIN REJECTED] Tentativa de join sem conta: ${socket.id}`);
            return;
        }

        socket.accountUser = accountUser;
        socket.charId = playerData.charId;
        onlineAccounts.add(accountUser);
        
        console.log(`[AUTH-LINK] Jogador ${playerData.name} (${accountUser}) conectado no socket ${socket.id}`);

        // Busca os dados REAIS e ATUAIS do banco de dados para evitar perda de dados (Clã, Ouro, etc)
        const account = await db.collection('contas').findOne({ user: accountUser });
        const dbChar = (account && account.characters && account.characters.length > 0) ? account.characters[0] : null;

        if (!dbChar) {
            console.warn(`[JOIN REJECTED] Personagem não encontrado para: ${accountUser}`);
            return;
        }

        let savedClanTag = dbChar.clanTag || null;
        let savedClanRole = dbChar.clanRole || 'Membro';

        if (savedClanTag) {
            const clanData = cachedClans[savedClanTag] || await db.collection('clans').findOne({ tag: savedClanTag });
            if (clanData) {
                const isMember = clanData.members && clanData.members.some(m => m.toLowerCase() === dbChar.name.toLowerCase());
                const isLeader = clanData.leader && clanData.leader.toLowerCase() === dbChar.name.toLowerCase();

                if (isMember || isLeader) {
                    savedClanRole = isLeader ? 'Líder' : 'Membro';
                    if (!cachedClans[savedClanTag]) {
                        cachedClans[savedClanTag] = { leader: clanData.leader, members: clanData.members || [] };
                    }
                } else {
                    savedClanTag = null;
                    savedClanRole = 'Membro';
                }
            } else {
                savedClanTag = null;
                savedClanRole = 'Membro';
            }
        }

        // Reconstrói o playerData baseado no Banco de Dados
        const fullPlayerData = { 
            ...playerData,
            name: dbChar.name,
            gold: dbChar.gold,
            health: dbChar.health,
            maxHp: dbChar.maxHp || 100,
            inventory: dbChar.inventory || [],
            equippedWeapon: dbChar.equippedWeapon || null,
            equippedClothes: dbChar.equippedClothes || null,
            id: socket.id,
            accountUser: accountUser,
            clanTag: savedClanTag,
            clanRole: savedClanRole,
            mongoId: account._id.toString()
        };

        players[socket.id] = fullPlayerData;

        if (savedClanTag && cachedClans[savedClanTag]) {
            const membersList = cachedClans[savedClanTag].members.map(m => ({
                name: m,
                role: m === cachedClans[savedClanTag].leader ? 'Líder' : 'Membro'
            }));
            
            // Reforça a detecção de liderança na sincronização inicial
            if (cachedClans[savedClanTag].leader === playerData.name) {
                savedClanRole = 'Líder';
            }
            socket.emit('clanAtualizado', { 
                clanTag: savedClanTag, 
                clanRole: savedClanRole,
                members: membersList
            });
        }

        // Envia a lista de todos os jogadores para o novo jogador conectado
        socket.emit('currentPlayers', players);
        
        // Notifica todos os outros jogadores sobre o novo jogador
        socket.broadcast.emit('newPlayer', fullPlayerData);

        // Sincroniza os objetos do mapa existentes para o novo jogador
        socket.emit('syncMapObjects', worldObjects);
        // Sincroniza territórios
        socket.emit('syncTerritories', territories);
    });

    // Sistema de PvP: Ataque entre jogadores
    socket.on('atacarJogador', (data) => {
        const attacker = players[socket.id];
        const target = players[data.targetId];

        if (!attacker || !target || target.health <= 0) return;

        // Proteção de Fogo Amigo (Clã)
        if (attacker.clanTag && target.clanTag && attacker.clanTag === target.clanTag) return;

        let dano = data.damage || 5;
        target.health -= dano;

        // Sincroniza HP com o alvo
        io.to(data.targetId).emit('atualizarHp', target.health);

        // Feedback de dano para o atacante/outros
        io.to(data.targetId).emit('takeDamage', {
            amount: dano,
            attackerName: attacker.name,
            newHealth: target.health
        });

        if (target.health <= 0) {
            target.health = 100; // Reset para respawn
            io.to(data.targetId).emit('jogadorMorreu', { killedBy: attacker.name });
            io.emit('chatMessage', { 
                playerName: 'Sistema', 
                message: `⚔️ ${target.name} foi derrotado por ${attacker.name}!`, 
                channel: 'SISTEMA' 
            });
        }
    });

    // Evento para o Líder criar um clã via Socket
    socket.on('criarCla', async (data) => {
        const player = players[socket.id];
        const accountUser = socket.accountUser;
        if (!player || !accountUser || !db || !data.clanTag) return;

        const tag = data.clanTag.trim().toUpperCase();
        if (tag.length < 2 || tag.length > 4) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ A TAG deve ter entre 2 e 4 caracteres.', channel: 'SISTEMA' });
            return;
        }

        const existing = await db.collection('clans').findOne({ tag });
        if (existing) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: `❌ A TAG [${tag}] já está em uso por outro clã.`, channel: 'SISTEMA' });
            return;
        }

        const newClan = {
            name: tag,
            tag: tag,
            leader: player.name,
            members: [player.name],
            history: [`${new Date().toLocaleDateString()}: Clã fundado por ${player.name}`],
            dominationTime: 0,
            stats: { kills: 0, spar: 0 }
        };

        try {
            await db.collection('clans').insertOne(newClan);
            
            // Persiste no Banco garantindo que o cargo de Líder seja gravado no personagem correto
            await db.collection('contas').updateOne(
                { user: accountUser.toLowerCase() },
                { 
                    $set: { 
                        "characters.0.clanTag": tag, 
                        "characters.0.clanRole": "Líder" 
                    } 
                }
            );

            // Atualiza Cache em memória
            cachedClans[tag] = { leader: player.name, members: [player.name] };
            
            player.clanTag = tag;
            player.clanRole = "Líder";

            socket.emit('clanAtualizado', { 
                clanTag: tag, 
                clanRole: "Líder", 
                members: [{ name: player.name, role: "Líder" }] 
            });

            io.emit('chatMessage', { 
                playerName: 'Sistema', 
                message: `🏰 O clã [${tag}] foi fundado por ${player.name}!`, 
                channel: 'SISTEMA' 
            });
        } catch (err) {
            console.error("[CRIAR CLÃ ERROR]", err);
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ Erro interno ao criar clã.', channel: 'SISTEMA' });
        }
    });

    // Remover membro do clã (Ação exclusiva do Líder)
    socket.on('removerMembroCla', async (data) => {
        const leader = players[socket.id];
        const nomeAlvo = data.nomeAlvo;
        if (!leader || !leader.clanTag || !nomeAlvo) return;

        const clanData = cachedClans[leader.clanTag] || await db.collection('clans').findOne({ tag: leader.clanTag });
        const isLeader = clanData && (clanData.leader === leader.name || leader.clanRole === 'Líder');

        if (!isLeader) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ Apenas o Líder pode remover membros.', channel: 'SISTEMA' });
            return;
        }

        if (leader.name.toLowerCase() === nomeAlvo.toLowerCase()) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ Você não pode remover a si mesmo.', channel: 'SISTEMA' });
            return;
        }

        try {
            await db.collection('clans').updateOne(
                { tag: leader.clanTag },
                { $pull: { members: new RegExp('^' + nomeAlvo.trim() + '$', 'i') } }
            );

            await db.collection('contas').updateOne(
                { "characters.name": new RegExp('^' + nomeAlvo.trim() + '$', 'i') },
                { $set: { "characters.0.clanTag": null, "characters.0.clanRole": "Membro" } }
            );

            const updatedClan = await db.collection('clans').findOne({ tag: leader.clanTag });
            if (updatedClan) {
                cachedClans[leader.clanTag] = { leader: updatedClan.leader, members: updatedClan.members };
            }

            const targetSocket = Array.from(io.sockets.sockets.values()).find(s => {
                const p = players[s.id];
                return p && p.name.toLowerCase() === nomeAlvo.trim().toLowerCase();
            });

            if (targetSocket) {
                if (players[targetSocket.id]) {
                    players[targetSocket.id].clanTag = null;
                    players[targetSocket.id].clanRole = "Membro";
                }
                targetSocket.emit('clanAtualizado', { clanTag: null, clanRole: "Membro", members: [] });
                targetSocket.emit('chatMessage', { playerName: 'Sistema', message: `❌ Você foi removido do clã [${leader.clanTag}].`, channel: 'SISTEMA' });
            }

            if (updatedClan) {
                const membersList = updatedClan.members.map(m => ({
                    name: m,
                    role: m === updatedClan.leader ? 'Líder' : 'Membro'
                }));
                io.to(leader.clanTag).emit('clanAtualizado', { clanTag: leader.clanTag, clanRole: 'Líder', members: membersList });
            }
            socket.emit('chatMessage', { playerName: 'Sistema', message: `✅ ${nomeAlvo} foi removido do clã.`, channel: 'SISTEMA' });

        } catch (err) {
            console.error("Erro ao remover do clã:", err);
            console.error("[REMOVER MEMBRO ERROR]", err);
        }
    });

    // Enviar convite para um jogador específico
    socket.on('convidarCla', async (data) => {
        const player = players[socket.id];
        if (!player || !player.clanTag || !data.nomeAlvo) return;

        // Verifica se quem convida é líder (no cache ou banco)
        const clanData = cachedClans[player.clanTag] || await db.collection('clans').findOne({ tag: player.clanTag });
        const isLeader = clanData && (clanData.leader === player.name || player.clanRole === 'Líder');

        if (!isLeader) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ Apenas o Líder pode convidar novos membros.', channel: 'SISTEMA' });
            return;
        }

        // Busca o socket do alvo de forma insensível a maiúsculas/minúsculas
        const targetSocket = Array.from(io.sockets.sockets.values()).find(s => {
            const p = players[s.id];
            return p && p.name && p.name.toLowerCase() === data.nomeAlvo.trim().toLowerCase();
        });

        if (targetSocket) {
            const pTarget = players[targetSocket.id];
            if (pTarget.clanTag) {
                socket.emit('chatMessage', { playerName: 'Sistema', message: `❌ ${pTarget.name} já pertence ao clã [${pTarget.clanTag}].`, channel: 'SISTEMA' });
                return;
            }

            targetSocket.pendingClan = player.clanTag;
            targetSocket.emit('receberConviteClan', { 
                clanTag: player.clanTag, 
                leaderName: player.name 
            });
            socket.emit('chatMessage', { playerName: 'Sistema', message: `✅ Convite enviado para ${pTarget.name}.`, channel: 'SISTEMA' });
        } else {
            socket.emit('chatMessage', { playerName: 'Sistema', message: `❌ Jogador "${data.nomeAlvo}" não encontrado ou está offline.`, channel: 'SISTEMA' });
        }
    });

    // Jogador aceita o convite
    socket.on('aceitarConviteClan', async (data) => {
        const player = players[socket.id];
        const tag = (socket.pendingClan || data.clanTag || "").toUpperCase();
        if (!player || !tag) return;

        const clanData = await db.collection('clans').findOne({ tag });
        if (!clanData) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ O convite expirou ou o clã não existe mais.', channel: 'SISTEMA' });
            return;
        }

        if (clanData.members && clanData.members.length >= 15) {
            socket.emit('chatMessage', { playerName: 'Sistema', message: '❌ Este clã atingiu o limite de 15 membros.', channel: 'SISTEMA' });
            return;
        }

        player.clanTag = tag;
        player.clanRole = 'Membro';
        delete socket.pendingClan;
        
        // Atualiza o Banco de Dados (Coleção Clãs)
        await db.collection('clans').updateOne({ tag }, { $addToSet: { members: player.name } });
        
        // Atualiza o Banco de Dados (Coleção Contas/Personagem)
        const accountUser = socket.accountUser;
        if (accountUser) {
            await db.collection('contas').updateOne(
                { user: accountUser.toLowerCase() }, 
                { $set: { "characters.0.clanTag": tag, "characters.0.clanRole": 'Membro' } }
            );
        }

        // Atualiza Cache em tempo real
        const updatedClan = await db.collection('clans').findOne({ tag });
        cachedClans[tag] = { leader: updatedClan.leader, members: updatedClan.members };

        const membersList = updatedClan.members.map(m => ({
            name: m,
            role: m === updatedClan.leader ? 'Líder' : 'Membro'
        }));

        // Notifica o jogador e o resto do servidor
        socket.emit('clanAtualizado', { clanTag: tag, clanRole: 'Membro', members: membersList });
        io.emit('chatMessage', { 
            playerName: 'Sistema', 
            message: `🏰 ${player.name} juntou-se ao clã [${tag}]!`, 
            channel: 'SISTEMA' 
        });
        
        // Atualiza a tag no sprite para os outros jogadores
        socket.broadcast.emit('playerMoved', player);
    });

    socket.on('sairCla', async (callback) => {
        const player = players[socket.id];
        const accountUser = socket.accountUser;

        if (!accountUser || !db) {
            console.error(`[SAIR CLÃ ERROR] Sessão inválida para socket: ${socket.id}`);
            if (callback) callback({ success: false, error: 'Sessão expirada ou Banco Offline' });
            return;
        }

        // Busca a conta para verificar o clã real no banco
        const account = await db.collection('contas').findOne({ user: accountUser.toLowerCase() });
        const char = account?.characters?.[0];
        
        // Verifica a tag em todas as fontes possíveis para evitar erro de "não pertence a clã"
        const oldClan = (char && char.clanTag) ? char.clanTag : (player ? player.clanTag : null);

        if (!oldClan || oldClan === "") {
            console.warn(`[SAIR CLÃ] Jogador ${accountUser} tentou sair mas não possui tag de clã ativa.`);
            if (callback) callback({ success: false, error: 'Você não pertence a nenhum clã' });
            return;
        }

        try {
            // Persiste a mudança usando a mesma lógica de salvamento robusto
            const result = await db.collection('contas').updateOne(
                { user: accountUser.toLowerCase() },
                { $set: { 
                    "characters.0.clanTag": null, 
                    "characters.0.clanRole": "Membro" 
                } }
            );

            if (result.acknowledged) {
                // 2. Remove o membro da coleção de clãs (e liderança se necessário)
                await db.collection('clans').updateOne(
                    { tag: oldClan },
                    { 
                        $pull: { members: player.name },
                        $set: { lastUpdate: Date.now() }
                    }
                );

                // 3. Atualiza cache local
                if (cachedClans[oldClan]) {
                    cachedClans[oldClan].members = (cachedClans[oldClan].members || []).filter(m => m !== player.name);
                }

                console.log(`[DB CLAN UPDATE] Clã [${oldClan}] removido com sucesso para: ${accountUser}`);
                
                player.clanTag = null;
                player.clanRole = "Membro";

                socket.emit('clanSaiuComSucesso');
                socket.emit('clanAtualizado', { clanTag: null, clanRole: "Membro", members: [] });
                
                io.emit('chatMessage', { 
                    playerName: 'Sistema', 
                    message: `🚪 ${player.name} saiu do clã [${oldClan}].`, 
                    channel: 'SISTEMA' 
                });

                if (callback) callback({ success: true });
            } else {
                throw new Error("Update not acknowledged by MongoDB");
            }
        } catch (err) {
            console.error(`[DB CLAN ERROR] Erro ao processar saída de clã para ${accountUser}:`, err.message);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    // Evento para atacar a porta do castelo
    socket.on('atacarPorta', (data) => {
        const player = players[socket.id];
        const ter = territories['castle'];
        if (!player || !player.clanTag || ter.doorOpen) return;

        const dano = data.damage || 10;
        ter.doorHp -= dano;

        if (ter.doorHp <= 0) {
            ter.doorHp = 0;
            ter.doorOpen = true;
            io.emit('chatMessage', { playerName: 'Sistema', message: `💥 A porta de ${ter.name} foi destruída pelo clã [${player.clanTag}]!`, channel: 'SISTEMA' });
            
            // Porta fecha sozinha após 5 minutos
            setTimeout(() => {
                ter.doorHp = ter.doorMaxHp;
                ter.doorOpen = false;
                io.emit('syncTerritories', territories);
            }, 300000);
        }
        io.emit('syncTerritories', territories);
    });

    // Evento de Dominação de Território
    socket.on('captureTerritory', (data) => {
        const { territoryKey, clanTag, playerName } = data;
        const ter = territories[territoryKey];
        
        // No castelo, só domina se a porta estiver aberta
        if (territoryKey === 'castle' && !ter.doorOpen && ter.owner !== clanTag) return;

        if (ter && clanTag && ter.owner !== clanTag) {
            ter.owner = clanTag;
            ter.lastCapture = Date.now();
            io.emit('syncTerritories', territories);
            io.emit('chatMessage', { playerName: 'Sistema', message: `🚩 O clã [${clanTag}] dominou o território: ${ter.name}!`, channel: 'SISTEMA' });
        }
    });

    // Evento para o admin adicionar um objeto
    socket.on('adminAddObject', async (objData) => {
        if (!objData.id) objData.id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Garante que todas as propriedades essenciais existam
        const fullObjData = {
            id: objData.id,
            x: objData.x,
            y: objData.y,
            key: objData.key,
            angle: objData.angle || 0,
            scaleX: objData.scaleX || 1,
            scaleY: objData.scaleY || 1,
            bodyEnable: objData.bodyEnable !== undefined ? objData.bodyEnable : (objData.key.toUpperCase() === 'COLLISION_BOX')
        };

        worldObjects.push(fullObjData);
        if (db) await db.collection('mapa').insertOne(fullObjData);
        io.emit('addMapObject', fullObjData);
    });

    // Evento para atualizar objeto existente
    socket.on('updateMapObject', async (objData) => {
        const index = worldObjects.findIndex(o => o.id === objData.id);
        if (index !== -1) {
            // Atualiza apenas os campos permitidos para não perder a 'key' ou 'id'
            const updateFields = {
                x: objData.x,
                y: objData.y,
                angle: objData.angle,
                scaleX: objData.scaleX,
                scaleY: objData.scaleY,
                bodyEnable: objData.bodyEnable
            };

            Object.assign(worldObjects[index], updateFields);
            if (db) await db.collection('mapa').updateOne({ id: objData.id }, { $set: updateFields });
            socket.broadcast.emit('updateMapObject', worldObjects[index]);
        }
    });

    // Evento para remover objeto
    socket.on('removeMapObject', async (objId) => {
        worldObjects = worldObjects.filter(o => o.id !== objId);
        await db.collection('mapa').deleteOne({ id: objId });
        io.emit('removeMapObject', objId);
    });

   socket.on('saveProgress', async (data, callback) => {
        // Tenta pegar o user do socket ou do payload data (fallback para o admin)
        const user = socket.accountUser || (data.name ? data.name : null);
        
        if (!user || !db) {
            console.error(`[SAVE ERROR] Falha de Auth/DB para: ${user}`);
            if (callback) callback({ success: false, error: 'Auth/DB Error' });
            return;
        }

        try {
            // Busca a conta de forma insensível a maiúsculas/minúsculas
            const account = await db.collection('contas').findOne({ user: new RegExp('^' + user + '$', 'i') });
            if (account) {
                // A MÁGICA: Se a conta não tem personagem (array vazio), cria um na hora!
                let char = {};
                if (account.characters && account.characters.length > 0) {
                    char = account.characters[0];
                } else {
                    char = {
                        name: data.name || user,
                        charId: `#avares${account.fixedId || Date.now()}`,
                        clanTag: null,
                        clanRole: null
                    };
                }
                
                char.x = typeof data.x === 'number' ? data.x : (char.x || 400);
                char.y = typeof data.y === 'number' ? data.y : (char.y || 450);
                char.gold = typeof data.gold === 'number' ? data.gold : (char.gold || 1000);
                char.health = typeof data.hp === 'number' ? data.hp : (char.health || 100);
                char.maxHp = data.maxHp || char.maxHp || 100;
                char.inventory = Array.isArray(data.inventory) ? data.inventory : (char.inventory || []);
                char.equippedWeapon = data.equippedWeapon || char.equippedWeapon || null;
                char.equippedClothes = data.equippedClothes || char.equippedClothes || null;
                char.bank = typeof data.bank === 'number' ? data.bank : (char.bank || 0);
        
                // Validação de clã antes de salvar
                if (data.clanTag) {
                    const clanExistente = cachedClans[data.clanTag] || await db.collection('clans').findOne({ tag: data.clanTag });
                    if (clanExistente && clanExistente.members && clanExistente.members.includes(char.name)) {
                        char.clanTag = data.clanTag;
                        char.clanRole = data.clanRole || 'Membro';
                    } else {
                        char.clanTag = null;
                        char.clanRole = 'Membro';
                    }
                } else {
                    char.clanTag = null;
                    char.clanRole = 'Membro';
                }

                // Atualiza a memória global para o Auto-Save e Disconnect não sobrescreverem com dados velhos
                if (players[socket.id]) {
                    players[socket.id].gold = char.gold;
                    players[socket.id].health = char.health;
                    players[socket.id].maxHp = char.maxHp;
                    players[socket.id].inventory = char.inventory;
                    players[socket.id].equippedWeapon = char.equippedWeapon;
                    players[socket.id].equippedClothes = char.equippedClothes;
                    players[socket.id].bank = char.bank;
                }

                const result = await db.collection('contas').updateOne(
                    { user: new RegExp('^' + user + '$', 'i') }, 
                    { $set: { characters: [char] } }
                );

                if (result.acknowledged) {
                    console.log(`[DB SAVE SUCCESS] ${user} - Gold: ${char.gold}`);
                    if (callback) callback({ success: true });
                } else {
                    throw new Error('Update not acknowledged');
                }
            } else {
                if (callback) callback({ success: false, error: 'Account not found' });
            }
        } catch (err) {
            console.error(`[DB SAVE ERROR] ${user}:`, err.message);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;

            // Verifica colisão com portais durante o movimento
            checkPortals(socket, players[socket.id]);

            players[socket.id].facing = movementData.facing;
            players[socket.id].anim = movementData.anim;
            
            // Garante que o cliente atualize gold/health ou mantenha o valor padrão de segurança
            if (typeof movementData.gold === 'number') {
                players[socket.id].gold = movementData.gold;
            } else if (players[socket.id].gold === undefined) {
                players[socket.id].gold = 1000;
            }

            if (typeof movementData.health === 'number') {
                players[socket.id].health = movementData.health;
            } else if (players[socket.id].health === undefined) {
                players[socket.id].health = 100;
            }

            if (movementData.inventory) {
                players[socket.id].inventory = movementData.inventory;
            }
            if (movementData.equippedWeapon !== undefined) {
                players[socket.id].equippedWeapon = movementData.equippedWeapon;
            }

            // Notifica todos os outros sobre a movimentação deste jogador
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', async () => {
        const user = socket.accountUser;
        const p = players[socket.id];
        
        console.log(`[DISCONNECT] Socket: ${socket.id} | Usuário: ${user || 'Anônimo'}`);
        
        if (user && db) {
            try {
                // Se o player estava ativo no jogo, força o save final
                if (p) {
                    console.log(`[DISCONNECT] Forçando save final para: ${user}`);
                    await db.collection('contas').updateOne(
                        { user: new RegExp('^' + user + '$', 'i') }, 
                        { $set: { 
                            "characters.0.x": Math.round(p.x),
                            "characters.0.y": Math.round(p.y),
                            "characters.0.gold": p.gold,
                            "characters.0.health": p.health,
                            "characters.0.inventory": p.inventory || [],
                            "characters.0.clanTag": p.clanTag,
                            "characters.0.equippedWeapon": p.equippedWeapon || null,
                            "characters.0.equippedClothes": p.equippedClothes || null,
                            "characters.0.bank": p.bank || 0
                        } }
                    );
                    console.log(`[DISCONNECT SAVE SUCCESS] Dados de ${user} salvos.`);
                }
            } catch (err) {
                console.error(`[DISCONNECT SAVE ERROR] ${user}:`, err.message);
            }
            onlineAccounts.delete(user.toLowerCase());
        }
        
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    socket.on('chatMessage', (data) => {
        // Garante que a mensagem chegue para todos com os dados do remetente
        io.emit('chatMessage', {
            senderId: socket.id,
            playerName: data.playerName || 'Jogador',
            message: data.message,
            channel: data.channel || 'GERAL'
        });
    });
});

app.post('/api/admin/action', async (req, res) => {
    try {
        let { action, targetIdentifier, value, adminUser } = req.body;

        const cleanAdmin = adminUser ? adminUser.trim().toLowerCase() : '';
        const cleanTarget = targetIdentifier ? targetIdentifier.trim() : '';

        const adminAccount = await db.collection('contas').findOne({ user: cleanAdmin });
        
        const isMestre = cleanAdmin === 'mestre';
        const isAdmin = adminAccount && adminAccount.adminLevel >= 1;

        if (!isMestre && !isAdmin) {
            return res.status(403).json({ success: false, message: "Acesso negado: Requer Nível de Admin ou Mestre" });
        }

        // Busca flexível: tenta por username ou pelo nick do personagem
        let query = { 
            $or: [
                { user: new RegExp('^' + cleanTarget + '$', 'i') },
                { "characters.name": new RegExp('^' + cleanTarget + '$', 'i') }
            ] 
        };

        const targetAccount = await db.collection('contas').findOne(query);
        if (!targetAccount) return res.status(404).json({ success: false, message: `Alvo "${targetIdentifier}" não encontrado.` });

        if (action === 'listAdmins') {
            const admins = await db.collection('contas').find({ 
                $or: [{ isAdmin: true }, { adminLevel: { $gt: 0 } }] 
            }, { projection: { user: 1, adminLevel: 1, adminRole: 1, fixedId: 1 } }).toArray();
            return res.status(200).json({ success: true, admins });
        }

        if (action === 'setPass' || action === 'setAdmin') {
            const update = {};
            if (action === 'setAdmin') {
                update.isAdmin = true;
                update.adminLevel = parseInt(value.level);
                update.adminRole = value.role;
            } else if (action === 'setPass') {
                // Verificação de Segurança Exclusiva: Somente o Mestre pode trocar senhas
                if (!isMestre) {
                    return res.status(403).json({ success: false, message: "Permissão negada: Somente o Mestre pode realizar esta ação" });
                }
                update.pass = value;
            }
            await db.collection('contas').updateOne({ _id: targetAccount._id }, { $set: update });

            const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.accountUser === targetAccount.user.toLowerCase());
            if (targetSocket) {
                targetSocket.emit('updateAdminStatus', { 
                    adminLevel: update.adminLevel, 
                    adminRole: update.adminRole 
                });
            }
        } else {
            const char = targetAccount.characters[0];
            if (!char) return res.status(404).json({ success: false, message: "Personagem não inicializado." });

            if (action === 'setGold') {
                const goldToAdd = parseInt(value);
                char.gold = (char.gold || 0) + goldToAdd;
            } else if (action === 'addItem') {
                if (!char.inventory) char.inventory = [];
                
                let itemMeta = null;
                // Simulação dos dados que estão no main.js para garantir consistência
                const weaponsData = [
                    { id: 'banner_bow', name: 'Arco Criado por Código', price: 350, atk: 25, isRanged: true, type: 'weapon' },
                    { id: 'tool_shovel', name: 'Pá de Ferro (Mineração)', price: 150, atk: 4, type: 'tool', isShovel: true },
                    { id: 'weapon_1', name: 'Adaga Básica', price: 100, atk: 5, type: 'weapon' },
                    { id: 'weapon_2', name: 'Espada Curta', price: 250, atk: 12, type: 'weapon' },
                    { id: 'weapon_3', name: 'Espada Longa', price: 500, atk: 25, type: 'weapon' },
                    { id: 'weapon_4', name: 'Espada de Ferro', price: 800, atk: 40, type: 'weapon' },
                    { id: 'weapon_5', name: 'Espada Gótica', price: 1200, atk: 60, type: 'weapon' },
                    { id: 'weapon_6', name: 'Espada Rústica', price: 150, atk: 7, type: 'weapon' },
                    { id: 'weapon_7', name: 'Cimitarra', price: 400, atk: 20, type: 'weapon' },
                    { id: 'weapon_8', name: 'Espada Élfica', price: 950, atk: 48, type: 'weapon' },
                    { id: 'weapon_9', name: 'Espada de Ouro', price: 2000, atk: 85, type: 'weapon' },
                    { id: 'weapon_10', name: 'Espada Sombria', price: 3000, atk: 120, type: 'weapon' }
                ];
                const clothesData = [
                    { id: 'cloth_adventurer', name: 'Roupa de Aventureiro', price: 120, defense: 2, type: 'clothing' },
                    { id: 'cloth_ranger', name: 'Roupa de Caçador', price: 260, defense: 4, type: 'clothing' },
                    { id: 'cloth_knight', name: 'Armadura de Cavaleiro', price: 650, defense: 8, type: 'clothing' }
                ];

                itemMeta = weaponsData.find(w => w.id === value) || clothesData.find(c => c.id === value);

                if (!itemMeta) {
                    itemMeta = { id: value, qty: 1, name: "Item Especial Admin", type: value.startsWith('cloth') ? 'clothing' : 'weapon', price: 0, atk: 10, defense: 5 };
                } else {
                    itemMeta = { ...itemMeta, qty: 1 };
                }
                
                char.inventory.push(itemMeta);
            }

            // Atualiza o banco de dados
            await db.collection('contas').updateOne(
                { _id: targetAccount._id }, 
                { $set: { "characters.0.gold": char.gold, "characters.0.inventory": char.inventory } }
            );

            // Sincronização CRÍTICA: Localiza o socket E o objeto players na memória do servidor
            const onlineSocket = Array.from(io.sockets.sockets.values()).find(s => {
                const p = players[s.id];
                const targetUserLower = targetAccount.user.toLowerCase();
                const targetCharNameLower = cleanTarget.toLowerCase();

                return (s.accountUser && s.accountUser === targetUserLower) || 
                       (p && p.name.toLowerCase() === targetCharNameLower);
            });

            if (onlineSocket && players[onlineSocket.id]) {
                const p = players[onlineSocket.id];
                if (action === 'teleport') {
                    p.x = parseInt(value.x);
                    p.y = parseInt(value.y);
                    onlineSocket.emit('teleportPlayer', { x: p.x, y: p.y });
                    onlineSocket.emit('chatMessage', { playerName: 'Sistema', message: `🚀 Você foi teleportado por um administrador!`, channel: 'SISTEMA' });
                } else if (action === 'setGold') {
                    // Atualiza a memória do servidor para o loop de save não sobrescrever com o valor antigo
                    p.gold = char.gold;
                    // Notifica o cliente para atualizar a variável local e a HUD em tempo real
                    io.to(onlineSocket.id).emit('atualizarGold', char.gold);
                    onlineSocket.emit('chatMessage', { playerName: 'Sistema', message: `💰 Um administrador definiu seu ouro para: ${char.gold}!`, channel: 'SISTEMA' });
                } else if (action === 'addItem') {
                    p.inventory = char.inventory;
                    onlineSocket.emit('chatMessage', { playerName: 'Sistema', message: `⚔️ Um administrador adicionou um item ao seu inventário!`, channel: 'SISTEMA' });
                }
                // Solicita que o cliente se sincronize completamente
                onlineSocket.emit('requestImmediateSave'); 
            }
        }
        return res.status(200).json({ success: true, message: "Ação processada com sucesso." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


// Rota curinga: garante que qualquer acesso não-API caia direto no jogo
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('<h1 style="color:red; text-align:center; margin-top:50px;">ERRO: O arquivo index.html não encontrado!</h1>');
    }
});
