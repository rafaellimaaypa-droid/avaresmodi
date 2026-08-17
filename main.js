// --- CONFIGURAÇÃO INICIAL (AVARIS 2.0 - HUD PROFISSIONAL & SISTEMA COMPLETO COM Y-SORTING E ANIMAÇÕES) ---
const TILE_SIZE = 32; 
const SPEED = 160;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: { 
        default: 'arcade', 
        arcade: { gravity: { y: 0 }, debug: false } 
    },
    scene: { preload: preload, create: create, update: update }
};

let game;
let gameStarted = false;
let player, cursors, keys, mapObjects, obstacles, monsterObstacles, arrows, groundItems, ogres;
let editMode = false;
let editMinimized = false;
let editCollisionOnly = false;
let isLoggedIn = false;
let isSaving = false;
let currentUser = null;
let charId = null;
let isInputActive = false; 
let selectedObj = null;
let currentAssetIndex = 0;
let infoText;
let minimap;
let minimapZoom = 0.2;
let activeScene;
let playerFacing = 'down'; // Sistema de Direção para Animações 4-Direcionais

// Sistema de Criação de Personagem
let isCreatingCharacter = false;
let charName = "";
let charHairColor = 0xffffff;
let charBodyColor = 0xffffff;
let charClothColor = 0xffffff;
let charLang = "Português";
let charElements = [];

// Sistema de Jogador, Ouro, Banco, Inventário, Equipamento, Sprite na Mão e Ataque
let playerGold = 1000;
let playerBankGold = 500;
let playerInventory = [];
let playerEquippedWeapon = null; 
let equippedWeaponSprite = null; 
let playerEquippedClothes = null;
let equippedClothesSprite = null;
let isAttacking = false; 

// Sistema de Controles Mobile (Toque)
let mobileMoveLeft = false;
let mobileMoveRight = false;
let mobileMoveUp = false;
let mobileMoveDown = false;
let mobileElements = [];

// Sistema de Vida, Perfil e Morte/Respawn
let playerHealth = 100;
let playerMaxHealth = 100;
let playerMana = 80;
let playerMaxMana = 100;
let isPlayerDead = false;
let playerDeaths = 0;
let deathScreenElements = [];
let profileAvatarBg, profileAvatarImg, healthBarBg, healthBarFill, healthText, hudGoldText;
let manaBarFill;
let hotbarElements = [];

// Sistema de Administração e Comandos ADM
let adminLevel = 0;
let adminRole = 'Player';
let isNoclipActive = false;
let isAdminMinimized = false;
let globalHudScale = parseFloat(localStorage.getItem('avaris_hud_scale')) || 1.0;

// Sistema de Menu / Interface
let menuElements = [];
let isMenuOpen = false;
let modalText = null;
let playerClanTag = null;
let playerClanRole = 'Membro';
let playerClanMembers = [];
window.meuClaInfo = null;
window.convitesCla = [];
let territories = {};
let clanDominationTimes = {}; // Tempo acumulado por clã
let castle = {
    x: 1600,
    y: 1200,
    owner: null,
    flag: null,
    door: null,
    captureProgress: 0
};
let npcMerchant, npcBank, bankNPC, blacksmithNPC, clothingNPC;

// Sistema de Chat Nativo do Phaser
let isChatOpen = false;
let isChatMinimized = false;
let chatBg, chatHeaderBg, chatTitle, chatMinBtn, chatCloseBtn, chatContentBg, chatInputBg;
let chatMessagesText, chatInputText;
let chatHistory = [];
let currentTypingText = "";
let chatElements = [];
let chatScrollOffset = 0;
let chatMask = null;
let chatChannel = 'GERAL';
let chatUnreadMessages = 0;
let chatUnreadText = null;
let chatChannelButtons = [];

const CHAT_CONFIG = {
    x: 440,
    y: 392,
    width: 344,
    height: 192,
    maxMessages: 100,
    visibleMessages: 6
};

// Configuração de URL Inteligente para Local e Produção
const BASE_URL = window.location.origin.replace(/\/+$/, '');

// Configuração de rede (Socket.io)
const CHAT_NETWORK = {
    enabled: true,
    url: BASE_URL
};

let socket;

// Sistema de Rede Multiplayer
let playerId = null;
let otherPlayers = {};

function conectarMultiplayerOnline() {
    if (typeof CHAT_NETWORK === 'undefined' || !CHAT_NETWORK.enabled) return;
    
    if (socket) return;

    socket = io(CHAT_NETWORK.url, {
        transports: ['websocket', 'polling'],
        autoConnect: true
    });

    socket.on('connect', () => {
        console.log(`[SOCKET] 🌐 Conexão estabelecida! ID: ${socket.id}`);
        if (isLoggedIn && charName) {
            socket.emit('joinGame', {
                x: player.x,
                y: player.y,
                name: charName,
                accountUser: currentUser,
                bodyColor: charBodyColor,
                facing: playerFacing,
                anim: player.anims.currentAnim ? player.anims.currentAnim.key : 'idle_down',
                adminRole: adminRole,
                adminLevel: adminLevel,
                clanTag: playerClanTag,
                customSpriteData: player.customSpriteData
            });
        }
    });
}

let mobileInputEl = null;
let otherPlayersGroup = null;
let otherPlayersSprites = {};

// Sistema de Balão de Fala acima do Jogador
let playerChatBubble = null;
let playerBubbleTimer = null;
let playerBubbleTween = null;

let btnZoomOut, btnZoomIn, minimapBorder;
let minimapPanel, minimapHeader, minimapTitle, minimapCoords, minimapCompass;
let minimapPlayerMarker, minimapPulse;
let minimapUiElements = [];
let minimapVisible = true;

// Lista de assets do mapa
const assetList = [
    "COLLISION_BOX",
    "BRIDGE - DAY", "BRIDGE - NIGHT",
    "CHURCH - DAY", "CHURCH - NIGHT",
    "FENCE 1 - DAY", "FENCE 1 - NIGHT", "FENCE 2 - DAY", "FENCE 2 - NIGHT",
    "GRASS DETAIL 1 - DAY", "GRASS DETAIL 1 - NIGHT", "GRASS DETAIL 2 - DAY", "GRASS DETAIL 2 - NIGHT",
    "GRASS DETAIL 3 - DAY", "GRASS DETAIL 3 - NIGHT", "GRASS DETAIL 4 - DAY", "GRASS DETAIL 4 - NIGHT",
    "GRASS DETAIL 6 - DAY", "GRASS DETAIL 6 - NIGHT", "GRASS TILE - DAY", "GRASS TILE - NIGHT",
    "GROUND DETAIL 1 - DAY", "GROUND DETAIL 1 - NIGHT", "GROUND DETAIL 2 - DAY", "GROUND DETAIL 2 - NIGHT",
    "GROUND DETAIL 3 - DAY", "GROUND DETAIL 3 - NIGHT", "GROUND DETAIL 4 - DAY", "GROUND DETAIL 4 - NIGHT",
    "GROUND DETAIL 5 - DAY", "GROUND DETAIL 5 - NIGHT", "GROUND TILE - DAY", "GROUND TILE - NIGHT",
    "HOUSE 1 - DAY", "HOUSE 2 - DAY", "HOUSE 2 - NIGHT",
    "PIT - DAY", "PIT - NIGHT",
    "STAIRS - DAY", "STAIRS - NIGHT",
    "TERRAIN SET 1 - DAY", "TERRAIN SET 1 - NIGHT",
    "TERRAIN SET 2 - DAY", "TERRAIN SET 2 - NIGHT",
    "TERRAIN SET 3 - DAY", "TERRAIN SET 3 - NIGHT",
    "TERRAIN SET 3 CURVES - DAY", "TERRAIN SET 3 CURVES - NIGHT",
    "TERRAIN SET 4 - DAY", "TERRAIN SET 4 - NIGHT",
    "TERRAIN SET 4 CURVES - DAY", "TERRAIN SET 4 CURVES - NIGHT",
    "TERRAIN SET 5 - DAY", "TERRAIN SET 5 - NIGHT",
    "TREE 1 - DAY", "TREE 1 - NIGHT", "TREE 2 - DAY", "TREE 2 - NIGHT", "TREE 3 - DAY", "TREE 3 - NIGHT",
    "WATER DETAIL 1 - DAY", "WATER DETAIL 1 - NIGHT", "WATER DETAIL 2 - DAY", "WATER DETAIL 2 - NIGHT",
    "WATER DETAIL 3 - DAY", "WATER DETAIL 3 - NIGHT", "WATER DETAIL 4 - DAY", "WATER DETAIL 4 - NIGHT",
    "WATER DETAIL 5 - DAY", "WATER DETAIL 5 - NIGHT", "WATER TILE - DAY", "WATER TILE - NIGHT"
];

// Lista de Armas e Ferramentas
const weaponsShopData = [
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

const clothesShopData = [
    { id: 'cloth_adventurer', name: 'Roupa de Aventureiro', price: 120, defense: 2, type: 'clothing' },
    { id: 'cloth_ranger', name: 'Roupa de Caçador', price: 260, defense: 4, type: 'clothing' },
    { id: 'cloth_knight', name: 'Armadura de Cavaleiro', price: 650, defense: 8, type: 'clothing' }
];

function preload() {
    this.load.image('chao', 'assets/chao.png');
    this.load.spritesheet('player_idle', 'assets/player_idle.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player_walk', 'assets/player_walk.png', { frameWidth: 32, frameHeight: 32 });

    // --- DESENHO DO OGRO VIA SCRIPT ---
    const ogreGen = this.make.graphics({ x: 0, y: 0, add: false });
    const pele = 0x558b2f;      // Verde
    const couro = 0x5d4037;     // Marrom
    const olho = 0xffeb3b;      // Amarelo

    ogreGen.fillStyle(0x000000, 0.3);
    ogreGen.fillEllipse(16, 28, 16, 6);

    ogreGen.fillStyle(pele, 1);
    ogreGen.fillRoundedRect(8, 12, 16, 16, 4);

    ogreGen.fillStyle(pele, 1);
    ogreGen.fillCircle(8, 18, 5); 
    ogreGen.fillCircle(24, 18, 5);

    ogreGen.fillStyle(couro, 1);
    ogreGen.fillRect(8, 14, 16, 4);

    ogreGen.fillStyle(pele, 1);
    ogreGen.fillCircle(16, 10, 7);

    ogreGen.fillStyle(olho, 1);
    ogreGen.fillRect(12, 8, 3, 3);
    ogreGen.fillRect(17, 8, 3, 3);

    ogreGen.fillStyle(0x000000, 1);
    ogreGen.fillRect(12, 7, 8, 2);

    ogreGen.fillStyle(0xffffff, 1);
    ogreGen.fillRect(14, 13, 1, 1);

    ogreGen.generateTexture('ogre_script', 32, 32);

    // Monstros e roupas procedurais: não exigem imagens extras na pasta assets.
    const ratGen = this.make.graphics({ x: 0, y: 0, add: false });
    ratGen.fillStyle(0x77777f, 1).fillEllipse(16, 19, 24, 14).fillCircle(8, 13, 5).fillCircle(21, 13, 5);
    ratGen.fillStyle(0xff9aaa, 1).fillCircle(10, 14, 1).fillCircle(22, 14, 1).fillRect(27, 20, 5, 2);
    ratGen.generateTexture('rat_script', 32, 32);
    const lizardGen = this.make.graphics({ x: 0, y: 0, add: false });
    lizardGen.fillStyle(0x3d9e5a, 1).fillEllipse(16, 17, 25, 12).fillTriangle(4, 17, 0, 10, 0, 24);
    lizardGen.fillStyle(0xd6ed66, 1).fillCircle(20, 15, 2).fillCircle(26, 15, 2);
    lizardGen.generateTexture('lizard_script', 32, 32);
    const bearGen = this.make.graphics({ x: 0, y: 0, add: false });
    bearGen.fillStyle(0x6d432d, 1).fillRoundedRect(6, 10, 20, 18, 7).fillCircle(10, 8, 5).fillCircle(22, 8, 5);
    bearGen.fillStyle(0xc49672, 1).fillCircle(16, 19, 6).fillCircle(14, 17, 1).fillCircle(18, 17, 1);
    bearGen.generateTexture('bear_script', 32, 32);
    const makeClothes = (key, color, trim) => {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(color, 0.9).fillRoundedRect(7, 9, 18, 20, 4).fillRect(4, 13, 24, 10);
        g.fillStyle(trim, 1).fillRect(7, 17, 18, 3).fillRect(14, 9, 4, 20);
        g.generateTexture(key, 32, 32);
    };
    makeClothes('cloth_adventurer', 0x5b7db6, 0xe6d49d);
    makeClothes('cloth_ranger', 0x3f8655, 0xc5a25d);
    makeClothes('cloth_knight', 0x6f7683, 0xf1d67b);

    const bankerGen = this.make.graphics({ x: 0, y: 0, add: false });
    bankerGen.fillStyle(0x1f315f, 1).fillRoundedRect(6, 11, 20, 19, 4).fillCircle(16, 8, 8);
    bankerGen.fillStyle(0xe6b58b, 1).fillCircle(16, 8, 6); bankerGen.fillStyle(0xffd75d, 1).fillRect(8, 17, 16, 4);
    bankerGen.generateTexture('banker_npc', 32, 32);
    const smithGen = this.make.graphics({ x: 0, y: 0, add: false });
    smithGen.fillStyle(0x713d29, 1).fillRoundedRect(6, 11, 20, 19, 4).fillCircle(16, 8, 8);
    smithGen.fillStyle(0xe3a077, 1).fillCircle(16, 8, 6); smithGen.fillStyle(0xffc72e, 1).fillRect(12, 15, 8, 12);
    smithGen.generateTexture('blacksmith_npc', 32, 32);
    const tailorGen = this.make.graphics({ x: 0, y: 0, add: false });
    tailorGen.fillStyle(0x8d3d78, 1).fillRoundedRect(6, 11, 20, 19, 4).fillCircle(16, 8, 8);
    tailorGen.fillStyle(0xf0b68d, 1).fillCircle(16, 8, 6); tailorGen.fillStyle(0xffffff, 1).fillRect(14, 14, 4, 13);
    tailorGen.generateTexture('tailor_npc', 32, 32);

    // Geração procedural do Arco
    const bowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bowGraphics.lineStyle(3, 0x8B5A2B, 1); 
    bowGraphics.beginPath();
    bowGraphics.arc(16, 16, 12, -Math.PI * 0.7, Math.PI * 0.7, false);
    bowGraphics.strokePath();
    bowGraphics.generateTexture('banner_bow', 32, 32);

    // Textura procedural para a Maçã
    const appleGen = this.make.graphics({ x: 0, y: 0, add: false });
    appleGen.fillStyle(0xe74c3c, 1);
    appleGen.fillCircle(16, 18, 10);
    appleGen.fillStyle(0x2ecc71, 1);
    appleGen.fillRect(14, 6, 4, 6);
    appleGen.generateTexture('apple_icon', 32, 32);

    // Textura procedural para a Pá
    const shovelGen = this.make.graphics({ x: 0, y: 0, add: false });
    shovelGen.fillStyle(0x8B5A2B, 1);
    shovelGen.fillRect(14, 14, 4, 16);
    shovelGen.fillStyle(0x7f8c8d, 1);
    shovelGen.fillRect(10, 6, 12, 10);
    shovelGen.generateTexture('tool_shovel', 32, 32);

    // Textura procedural para Moedas de Ouro (Drop dos Ogros)
    const coinGen = this.make.graphics({ x: 0, y: 0, add: false });
    coinGen.fillStyle(0xffd700, 1);
    coinGen.fillCircle(16, 16, 8);
    coinGen.fillStyle(0xffec8b, 1);
    coinGen.fillCircle(16, 16, 5);
    coinGen.generateTexture('coin_icon', 32, 32);

    // Textura procedural para o Ícone do Banco
    const bankGen = this.make.graphics({ x: 0, y: 0, add: false });
    bankGen.fillStyle(0x1b1b2f, 1);
    bankGen.fillRect(0, 0, 32, 32);
    bankGen.lineStyle(2, 0x418be8, 1);
    bankGen.strokeRect(2, 2, 28, 28);
    bankGen.fillStyle(0x418be8, 1);
    bankGen.fillRect(8, 10, 16, 12);
    bankGen.fillRect(6, 8, 20, 4);
    bankGen.generateTexture('bank_icon', 32, 32);

    // Textura procedural para o Ícone do Ferreiro
    const blacksmithGen = this.make.graphics({ x: 0, y: 0, add: false });
    blacksmithGen.fillStyle(0x1b1b2f, 1);
    blacksmithGen.fillRect(0, 0, 32, 32);
    blacksmithGen.lineStyle(2, 0xffd700, 1);
    blacksmithGen.strokeRect(2, 2, 28, 28);
    blacksmithGen.fillStyle(0xffd700, 1);
    blacksmithGen.fillRect(8, 14, 16, 10);
    blacksmithGen.fillRect(12, 8, 8, 6);
    blacksmithGen.generateTexture('blacksmith_icon', 32, 32);

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000, 0.5);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('COLLISION_BOX', 32, 32);

    for (let i = 1; i <= 40; i++) {
        this.load.image(`weapon_${i}`, `assets/weapon (${i}).png`);
    }

    // --- TEXTURA PROFISSIONAL DO PAINEL RPG ---
    const panelGen = this.make.graphics({ x: 0, y: 0, add: false });
    panelGen.fillStyle(0x0c0c14, 1);
    panelGen.fillRect(0, 0, 640, 480);

    panelGen.fillStyle(0x151522, 1);
    for (let x = 8; x < 632; x += 16) {
        for (let y = 8; y < 472; y += 16) {
            if ((x + y) % 32 === 0) panelGen.fillRect(x, y, 16, 16);
        }
    }

    panelGen.lineStyle(4, 0x050508, 1);
    panelGen.strokeRect(2, 2, 636, 476);
    panelGen.lineStyle(4, 0x967322, 1);
    panelGen.strokeRect(6, 6, 628, 468);
    panelGen.lineStyle(2, 0xf3e5ab, 1);
    panelGen.strokeRect(10, 10, 620, 460);

    panelGen.generateTexture('menu_panel_bg', 640, 480);

    assetList.forEach(name => {
        if (name !== 'COLLISION_BOX') {
            this.load.image(name, `assets/${name}.png`);
        }
    });
}

function create() {
    activeScene = this;
    game.canvas.oncontextmenu = (e) => e.preventDefault();

    // Inicialmente o mundo fica pausado/invisível até o login
    this.physics.world.pause();
    this.cameras.main.setAlpha(0);

    this.physics.world.setBounds(0, 0, 3200, 2400);
    this.add.tileSprite(1600, 1200, 3200, 2400, 'chao');

    mapObjects = this.add.group();
    obstacles = this.physics.add.staticGroup();
    monsterObstacles = this.physics.add.staticGroup();
    groundItems = this.add.group();
    ogres = this.physics.add.group();
    otherPlayersGroup = this.physics.add.group();

    this.physics.add.collider(ogres, monsterObstacles);
    this.physics.add.collider(ogres, obstacles);
    
    arrows = this.physics.add.group();
    this.physics.add.collider(arrows, obstacles, (arrow, obstacle) => {
        arrow.destroy();
    });
    this.physics.add.collider(arrows, monsterObstacles, (arrow, obstacle) => {
        arrow.destroy();
    });

    // --- SISTEMA DE ANIMAÇÕES COMPLETO (4-DIRECIONAIS & FALLBACKS) ---
    this.anims.create({ key: 'idle_down', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'idle_left', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'idle_right', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'idle_up', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });

    this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk_left', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    
    infoText = this.add.text(16, 88, '', { 
        font: '10px monospace', 
        fill: '#ffffff', 
        backgroundColor: '#0c0c14ee',
        padding: { x: 8, y: 8 },
        lineSpacing: 2
    }).setScrollFactor(0).setDepth(1000).setStroke('#967322', 1);
    infoText.setVisible(false);

    const btnMinEdit = this.add.text(16, 65, ' [-] EDITOR ', {
        font: 'bold 10px monospace', fill: '#f3e5ab', backgroundColor: '#1b1b2f', padding: { x: 6, y: 4 },
        stroke: '#967322', strokeThickness: 1
    }).setScrollFactor(0).setDepth(1001).setInteractive().setVisible(false);

    btnMinEdit.on('pointerdown', () => {
        editMinimized = !editMinimized;
        infoText.setVisible(!editMinimized && editMode);
        btnMinEdit.setText(editMinimized ? ' [+] PAINEL DO EDITOR ' : ' [-] PAINEL DO EDITOR ');
        btnMinEdit.setBackgroundColor(editMinimized ? '#1b3d1b' : '#1b1b2f');
    });

    this.input.keyboard.on('keydown-F1', (event) => {
        event.preventDefault();
        const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
        const isAdmin = adminLevel >= 8;
        if (!isMestre && !isAdmin) return;
        if (isMenuOpen || isChatOpen || isPlayerDead) return;

        editMode = !editMode;
        if (editMode) editMinimized = false;
        
        infoText.setVisible(editMode && !editMinimized);
        btnMinEdit.setVisible(editMode);
        
        activeScene.atualizarVisibilidadeColisoes();

        if (!editMode && selectedObj) {
            if (selectedObj.clearTint) selectedObj.clearTint();
            selectedObj = null;
        }
    });
    activeScene.btnMinEdit = btnMinEdit;

    // --- NOVO HUD Glassmorphism ---
    const hudGroup = this.add.container(20, 20).setScrollFactor(0).setDepth(1000);

    // Fundo do Perfil (Vidro Fosco)
    profileAvatarBg = this.add.rectangle(30, 30, 60, 60, 0xffffff, 0.15).setStrokeStyle(1, 0xffffff, 0.3);
    profileAvatarImg = this.add.sprite(30, 30, 'player_idle', 0).setScale(1.5);

    // Barras de Vida e Mana Modernas
    const barW = 160;
    const createModernBar = (x, y, color, label) => {
        const bg = this.add.rectangle(x + barW/2, y, barW, 12, 0x000000, 0.4).setStrokeStyle(1, 0xffffff, 0.2);
        const fill = this.add.rectangle(x + 1, y - 5, barW - 2, 10, color).setOrigin(0, 0);
        const txt = this.add.text(x + barW/2, y, label, { font: 'bold 9px monospace', fill: '#fff' }).setOrigin(0.5);
        return { bg, fill, txt };
    };

    const hpBar = createModernBar(70, 20, 0xff4444, `${playerHealth}/${playerMaxHealth}`);
    healthBarFill = hpBar.fill;
    healthText = hpBar.txt;
    healthBarBg = hpBar.bg;

    const mpBar = createModernBar(70, 38, 0x4488ff, `${playerMana}/${playerMaxMana}`);
    manaBarFill = mpBar.fill;

    hudGoldText = this.add.text(70, 52, `💰 ${playerGold} GOLD`, { 
        font: 'bold 14px monospace', 
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
    });

    hudGroup.add([profileAvatarBg, profileAvatarImg, hpBar.bg, hpBar.fill, hpBar.txt, mpBar.bg, mpBar.fill, mpBar.txt, hudGoldText]);

    // --- HOTBAR (INFERIOR CENTRAL) ---
    const hotbarX = 400 - ((5 * 46) / 2) + 20;
    const hotbarY = 560;
    const slotS = 40;
    const hotbarContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    this.hotbarContainer = hotbarContainer;
    
    for (let i = 1; i <= 5; i++) {
        const px = hotbarX + (i - 1) * (slotS + 6);
        const slot = this.add.rectangle(px, hotbarY, slotS, slotS, 0xffffff, 0.1)
            .setStrokeStyle(1, 0xffffff, 0.3)
            .setInteractive();
            
        const num = this.add.text(px - 14, hotbarY - 14, i, { font: 'bold 8px monospace', fill: '#ffffff' })
            .setAlpha(0.6);
        
        slot.on('pointerover', () => { slot.setAlpha(0.25); slot.setStrokeStyle(1, 0xffffff, 0.8); });
        slot.on('pointerout', () => { slot.setAlpha(0.1); slot.setStrokeStyle(1, 0xffffff, 0.3); });
        
        hotbarContainer.add([slot, num]);
        hotbarElements.push(slot, num);
    }

    // --- CRIAR CONTROLES MOBILE ---
    criarControlesMobile(this);

    // --- NPCS (BANCO E FERREIRO) COM Y-SORTING INICIALIZADO ---
    bankNPC = this.physics.add.sprite(200, 300, 'banker_npc').setImmovable(true).setScale(1.35);
    bankNPC.body.allowGravity = false;
    bankNPC.setDepth(bankNPC.y);
    npcBank = bankNPC;

    let npcBankLabel = this.add.text(200, 265, '🏦 Banco', {
        font: 'bold 11px monospace',
        fill: '#418be8',
        backgroundColor: '#0c0c14ee',
        padding: { x: 6, y: 3 },
        stroke: '#1b1b2f',
        strokeThickness: 2
    }).setOrigin(0.5);

    blacksmithNPC = this.physics.add.sprite(950, 300, 'blacksmith_npc').setImmovable(true).setScale(1.35);
    blacksmithNPC.body.allowGravity = false;
    blacksmithNPC.setDepth(blacksmithNPC.y);
    npcMerchant = blacksmithNPC;

    let npcLabel = this.add.text(950, 265, '⚔️ Ferreiro', {
        font: 'bold 11px monospace',
        fill: '#ffd700',
        backgroundColor: '#0c0c14ee',
        padding: { x: 6, y: 3 },
        stroke: '#967322',
        strokeThickness: 2
    }).setOrigin(0.5);

    clothingNPC = this.physics.add.sprite(580, 300, 'tailor_npc').setImmovable(true).setScale(1.35);
    clothingNPC.body.allowGravity = false;
    clothingNPC.setDepth(clothingNPC.y);
    this.add.text(580, 265, 'Loja de Roupas', {
        font: 'bold 11px monospace', fill: '#f0a8df', backgroundColor: '#0c0c14ee', padding: { x: 6, y: 3 }, stroke: '#5b2452', strokeThickness: 2
    }).setOrigin(0.5);

    // --- MONSTROS CONCENTRADOS NO CENTRO DO MAPA (LONGE DO SPAWN 400,450) ---
    const ogreSpawnLocations = [
        { x: 1500, y: 1100, texture: 'ogre_script', name: 'Ogro', hp: 50, gold: 50 },
        { x: 1700, y: 1100, texture: 'ogre_script', name: 'Ogro', hp: 50, gold: 50 },
        { x: 1500, y: 1300, texture: 'ogre_script', name: 'Ogro', hp: 50, gold: 50 },
        { x: 1700, y: 1300, texture: 'ogre_script', name: 'Ogro', hp: 50, gold: 50 },
        { x: 1600, y: 1200, texture: 'rat_script', name: 'Rato', hp: 20, gold: 15 },
        { x: 1650, y: 1150, texture: 'rat_script', name: 'Rato', hp: 20, gold: 15 },
        { x: 1550, y: 1250, texture: 'rat_script', name: 'Rato', hp: 20, gold: 15 },
        { x: 1600, y: 1350, texture: 'rat_script', name: 'Rato', hp: 20, gold: 15 },
        { x: 1400, y: 1000, texture: 'lizard_script', name: 'Lagarto', hp: 35, gold: 30 },
        { x: 1800, y: 1000, texture: 'lizard_script', name: 'Lagarto', hp: 35, gold: 30 },
        { x: 1400, y: 1400, texture: 'lizard_script', name: 'Lagarto', hp: 35, gold: 30 },
        { x: 1800, y: 1400, texture: 'lizard_script', name: 'Lagarto', hp: 35, gold: 30 },
        { x: 1600, y: 1000, texture: 'bear_script', name: 'Urso', hp: 90, gold: 80 },
        { x: 1600, y: 1400, texture: 'bear_script', name: 'Urso', hp: 90, gold: 80 },
        { x: 1400, y: 1200, texture: 'bear_script', name: 'Urso', hp: 90, gold: 80 },
        { x: 1800, y: 1200, texture: 'bear_script', name: 'Urso', hp: 90, gold: 80 }
    ];

    ogreSpawnLocations.forEach(pos => {
        let ogre = ogres.create(pos.x, pos.y, pos.texture || 'ogre_script');
        ogre.setCollideWorldBounds(true);
        ogre.setBounce(1);
        ogre.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-30, 30));
        ogre.setData('hp', pos.hp || 50);
        ogre.setData('maxHp', pos.hp || 50);
        ogre.setData('monsterName', pos.name || 'Ogro');
        ogre.setData('dropGold', pos.gold || 50);
        ogre.setDepth(ogre.y); 
        if (minimap) minimap.ignore(ogre);
    });

    // --- SISTEMA DE COLISÕES ---
    this.physics.add.collider(ogres, obstacles);
    this.physics.add.collider(ogres, monsterObstacles);
    this.physics.add.collider(ogres, bankNPC);
    this.physics.add.collider(ogres, blacksmithNPC);
    this.physics.add.collider(ogres, clothingNPC);

    criarPainelChatNativo(this);
    // conectarChatOnline será chamado dentro do fluxo de login/create para evitar conexões prematuras
    adicionarMensagemChat("Sistema", "Bem-vindo ao Avaris 2.0!");

    this.input.on('wheel', (pointer, over, deltaX, deltaY) => {
        if (!isChatOpen || isChatMinimized || isPlayerDead) return;
        const x = CHAT_CONFIG.x, y = CHAT_CONFIG.y, w = CHAT_CONFIG.width, h = CHAT_CONFIG.height;
        if (pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h) {
            const mensagensDoCanal = getChatMessagesForCurrentChannel();
            const maxOffset = Math.max(0, mensagensDoCanal.length - CHAT_CONFIG.visibleMessages);
            if (deltaY > 0) {
                if (chatScrollOffset < maxOffset) {
                    chatScrollOffset++;
                    atualizarTextoChatNativo();
                }
            } else {
                if (chatScrollOffset > 0) {
                    chatScrollOffset--;
                    atualizarTextoChatNativo();
                }
            }
        }
    });

    const emitUpdateObject = (gameObject) => {
        if (socket && socket.connected && gameObject) {
            socket.emit('updateMapObject', {
                id: gameObject.getData('id'),
                x: gameObject.x,
                y: gameObject.y,
                angle: gameObject.angle,
                scaleX: gameObject.scaleX,
                scaleY: gameObject.scaleY,
                bodyEnable: gameObject.body ? gameObject.body.enable : false
            });
        }
    };

    this.input.keyboard.on('keydown', (event) => {
        if (!gameStarted) return;
        if (isCreatingCharacter) return;
        if (!isLoggedIn || isPlayerDead) return;

        if (event.code === 'Enter') {
            if (isMenuOpen) return;
            event.preventDefault();
            if (!isChatOpen) {
                toggleChat(this);
            } else {
                if (currentTypingText.trim() !== '') {
                    processarMensagemChat(currentTypingText.trim());
                    currentTypingText = '';
                }
                atualizarTextoChatNativo();
            }
            return;
        }

        if (isChatOpen) {
            event.stopPropagation();
            if (event.code === 'Escape') {
                toggleChat(this);
            } else if (event.code === 'Backspace') {
                currentTypingText = currentTypingText.slice(0, -1);
                atualizarTextoChatNativo();
            } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                currentTypingText += event.key;
                atualizarTextoChatNativo();
            }
            return;
        }

        if (!editMode || !selectedObj) return;
        
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
            const isShift = event.shiftKey;
            const sign = isShift ? -1 : 1;
            const delta = 0.1;

            if (event.code === 'KeyD') {
                selectedObj.scaleX = Math.max(0.1, selectedObj.scaleX + (delta * sign));
            } else if (event.code === 'KeyA') {
                const oldScale = selectedObj.scaleX;
                selectedObj.scaleX = Math.max(0.1, selectedObj.scaleX + (delta * sign));
                const diff = selectedObj.scaleX - oldScale;
                selectedObj.x = Math.floor(selectedObj.x - diff * TILE_SIZE);
            } else if (event.code === 'KeyS') {
                selectedObj.scaleY = Math.max(0.1, selectedObj.scaleY + (delta * sign));
            } else if (event.code === 'KeyW') {
                const oldScale = selectedObj.scaleY;
                selectedObj.scaleY = Math.max(0.1, selectedObj.scaleY + (delta * sign));
                const diff = selectedObj.scaleY - oldScale;
                selectedObj.y = Math.floor(selectedObj.y - diff * TILE_SIZE);
            }
            
            if (selectedObj.body) selectedObj.refreshBody();
            selectedObj.setDepth(selectedObj.y); 
            emitUpdateObject(selectedObj);
        }

        if (event.code === 'KeyQ') {
            selectedObj.angle -= 10;
            emitUpdateObject(selectedObj);
        } else if (event.code === 'KeyE') {
            selectedObj.angle += 10;
            emitUpdateObject(selectedObj);
        }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (!editMode || isChatOpen || isPlayerDead) return;
        gameObject.x = Math.floor(dragX / TILE_SIZE) * TILE_SIZE;
        gameObject.y = Math.floor(dragY / TILE_SIZE) * TILE_SIZE;
        if (gameObject.body) gameObject.body.reset(gameObject.x, gameObject.y);
        gameObject.setDepth(gameObject.y); 
        
        // Sincroniza a movimentação e propriedades do objeto
        if (socket && socket.connected) {
            socket.emit('updateMapObject', {
                id: gameObject.getData('id'),
                x: gameObject.x,
                y: gameObject.y,
                angle: gameObject.angle,
                scaleX: gameObject.scaleX,
                scaleY: gameObject.scaleY,
                bodyEnable: gameObject.body ? gameObject.body.enable : false
            });
        }
    });

    this.input.on('gameobjectdown', (pointer, gameObject) => {
        if (!editMode || isChatOpen || isPlayerDead) return;
        if (pointer.rightButtonDown() || pointer.button === 2) {
            if (selectedObj === gameObject) selectedObj = null;
            const objId = gameObject.getData('id');
            gameObject.destroy();
            if (socket && socket.connected && objId) {
                socket.emit('removeMapObject', objId);
            }
            return;
        }
        if (selectedObj && selectedObj.clearTint) selectedObj.clearTint();
        selectedObj = gameObject;
        if (selectedObj && selectedObj.setTint) selectedObj.setTint(0xff0000);
    });

    this.input.on('pointerdown', (pointer) => {
        if (isPlayerDead) return;
        if (pointer.rightButtonDown() || pointer.button === 2) return;
        if (isMenuOpen || isChatOpen) return;

        if (pointer.x < 180 && pointer.y > 440) return; 
        if (pointer.x > 600 && pointer.y > 440) return; 

        if (editMode) {
            const clickedObjects = this.input.hitTestPointer(pointer);
            if (clickedObjects.length === 0) {
                const worldX = Math.floor(pointer.worldX / TILE_SIZE) * TILE_SIZE;
                const worldY = Math.floor(pointer.worldY / TILE_SIZE) * TILE_SIZE;
                const chosenKey = assetList[currentAssetIndex];
                
                const objId = Date.now() + Math.random().toString(36).substr(2, 9);
                const objData = { id: objId, x: worldX, y: worldY, key: chosenKey, angle: 0, scaleX: 1, scaleY: 1 };
                
                // Emite para o servidor para sincronizar e salvar no banco
                if (socket && socket.connected) {
                    socket.emit('adminAddObject', objData);
                }
                
                activeScene.atualizarVisibilidadeColisoes();
            }
        } else {
            if (playerEquippedWeapon && playerEquippedWeapon.isRanged) {
                atirarFlecha(this, pointer);
            } else {
                atacarComEspada(this);
            }
        }
    });

    // Tecla G para coletar itens do chão ou interagir
    this.input.keyboard.on('keydown-G', () => {
        if (isChatOpen || isMenuOpen || isPlayerDead) return;
        
        let coletado = false;
        groundItems.children.iterate(drop => {
            if (!coletado && drop && drop.active) {
                let dist = Phaser.Math.Distance.Between(player.x, player.y, drop.x, drop.y);
                if (dist < 50) {
                    let data = drop.getData('itemData');
                    if (data) {
                        if (data.type === 'gold') {
                            playerGold += (data.value || 50);
                            atualizarHudGold();
                            drop.destroy();
                            coletado = true;
                        } else {
                            let sucesso = adicionarItemInventario(this, data);
                            if (sucesso) {
                                drop.destroy();
                                coletado = true;
                            }
                        }
                    }
                }
            }
        });

        if (!coletado) {
            checarInteracaoGeral(this);
        }
    });

    this.input.keyboard.on('keydown-E', () => {
        if (!isPlayerDead) checarInteracaoGeral(this);
    });

    const atualizarVisibilidadeColisoes = () => {
        monsterObstacles.children.iterate(child => {
            const tKey = child.getData('tileKey');
            if (tKey && tKey.toUpperCase() === 'COLLISION_BOX') {
                child.setAlpha(editMode ? 0.5 : 0);
            }
        });
    };

    activeScene.atualizarVisibilidadeColisoes = atualizarVisibilidadeColisoes;

    this.input.keyboard.on('keydown-C', () => {
        if (!editMode || isChatOpen || isPlayerDead) return;
        editCollisionOnly = !editCollisionOnly;
        monsterObstacles.children.iterate(obj => {
            if (obj.input) obj.input.enabled = !editCollisionOnly;
        });
        atualizarTextoEditor();
    });

    this.input.keyboard.on('keydown-SPACE', () => {
        if (!editMode || !selectedObj || isChatOpen || isPlayerDead) return;
        const key = selectedObj.getData('tileKey');
        const x = Math.floor(selectedObj.x + TILE_SIZE);
        const y = Math.floor(selectedObj.y);
        const angle = selectedObj.angle;
        const scaleX = selectedObj.scaleX;
        const scaleY = selectedObj.scaleY;
        if (selectedObj.clearTint) selectedObj.clearTint();
        selectedObj = adicionarObjeto(this, x, y, key, angle, scaleX, scaleY);
        if (selectedObj && selectedObj.setTint) selectedObj.setTint(0xff0000);
    
        // Sincroniza o clone via rede
        if (socket && socket.connected) {
            socket.emit('adminAddObject', { x, y, key, angle, scaleX, scaleY });
        }

        activeScene.atualizarVisibilidadeColisoes();
    });

    this.input.keyboard.on('keydown-UP', () => {
        if (!editMode || isChatOpen || isPlayerDead) return;
        currentAssetIndex = (currentAssetIndex - 1 + assetList.length) % assetList.length;
        atualizarTextoEditor();
    });

    this.input.keyboard.on('keydown-DOWN', () => {
        if (!editMode || isChatOpen || isPlayerDead) return;
        currentAssetIndex = (currentAssetIndex + 1) % assetList.length;
        atualizarTextoEditor();
    });

    this.input.keyboard.on('keydown-DELETE', () => {
        if (editMode && selectedObj && !isChatOpen && !isPlayerDead) {
            const objId = selectedObj.getData('id');
            selectedObj.destroy();
            selectedObj = null;
            if (socket && socket.connected && objId) {
                socket.emit('removeMapObject', objId);
            }
        }
    });

    this.input.keyboard.on('keydown-X', () => {
        if (editMode && selectedObj && !isChatOpen && !isPlayerDead) {
            if (selectedObj.body) {
                selectedObj.body.enable = false;
                adicionarMensagemChat('Sistema', 'Colisão removida do objeto selecionado.');
            }
        }
    });

    try {
        const savedMap = localStorage.getItem('meu_jogo_mapa');
        if (savedMap) {
            carregarMapaSalvo(this);
        } else {
            criarMapaInicial(this);
        }
    } catch (e) {
        criarMapaInicial(this);
    }

    // --- JOGADOR COM Y-SORTING INICIAL (Spawn Padrão, será movido no Login) ---
    player = this.physics.add.sprite(400, 450, 'player_idle');
    player.setScale(1.3);
    player.setVisible(false);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 24); 
    player.body.setOffset(6, 6);  
    player.anims.play('idle_down', true);
    player.setDepth(player.y);

    this.physics.add.collider(player, monsterObstacles);
    this.physics.add.collider(player, blacksmithNPC);
    this.physics.add.collider(player, bankNPC);
    this.physics.add.collider(player, clothingNPC);

    // --- COLISÕES DOS OGROS COM JOGADOR E FLECHAS ---
    this.physics.add.collider(player, ogres, (playerObj, ogre) => {
        if (player.invulneravel || isPlayerDead) return;

        const defense = playerEquippedClothes ? playerEquippedClothes.defense : 0;
        playerHealth -= Math.max(1, 10 - defense);
        atualizarBarraDeVida();
        animarDanoImpacto(this, player);

        player.invulneravel = true;
        setTimeout(() => {
            if (player) player.invulneravel = false;
        }, 1000);

        if (playerHealth <= 0 && !isPlayerDead) {
            isPlayerDead = true;
            player.setVelocity(0);
            mostrarTelaMorte(this);
        }
    });

    this.physics.add.collider(arrows, ogres, (arrow, ogre) => {
        arrow.destroy();
        let bonusAtk = playerEquippedWeapon ? playerEquippedWeapon.atk : 25;
        let hp = (ogre.getData('hp') || 50) - bonusAtk;
        ogre.setData('hp', hp);
        animarDanoImpacto(this, ogre);
        if (hp <= 0) {
            criarItemNoChao(this, ogre.x, ogre.y, {
                id: 'coin_icon',
                name: 'Saco de Moedas (Ogro)',
                price: 50,
                type: 'gold',
                value: 50,
                atk: 0
            });
            ogre.destroy();
        }
    });

    // Dano de Flecha em Jogadores (PvP)
    this.physics.add.overlap(arrows, otherPlayersGroup, (arrow, otherPlayer) => {
        arrow.destroy();
        let targetData = otherPlayer.getData('playerData');
        if (targetData && socket && socket.connected) {
            if (playerClanTag && targetData.clanTag === playerClanTag) return;
            
            socket.emit('atacarJogador', {
                targetId: targetData.id,
                damage: playerEquippedWeapon ? playerEquippedWeapon.atk : 25
            });
            animarDanoImpacto(this, otherPlayer);
        }
    });

    this.cameras.main.setBounds(0, 0, 3200, 2400);
    this.cameras.main.startFollow(player, true, 0.09, 0.09);

    // --- MINIMAPA PROFISSIONAL AVARIS 2.0 ---
    const minimapX = 605;
    const minimapY = 10;
    const minimapWidth = 185;
    const minimapHeight = 135;

    minimapPanel = this.add.graphics().setScrollFactor(0).setDepth(1);
    minimapPanel.fillStyle(0x070b13, 0.94);
    minimapPanel.fillRoundedRect(595, 5, 200, 185, 12);
    minimapPanel.lineStyle(2, 0xd6b85f, 0.95);
    minimapPanel.strokeRoundedRect(594, 6, 200, 174, 12);
    minimapPanel.lineStyle(1, 0x4f6f8f, 0.75);
    minimapPanel.strokeRoundedRect(598, 10, 192, 166, 9);

    minimapHeader = this.add.rectangle(695, 20, 192, 24, 0x111c2b, 0.98)
        .setScrollFactor(0).setDepth(2);

    minimapTitle = this.add.text(605, 20, 'AVARIS | MAPA', {
        font: 'bold 11px monospace', fill: '#f3e5ab'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3);

    minimapCoords = this.add.text(695, 185, 'X:0000  Y:0000', {
        font: '10px monospace', fill: '#9dc7e8'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(3);

    minimapCompass = this.add.text(612, 43, 'N', {
        font: 'bold 11px monospace', fill: '#ffdb6e',
        stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4);

    minimap = this.cameras.add(minimapX, minimapY, minimapWidth, minimapHeight);
    minimap.setName('AvarisMinimap');
    minimap.setBackgroundColor(0x09111b);
    minimap.setBounds(0, 0, 3200, 2400);
    minimap.setZoom(minimapZoom);
    minimap.startFollow(player, true, 0.12, 0.12);
    minimap.roundPixels = true;
    minimap.setAlpha(1);
    minimap.ignore(infoText);

    minimapBorder = this.add.graphics().setScrollFactor(0).setDepth(2);
    minimapBorder.lineStyle(2, 0xe6cc78, 0.95);
    minimapBorder.strokeRoundedRect(minimapX - 2, minimapY - 2, minimapWidth + 4, minimapHeight + 4, 6);
    minimapBorder.lineStyle(1, 0x7fb3d5, 0.65);
    minimapBorder.strokeRoundedRect(minimapX + 1, minimapY + 1, minimapWidth - 2, minimapHeight - 2, 4);

    minimapPulse = this.add.circle(
        minimapX + minimapWidth / 2,
        minimapY + minimapHeight / 2,
        9, 0x56e39f, 0.18
    ).setScrollFactor(0).setDepth(4);

    minimapPlayerMarker = this.add.triangle(
        minimapX + minimapWidth / 2,
        minimapY + minimapHeight / 2,
        0, 10, 6, -6, -6, -6,
        0x63f5ad, 1
    ).setScrollFactor(0).setDepth(5).setStrokeStyle(2, 0x062b1b, 1);

    this.tweens.add({
        targets: minimapPulse,
        scale: { from: 0.8, to: 1.8 },
        alpha: { from: 0.45, to: 0 },
        duration: 1100,
        repeat: -1,
        ease: 'Sine.Out'
    });

    btnZoomOut = this.add.text(750, 20, '-', {
        font: 'bold 16px monospace', fill: '#d8e9f7',
        backgroundColor: '#162638', padding: { x: 5, y: 1 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5)
      .setInteractive({ useHandCursor: true });

    btnZoomIn = this.add.text(780, 20, '+', {
        font: 'bold 16px monospace', fill: '#d8e9f7',
        backgroundColor: '#162638', padding: { x: 5, y: 1 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5)
      .setInteractive({ useHandCursor: true });

    btnZoomOut.on('pointerdown', () => {
        if (!isPlayerDead && minimap) {
            minimapZoom = Phaser.Math.Clamp(minimapZoom - 0.025, 0.08, 0.50);
            minimap.setZoom(minimapZoom);
            atualizarTextoEditor();
        }
    });

    btnZoomIn.on('pointerdown', () => {
        if (!isPlayerDead && minimap) {
            minimapZoom = Phaser.Math.Clamp(minimapZoom + 0.025, 0.08, 0.50);
            minimap.setZoom(minimapZoom);
            atualizarTextoEditor();
        }
    });

    minimapUiElements = [
        minimapPanel, minimapHeader, minimapTitle, minimapCoords, minimapCompass,
        minimapBorder, minimapPulse, minimapPlayerMarker, btnZoomOut, btnZoomIn
    ];
    setMinimapVisible(true);

    const btnMenuToggle = this.add.text(550, 15, ' MENU ', {
        font: 'bold 12px monospace', fill: '#f3e5ab', backgroundColor: '#1b1b2f', padding: { x: 8, y: 6 },
        stroke: '#967322', strokeThickness: 2
    }).setScrollFactor(0).setDepth(1000).setInteractive();

    const btnChatToggle = this.add.text(460, 15, ' CHAT ', {
        font: 'bold 12px monospace', fill: '#f3e5ab', backgroundColor: '#1b1b2f', padding: { x: 8, y: 6 },
        stroke: '#967322', strokeThickness: 2
    }).setScrollFactor(0).setDepth(1000).setInteractive();

    const btnAdminToggle = this.add.text(360, 15, ' ADMIN 🛡️ ', {
        font: 'bold 12px monospace', fill: '#ffffff', backgroundColor: '#881111', padding: { x: 8, y: 6 },
        stroke: '#ff4444', strokeThickness: 2
    }).setScrollFactor(0).setDepth(1000).setInteractive();
    btnAdminToggle.setVisible(false);
    activeScene.btnAdminToggle = btnAdminToggle;

    btnMenuToggle.on('pointerdown', () => { if (!isPlayerDead) toggleGameMenu(this); });
    btnChatToggle.on('pointerdown', () => { if (!isPlayerDead) toggleChat(this); });
    btnAdminToggle.on('pointerdown', () => { 
        const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
        if (!isPlayerDead && (adminLevel > 0 || isMestre)) abrirPainelAdmin(this); 
    });

    this.input.keyboard.on('keydown-M', () => { if (!isChatOpen && !isPlayerDead) toggleGameMenu(this); });
    this.input.keyboard.on('keydown-F', (event) => {
        if (isChatOpen || isMenuOpen || isPlayerDead || !isLoggedIn) return;
        if (document.activeElement.tagName === 'INPUT') return;
        
        event.preventDefault();
        
        if (!coletarItemProximo(this)) {
            checarInteracaoGeral(this);
        }
    });

    minimap.ignore([
        ...minimapUiElements, btnMenuToggle, btnChatToggle, npcLabel, npcBankLabel,
        hudGroup, profileAvatarBg, profileAvatarImg, healthBarBg, healthBarFill, healthText, hudGoldText,
        manaBarFill, ...hotbarElements, ...chatElements, ...mobileElements,
        this.hotbarContainer, this.btnAdminToggle
    ]);

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D');

    this.input.keyboard.on('keydown-S', (event) => {
        if (event.ctrlKey && !isChatOpen && !isPlayerDead) {
            event.preventDefault();
            salvarMapa();
        }
    });

    atualizarSpriteArmaEquipada(this);
    atualizarTextoEditor();

    drawCastle(this);

    // Esconde HUDs iniciais
    setMinimapVisible(false);
    if (profileAvatarBg) profileAvatarBg.setVisible(false);
    if (healthBarBg) healthBarBg.setVisible(false);
    if (healthBarFill) healthBarFill.setVisible(false);
    if (healthText) healthText.setVisible(false);
    if (hudGoldText) hudGoldText.setVisible(false);

}

function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }

    game = new Phaser.Game(config);
    conectarMultiplayerOnline();
}

// Inicializa botões de login fora do ciclo do Phaser
window.onload = setupLoginButtons;

function setupLoginButtons() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    if (btnLogin) { 
        btnLogin.disabled = false; 
        btnLogin.style.opacity = "1";
        btnLogin.onclick = () => handleAuth('login');
    }
    if (btnRegister) { 
        btnRegister.disabled = false; 
        btnRegister.style.opacity = "1";
        btnRegister.onclick = () => handleAuth('register');
    }
}

async function handleAuth(type) {
    const userField = document.getElementById('username');
    const passField = document.getElementById('password');
    const user = userField ? userField.value.trim() : "";
    const pass = passField ? passField.value.trim() : "";
    
    if (!user || !pass) {
        alert("Preencha todos os campos!");
        return;
    }

    const errorEl = document.getElementById('auth-error');
    errorEl.innerText = "Processando...";

    try {
        const response = await fetch(`${BASE_URL}/api/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.innerText = data.message || "Erro na autenticação";
            if (response.status === 403) {
                alert(data.message);
            }
            return;
        }

        isLoggedIn = true;
        currentUser = user; 
        charId = data.fixedId;
        adminLevel = data.adminLevel || 0;
        adminRole = data.adminRole || 'Player';
        startGame();
        conectarChatOnline();

        const checkScene = setInterval(async () => {
            if (activeScene && player) {
                clearInterval(checkScene);
                
                activeScene.physics.world.resume();
                activeScene.cameras.main.setAlpha(1);
                
                if (!data.characters || data.characters.length === 0) {
                    abrirCriacaoPersonagem(activeScene);
                } else {
                    finalizarLoginComDados(data.characters[0]);
                }
            }
        }, 100);
    } catch (err) {
        errorEl.innerText = "Erro ao conectar com o servidor.";
        console.error(err);
    }
}

function finalizarLoginComDados(userData) {
    // Carrega posição e status salvos do servidor explicitamente
    console.log(`Carregando personagem: ${userData.name} em X:${userData.x} Y:${userData.y}`);
    
    player.setPosition(userData.x || 400, userData.y || 450);
    player.body.reset(player.x, player.y);
    player.setVisible(true);
    
    playerGold = userData.gold !== undefined ? userData.gold : 1000;
    playerBankGold = userData.bank !== undefined ? userData.bank : 500;
    playerHealth = (userData.health !== undefined && userData.health !== null) ? userData.health : 100;
    playerMaxHealth = userData.maxHp || 100;
    playerInventory = userData.inventory || [];
    playerEquippedWeapon = userData.equippedWeapon || null;
    playerEquippedClothes = userData.equippedClothes || null;
    playerClanTag = (userData.clanTag && userData.clanTag !== "") ? userData.clanTag : null;
    playerClanRole = userData.clanRole || 'Membro';

    if (userData.customSpriteData) {
        console.log("[SKIN] 📥 Iniciando carregamento de skin customizada do banco...");
        player.customSpriteData = userData.customSpriteData;
        const texKey = 'customPlayerSkin';
        
        activeScene.textures.addBase64(texKey, userData.customSpriteData);
        
        activeScene.textures.once('addtexture', (key) => {
            if (key === texKey) {
                console.log("[SKIN] ✅ Textura Base64 processada. Aplicando substituição total.");
                
                player.setTexture(texKey);
                player.setFrame(0);
                player.clearTint(); // Remove o branco do boneco padrão para não afetar a skin
                
                console.log("[SKIN] 🎭 Skin aplicada. Boneco base substituído.");
            }
        });

        // Fallback de segurança para garantir ocultação da base
        setTimeout(() => {
            if (player && activeScene.textures.exists(texKey)) {
                player.setTexture(texKey);
                player.clearTint();
            }
        }, 500);
            
        if (socket && socket.connected) {
            socket.emit('playerMovement', {
                id: socket.id,
                x: player.x,
                y: player.y,
                customSpriteData: player.customSpriteData
            });
        }
    } else {
        console.log("[SKIN] 👤 Usando boneco padrão (Sem skin customizada detectada).");
    }
    charName = userData.name;
    charId = userData.charId; 
    charBodyColor = userData.bodyColor;
    player.setTint(charBodyColor);

    // Recriar o texto do nome embaixo do player ao carregar dados salvos
    let displayName = (playerClanTag && playerClanTag !== "") ? `${charName} (${playerClanTag})` : charName;
    player.playerNameText = activeScene.add.text(player.x, player.y + 28, displayName, {
        font: 'bold 12px monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(player.depth + 1);

    if (adminLevel > 0 || (currentUser && currentUser.toLowerCase() === 'mestre')) {
        player.adminTag = activeScene.add.text(player.x, player.y + 40, adminRole.toUpperCase(), {
            font: 'bold 9px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(player.depth + 1);
        if (minimap) minimap.ignore(player.adminTag);
    }
    
    if (minimap) minimap.ignore(player.playerNameText);
    
    setMinimapVisible(true);
    if (profileAvatarBg) profileAvatarBg.setVisible(true);
    if (healthBarBg) healthBarBg.setVisible(true);
    if (healthBarFill) healthBarFill.setVisible(true);
    if (healthText) healthText.setVisible(true);
    if (hudGoldText) hudGoldText.setVisible(true);
    const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
    if (activeScene.btnAdminToggle && (adminLevel > 0 || isMestre)) {
        activeScene.btnAdminToggle.setVisible(true);
    }

    if (socket) {
        socket.emit('joinGame', {
            x: player.x,
            y: player.y,
            name: charName,
            accountUser: currentUser,
            bodyColor: charBodyColor,
            facing: playerFacing,
            anim: 'idle_down',
            adminRole: adminRole,
            adminLevel: adminLevel
        });
    }
    
    atualizarBarraDeVida();
    atualizarHudGold();
    atualizarSpriteArmaEquipada(activeScene);
    atualizarSpriteRoupaEquipada(activeScene);
    adicionarMensagemChat('Sistema', `Bem-vindo de volta, ${charName}!`);
}

function abrirCriacaoPersonagem(scene) {
    isCreatingCharacter = true;
    setMinimapVisible(false);

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x0c0c14, 1).setScrollFactor(0).setDepth(5000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(5001);
    const title = scene.add.text(400, 60, 'CRIAR PERSONAGEM', { font: 'bold 24px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(5002);

    const preview = scene.add.sprite(400, 160, 'player_idle', 0).setScale(4).setScrollFactor(0).setDepth(5002);
    
    const labelName = scene.add.text(250, 240, 'NOME:', { font: 'bold 14px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(5002);
    charElements.push(labelName);
    const inputNameBg = scene.add.rectangle(450, 248, 250, 30, 0x12121a).setScrollFactor(0).setDepth(5002).setStrokeStyle(1, 0x3d3d5c).setInteractive();
    const inputNameTxt = scene.add.text(335, 241, charName || 'Digitar...', { font: '14px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(5003);
    inputNameBg.on('pointerdown', () => {
        let n = prompt("Nome do personagem:", charName);
        if (n) { charName = n.substring(0, 12); inputNameTxt.setText(charName); }
    });

    const cores = [0xffffff, 0xffd700, 0x5b7db6, 0xb81414, 0x3f8655, 0x6d432d, 0x1b1b2f];
    
    const criarSeletor = (y, label, targetVar) => {
        const txtLabel = scene.add.text(250, y, label, { font: 'bold 12px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(5002);
        charElements.push(txtLabel);
        cores.forEach((cor, i) => {
            let c = scene.add.rectangle(380 + (i * 35), y + 6, 25, 25, cor).setScrollFactor(0).setDepth(5002).setStrokeStyle(1, 0xffffff).setInteractive();
            c.on('pointerdown', () => {
                if (label.includes('CABELO')) charHairColor = cor;
                if (label.includes('CORPO')) charBodyColor = cor;
                if (label.includes('ROUPA')) charClothColor = cor;
                preview.setTint(charBodyColor);
            });
            charElements.push(c);
        });
    };

    criarSeletor(300, 'COR CABELO:', 'charHairColor');
    criarSeletor(350, 'COR CORPO:', 'charBodyColor');
    criarSeletor(400, 'COR ROUPA:', 'charClothColor');

    const labelLang = scene.add.text(250, 450, 'IDIOMA:', { font: 'bold 12px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(5002);
    charElements.push(labelLang);
    const btnLang = scene.add.text(380, 445, ` [ ${charLang} ] `, { font: '12px monospace', fill: '#00ffcc', backgroundColor: '#1b1b3d', padding: { x: 10, y: 5 } }).setScrollFactor(0).setDepth(5002).setInteractive();
    btnLang.on('pointerdown', () => {
        charLang = charLang === "Português" ? "English" : "Português";
        btnLang.setText(` [ ${charLang} ] `);
    });

    const btnJogar = scene.add.text(400, 530, ' [ JOGAR AGORA ] ', { font: 'bold 20px monospace', fill: '#ffffff', backgroundColor: '#1b3d1b', padding: { x: 40, y: 15 } }).setOrigin(0.5).setScrollFactor(0).setDepth(5002).setInteractive();
    btnJogar.on('pointerdown', async () => {
        if (!charName) { alert("Escolha um nome!"); return; }

        const newCharData = {
            name: charName,
            bodyColor: charBodyColor,
            x: 400,
            y: 450,
            gold: 1000,
            bank: 500,
            health: 100
        };

        try {
            const res = await fetch(`${BASE_URL}/api/characters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser || user, charData: newCharData })
            });
            const resData = await res.json();
            if (resData.charId) {
                newCharData.charId = resData.charId;
                charId = resData.charId;
            }
        } catch (e) {
            console.error("Erro ao salvar personagem", e);
        }

        isCreatingCharacter = false;
        player.setTint(charBodyColor);
        
        // Criar o texto do nome embaixo do player após a criação
        let displayName = charName;
        player.playerNameText = scene.add.text(player.x, player.y + 28, displayName, {
            font: 'bold 12px monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(player.depth + 1);
        if (minimap) minimap.ignore(player.playerNameText);

        charElements.forEach(el => el.destroy());
        bg.destroy(); panel.destroy(); title.destroy(); preview.destroy(); labelName.destroy(); inputNameBg.destroy(); inputNameTxt.destroy(); btnLang.destroy(); btnJogar.destroy();
        
        // Mostrar HUD após criação
        setMinimapVisible(true);
        profileAvatarBg.setVisible(true);
        healthBarBg.setVisible(true);
        healthBarFill.setVisible(true);
        healthText.setVisible(true);
        hudGoldText.setVisible(true);
        adicionarMensagemChat('Sistema', `Bem-vindo, ${charName}! A aventura começa agora.`);
        
        // Sincronização inicial via Socket.io após criação
        if (socket && socket.connected) {
            socket.emit('joinGame', {
                x: player.x,
                y: player.y,
                name: charName,
                accountUser: currentUser,
                bodyColor: charBodyColor,
                facing: playerFacing,
                anim: player.anims.currentAnim ? player.anims.currentAnim.key : 'idle_down',
                adminRole: adminRole,
                adminLevel: adminLevel
            });
        }
    });

    charElements.push(bg, panel, title, preview, labelName, inputNameBg, inputNameTxt, btnLang, btnJogar);
}

function aplicarEscalaHUD() {
    // Escala EXCLUSIVAMENTE os controles mobile (Joystick e Botões de Ação)
    mobileElements.forEach(el => {
        if (el) {
            el.setScale(globalHudScale);
        }
    });
}

function setMinimapVisible(visible) {
    if (isCreatingCharacter) visible = false;
    minimapVisible = visible;
    if (minimap) minimap.setVisible(visible);

    minimapUiElements.forEach(element => {
        if (element && element.active) element.setVisible(visible);
    });
    aplicarEscalaHUD();
}

function atualizarMinimapaHUD() {
    if (!minimapVisible || !player || !minimapCoords || !minimapPlayerMarker) return;

    minimapCoords.setText(
        'X:' + Math.round(player.x).toString().padStart(4, '0') +
        '  Y:' + Math.round(player.y).toString().padStart(4, '0')
    );

    const rotationByFacing = {
        up: 0,
        right: Math.PI / 2,
        down: Math.PI,
        left: -Math.PI / 2
    };
    minimapPlayerMarker.setRotation(rotationByFacing[playerFacing] || 0);
}

function mostrarTelaMorte(scene) {
    if (isMenuOpen) toggleGameMenu(scene);
    if (isChatOpen) toggleChat(scene);
    setMinimapVisible(false);

    playerDeaths++;
    let lostCoins = Math.floor(playerGold * 0.05);
    if (lostCoins > 0) {
        playerGold -= lostCoins;
        atualizarHudGold();
        criarItemNoChao(scene, player.x, player.y, {
            id: 'coin_icon',
            name: 'Ouro Perdido',
            price: lostCoins,
            type: 'gold',
            value: lostCoins,
            atk: 0
        });
        adicionarMensagemChat('Sistema', `Você morreu e deixou cair ${lostCoins} moedas de ouro (5%).`);
    }

    let overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.85)
        .setScrollFactor(0).setDepth(4000).setInteractive();

    let title = scene.add.text(400, 230, 'VOCÊ ESTÁ MORTO', {
        font: 'bold 26px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

    let subtitle = scene.add.text(400, 275, 'Clique no botão abaixo para ressuscitar.', {
        font: '13px monospace', fill: '#aaaaaa'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

    let respawnBtn = scene.add.text(400, 340, ' [ RESPAWN ] ', {
        font: 'bold 16px monospace', fill: '#ffffff', backgroundColor: '#881111', padding: { x: 18, y: 12 },
        stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4001).setInteractive();

    respawnBtn.on('pointerover', () => respawnBtn.setScale(1.1));
    respawnBtn.on('pointerout', () => respawnBtn.setScale(1.0));

    respawnBtn.on('pointerdown', () => {
        playerHealth = playerMaxHealth;
        atualizarBarraDeVida();
        player.setPosition(400, 450);
        player.body.reset(400, 450);
        isPlayerDead = false;
        setMinimapVisible(true);
        atualizarMinimapaHUD();

        deathScreenElements.forEach(el => el.destroy());
        deathScreenElements = [];
    });

    deathScreenElements = [overlay, title, subtitle, respawnBtn];
}

function criarControlesMobile(scene) {
    let dpadX = 90;
    let dpadY = 515;
    let btnSize = 44;

    let dpadBg = scene.add.circle(dpadX, dpadY, 65, 0x0c0c14, 0.75)
        .setScrollFactor(0).setDepth(1500).setStrokeStyle(2, 0xf3e5ab, 0.8);

    let btnUp = scene.add.rectangle(dpadX, dpadY - 40, btnSize, 34, 0x1b1b2f, 0.9)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(1, 0x967322).setInteractive();
    let txtUp = scene.add.text(dpadX, dpadY - 40, '▲', { font: '16px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    let btnDown = scene.add.rectangle(dpadX, dpadY + 40, btnSize, 34, 0x1b1b2f, 0.9)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(1, 0x967322).setInteractive();
    let txtDown = scene.add.text(dpadX, dpadY + 40, '▼', { font: '16px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    let btnLeft = scene.add.rectangle(dpadX - 40, dpadY, 34, btnSize, 0x1b1b2f, 0.9)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(1, 0x967322).setInteractive();
    let txtLeft = scene.add.text(dpadX - 40, dpadY, '◄', { font: '16px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    let btnRight = scene.add.rectangle(dpadX + 40, dpadY, 34, btnSize, 0x1b1b2f, 0.9)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(1, 0x967322).setInteractive();
    let txtRight = scene.add.text(dpadX + 40, dpadY, '►', { font: '16px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    let dpadCenter = scene.add.circle(dpadX, dpadY, 14, 0xf3e5ab, 0.95)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(1, 0x554110);

    btnUp.on('pointerdown', () => { if (!isPlayerDead) mobileMoveUp = true; });
    btnUp.on('pointerup', () => { mobileMoveUp = false; });
    btnUp.on('pointerout', () => { mobileMoveUp = false; });

    btnDown.on('pointerdown', () => { if (!isPlayerDead) mobileMoveDown = true; });
    btnDown.on('pointerup', () => { mobileMoveDown = false; });
    btnDown.on('pointerout', () => { mobileMoveDown = false; });

    btnLeft.on('pointerdown', () => { if (!isPlayerDead) mobileMoveLeft = true; });
    btnLeft.on('pointerup', () => { mobileMoveLeft = false; });
    btnLeft.on('pointerout', () => { mobileMoveLeft = false; });

    btnRight.on('pointerdown', () => { if (!isPlayerDead) mobileMoveRight = true; });
    btnRight.on('pointerup', () => { mobileMoveRight = false; });
    btnRight.on('pointerout', () => { mobileMoveRight = false; });

    let actX = 720;
    let actY = 525;

    let btnAttackBg = scene.add.circle(actX, actY - 25, 28, 0x3d1212, 0.95)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(2, 0xe84141).setInteractive();
    let btnAttackTxt = scene.add.text(actX, actY - 25, '⚔️', { font: '18px sans-serif' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    btnAttackBg.on('pointerdown', () => {
        if (isMenuOpen || isChatOpen || isPlayerDead) return;
        if (playerEquippedWeapon && playerEquippedWeapon.isRanged) {
            atirarFlecha(scene, { worldX: player.x + (player.flipX ? -100 : 100), worldY: player.y });
        } else {
            atacarComEspada(scene);
        }
    });

    let btnInteractBg = scene.add.circle(actX - 65, actY + 10, 24, 0x12223d, 0.95)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(2, 0x418be8).setInteractive();
    let btnInteractTxt = scene.add.text(actX - 65, actY + 10, '🚪', { font: '16px sans-serif' }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    btnInteractBg.on('pointerdown', () => {
        if (isMenuOpen || isChatOpen || isPlayerDead) return;
        checarInteracaoGeral(scene);
    });

    let btnCollectBg = scene.add.circle(actX - 65, actY - 52, 24, 0x2d5a31, 0.95)
        .setScrollFactor(0).setDepth(1501).setStrokeStyle(2, 0x6edb75).setInteractive();
    let btnCollectTxt = scene.add.text(actX - 65, actY - 52, 'COLETAR', { font: 'bold 7px monospace', fill: '#ffffff' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(1502);
    btnCollectBg.on('pointerdown', () => {
        if (!coletarItemProximo(scene)) checarInteracaoGeral(scene);
    });

    mobileElements = [
        dpadBg, btnUp, txtUp, btnDown, txtDown, btnLeft, txtLeft, btnRight, txtRight, dpadCenter,
        btnAttackBg, btnAttackTxt, btnInteractBg, btnInteractTxt, btnCollectBg, btnCollectTxt
    ];
}

// --- SISTEMA DE ANIMAÇÃO PROCEDURAL E FEEDBACK VISUAL (GAME JUICE) ---
function animarDanoImpacto(scene, gameObject) {
    if (!gameObject || !gameObject.active) return;

    scene.tweens.add({
        targets: gameObject,
        tint: 0xff0000,
        duration: 80,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
            if (gameObject && gameObject.active) {
                gameObject.clearTint();
            }
        }
    });

    scene.tweens.add({
        targets: gameObject,
        scaleX: (gameObject.scaleX || 1) * 1.15,
        scaleY: (gameObject.scaleY || 1) * 1.15,
        duration: 60,
        yoyo: true
    });
}

// --- CRIAR ITEM NO CHÃO COM Y-SORTING ---
function criarItemNoChao(scene, x, y, itemData) {
    let drop = scene.add.image(x, y, itemData.id);
    drop.setDisplaySize(24, 24);
    drop.setDepth(y); 
    drop.setData('itemData', itemData);
    if (minimap) minimap.ignore(drop);
    groundItems.add(drop);
}

function coletarItemProximo(scene) {
    if (isMenuOpen || isChatOpen || isPlayerDead) return false;
    let coletado = false;
    groundItems.children.iterate(drop => {
        if (coletado || !drop || !drop.active) return;
        if (Phaser.Math.Distance.Between(player.x, player.y, drop.x, drop.y) >= 50) return;
        const data = drop.getData('itemData');
        if (!data) return;
        if (data.type === 'gold') {
            playerGold += data.value || 50;
            atualizarHudGold();
            salvarEstadoRemoto(); // Salva imediatamente ao coletar ouro
        } else if (!adicionarItemInventario(scene, data)) {
            return;
        } else {
            salvarEstadoRemoto(); // Salva imediatamente ao coletar item
        }
        drop.destroy();
        coletado = true;
        adicionarMensagemChat('Sistema', `Coletado: ${data.name}`);
    });
    return coletado;
}

// --- SISTEMA DE INTERAÇÃO GERAL ---
function checarInteracaoGeral(scene) {
    if (isPlayerDead) return;
    let distanciaFerreiro = Phaser.Math.Distance.Between(player.x, player.y, blacksmithNPC.x, blacksmithNPC.y);
    let distanciaBanco = Phaser.Math.Distance.Between(player.x, player.y, bankNPC.x, bankNPC.y);
    let distanciaRoupas = Phaser.Math.Distance.Between(player.x, player.y, clothingNPC.x, clothingNPC.y);

    if (distanciaFerreiro < 75) {
        abrirLojaArmas(scene);
        return;
    }
    if (distanciaBanco < 75) {
        abrirBancoModal(scene);
        return;
    }
    if (distanciaRoupas < 75) {
        abrirLojaRoupas(scene);
        return;
    }
}

// --- ADICIONAR ITEM AO INVENTÁRIO ---
function adicionarItemInventario(scene, newItem) {
    let existing = playerInventory.find(item => item.id === newItem.id);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        if (playerInventory.length >= 16) {
            adicionarMensagemChat('Sistema', '❌ Seu inventário está cheio (Máx 16 slots)!');
            return false;
        }
        newItem.qty = 1;
        playerInventory.push(newItem);
    }
    atualizarHudGold();
    salvarEstadoRemoto(); // Garante salvamento em qualquer alteração de inventário
    return true;
}

function atualizarBarraDeVida() {
    if (!healthBarFill) return;
    const barW = 160;
    
    let hpAtual = (playerHealth !== null && playerHealth !== undefined && !isNaN(playerHealth)) ? playerHealth : 100;
    
    const hpPercent = Math.max(0, Math.min(1, hpAtual / playerMaxHealth));
    const mpPercent = Math.max(0, Math.min(1, playerMana / playerMaxMana));
    
    healthBarFill.width = (barW - 2) * hpPercent;
    if (manaBarFill) manaBarFill.width = (barW - 2) * mpPercent;
    healthText.setText(`${hpAtual}/${playerMaxHealth}`);
}

function atualizarHudGold() {
    if (hudGoldText) {
        hudGoldText.setText(`💰 ${playerGold} GOLD`);
    }
    salvarEstadoRemoto();
}

function salvarEstadoRemoto() {
    return new Promise((resolve, reject) => {
        if (isSaving) return resolve({ success: false, reason: 'Already saving' });
        if (!isLoggedIn || isPlayerDead || !socket || !socket.connected || !player || !charId) {
            return resolve({ success: false, reason: 'Disconnected or Dead' });
        }

        isSaving = true;

        const payload = {
            id: charId,
            accountUser: currentUser,
            name: charName,
            x: Math.round(player.x),
            y: Math.round(player.y),
            hp: playerHealth,
            maxHp: playerMaxHealth,
            gold: playerGold,
            bank: playerBankGold,
            inventory: playerInventory,
            equippedWeapon: playerEquippedWeapon,
            equippedClothes: playerEquippedClothes,
            clanTag: playerClanTag
        };

        console.log(`[AUDITORIA SAVE] Enviando dados para o servidor... (Ouro: ${playerGold}, Itens: ${playerInventory.length})`);

        // Timeout de segurança para evitar promessas infinitas no mobile em caso de lag
        const timeout = setTimeout(() => {
            console.warn("[AUDITORIA SAVE] ⚠️ Timeout na resposta do servidor.");
            isSaving = false;
            resolve({ success: false, error: 'timeout' });
        }, 5000);

        socket.emit('saveProgress', payload, (response) => {
            clearTimeout(timeout);
            isSaving = false;
            if (response && response.success) {
                console.log(`[AUDITORIA SAVE] ✅ Servidor confirmou gravação no banco para ${charName}:`, response);
                resolve(response);
            } else {
                console.error(`[AUDITORIA SAVE] ❌ Servidor rejeitou o salvamento:`, response ? response.error : 'Sem resposta');
                resolve({ success: false, error: response ? response.error : 'unknown' });
            }
        });
    });
}

function atualizarSpriteArmaEquipada(scene) {
    if (equippedWeaponSprite) {
        equippedWeaponSprite.destroy();
        equippedWeaponSprite = null;
    }
    if (playerEquippedWeapon && scene) {
        let textureKey = playerEquippedWeapon.id;
        equippedWeaponSprite = scene.add.image(player.x, player.y, textureKey);
        equippedWeaponSprite.setDepth(player.y + 1); 
        equippedWeaponSprite.setDisplaySize(24, 24);
        if (minimap) minimap.ignore(equippedWeaponSprite);
    }
}

// --- SISTEMA DE ATAQUE ---
function atacarComEspada(scene) {
    if (isAttacking || isPlayerDead) return;
    if (!playerEquippedWeapon) {
        adicionarMensagemChat('Sistema', '⚠️ Você não tem nenhuma arma ou ferramenta equipada! Abra o inventário (M) ou compre no Ferreiro.');
        return;
    }

    isAttacking = true;

    if (equippedWeaponSprite) {
        let targetAngle = player.flipX ? -130 : 130;
        
        scene.tweens.add({
            targets: equippedWeaponSprite,
            angle: targetAngle,
            duration: 90,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                isAttacking = false;
            }
        });
    } else {
        scene.time.delayedCall(180, () => {
            isAttacking = false;
        });
    }

    // Checar Interação com Territórios e Porta
    Object.keys(territories).forEach(key => {
        let ter = territories[key];
        let dist = Phaser.Math.Distance.Between(player.x, player.y, ter.x, ter.y);
        
        if (key === 'castle') {
            // Ataque à porta
            let distPorta = Phaser.Math.Distance.Between(player.x, player.y, ter.x, ter.y + 110);
            if (distPorta < 60 && !ter.doorOpen && playerClanTag) {
                socket.emit('atacarPorta', { damage: 10 + (playerEquippedWeapon ? playerEquippedWeapon.atk : 0) });
            }
            // Dominação da bandeira (dentro)
            if (dist < 60 && ter.doorOpen && playerClanTag && ter.owner !== playerClanTag) {
                socket.emit('captureTerritory', { territoryKey: key, clanTag: playerClanTag, playerName: charName });
            }
        } else if (dist < 100) {
            if (playerClanTag && ter.owner !== playerClanTag) {
                socket.emit('captureTerritory', { territoryKey: key, clanTag: playerClanTag, playerName: charName });
            }
        }
    });

    // Atingir Ogros com espada
    ogres.children.iterate(ogre => {
        if (ogre && ogre.active) {
            let dist = Phaser.Math.Distance.Between(player.x, player.y, ogre.x, ogre.y);
            if (dist < 55) {
                let damage = 5 + (playerEquippedWeapon ? playerEquippedWeapon.atk : 0);
                let hp = (ogre.getData('hp') || 50) - damage;
                ogre.setData('hp', hp);
                animarDanoImpacto(scene, ogre);
                if (hp <= 0) {
                    criarItemNoChao(scene, ogre.x, ogre.y, {
                        id: 'coin_icon',
                        name: 'Saco de Moedas (Ogro)',
                        price: 50,
                        type: 'gold',
                        value: 50,
                        atk: 0
                    });
                    ogre.destroy();
                }
            }
        }
    });

    // Dano Corpo a Corpo em Jogadores (PvP)
    otherPlayersGroup.children.iterate(otherPlayer => {
        if (otherPlayer && otherPlayer.active) {
            let dist = Phaser.Math.Distance.Between(player.x, player.y, otherPlayer.x, otherPlayer.y);
            if (dist < 60) {
                let targetData = otherPlayer.getData('playerData');
                if (targetData && socket && socket.connected) {
                    if (playerClanTag && targetData.clanTag === playerClanTag) return;

                    socket.emit('atacarJogador', {
                        targetId: targetData.id,
                        damage: 5 + (playerEquippedWeapon ? playerEquippedWeapon.atk : 0)
                    });
                    animarDanoImpacto(scene, otherPlayer);
                }
            }
        }
    });

    // Verificar se atingiu Árvore nos objetos do editor (monsterObstacles)
    let allInteractiveObjects = [];
    monsterObstacles.children.iterate(obj => { if (obj && obj.active && obj.getData('tileKey') !== 'COLLISION_BOX') allInteractiveObjects.push(obj); });

    allInteractiveObjects.forEach(obj => {
        let key = obj.getData('tileKey');
        let dist = Phaser.Math.Distance.Between(player.x, player.y, obj.x + 16, obj.y + 16);
        if (dist < 60) {
            if (key && key.includes('TREE 1')) {
                let hp = obj.getData('hp') !== undefined ? obj.getData('hp') : 5;
                hp--;
                obj.setData('hp', hp);
                animarDanoImpacto(scene, obj);
                if (hp <= 0) {
                    criarItemNoChao(scene, obj.x + 16, obj.y + 16, {
                        id: 'apple_icon',
                        name: 'Maçã (Apple)',
                        price: 3,
                        type: 'material',
                        atk: 0
                    });
                    obj.setVisible(false);
                    obj.setActive(false);
                    if (obj.body) obj.body.enable = false;
                    
                    scene.time.delayedCall(120000, () => {
                        if (obj) {
                            obj.setVisible(true);
                            obj.setActive(true);
                            if (obj.body) obj.body.enable = true;
                            obj.setData('hp', 5);
                        }
                    });
                }
            }
        }
    });

    let distanciaNPC = Phaser.Math.Distance.Between(player.x, player.y, blacksmithNPC.x, blacksmithNPC.y);
    if (distanciaNPC < 60) {
        mostrarBalaoFala(scene, blacksmithNPC, 'Ai! Cuidado onde aponta essa arma!');
    }
}

function atirarFlecha(scene, pointer) {
    if (isAttacking || isPlayerDead) return;
    
    isAttacking = true;

    if (equippedWeaponSprite) {
        scene.tweens.add({
            targets: equippedWeaponSprite,
            scaleX: 0.8,
            scaleY: 1.4,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onComplete: () => {
                isAttacking = false;
            }
        });
    } else {
        scene.time.delayedCall(160, () => {
            isAttacking = false;
        });
    }

    let arrow = arrows.create(player.x, player.y, 'banner_bow');
    arrow.setDepth(player.y); 
    arrow.setDisplaySize(16, 8);
    
    let angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    arrow.setRotation(angle);
    scene.physics.velocityFromRotation(angle, 450, arrow.body.velocity);

    scene.time.delayedCall(1500, () => {
        if (arrow && arrow.active) {
            arrow.destroy();
        }
    });
}

function criarPainelChatNativo(scene) {
    const x = CHAT_CONFIG.x;
    const y = CHAT_CONFIG.y;
    const w = CHAT_CONFIG.width;
    const h = CHAT_CONFIG.height;

    chatBg = scene.add.rectangle(x + w/2, y + h/2, w, h, 0x0c0c14, 0.95)
        .setScrollFactor(0).setDepth(2500).setStrokeStyle(2, 0xf3e5ab);

    chatHeaderBg = scene.add.rectangle(x + w/2, y + 17, w - 4, 34, 0x1b1b2f)
        .setScrollFactor(0).setDepth(2501).setInteractive().setStrokeStyle(1, 0x967322);

    chatTitle = scene.add.text(x + 10, y + 8, '💬 Bate-Papo Avaris', {
        font: 'bold 12px monospace', fill: '#f3e5ab'
    }).setScrollFactor(0).setDepth(2502);

    const onlineDot = scene.add.circle(x + 156, y + 16, 4, 0x35d07f)
        .setScrollFactor(0).setDepth(2502);
    const onlineText = scene.add.text(x + 165, y + 9, 'ONLINE', {
        font: 'bold 9px monospace', fill: '#72e8a4'
    }).setScrollFactor(0).setDepth(2502);
    chatUnreadText = scene.add.text(x + w - 128, y + 9, '', {
        font: 'bold 9px monospace', fill: '#ffd36d'
    }).setScrollFactor(0).setDepth(2502);

    chatMinBtn = scene.add.text(x + w - 50, y + 8, ' - ', {
        font: 'bold 11px monospace', fill: '#00ffcc', backgroundColor: '#12121a', padding: { x: 3, y: 1 }
    }).setScrollFactor(0).setDepth(2502).setInteractive();

    chatCloseBtn = scene.add.text(x + w - 24, y + 8, ' X ', {
        font: 'bold 11px monospace', fill: '#ff5555', backgroundColor: '#12121a', padding: { x: 3, y: 1 }
    }).setScrollFactor(0).setDepth(2502).setInteractive();

    chatContentBg = scene.add.rectangle(x + w/2, y + 89, w - 16, 104, 0x050508, 0.95)
        .setScrollFactor(0).setDepth(2501).setStrokeStyle(1, 0x3d3d5c);

    chatMessagesText = scene.add.text(x + 14, y + 38, '', {
        font: '10px monospace', fill: '#ffffff', wordWrap: { width: w - 28 }, lineSpacing: 2
    }).setScrollFactor(0).setDepth(2502);

    const maskGraphics = scene.make.graphics();
    maskGraphics.setScrollFactor(0);
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(x + 8, y + 35, w - 16, 104);
    chatMask = maskGraphics.createGeometryMask();
    chatMessagesText.setMask(chatMask);

    const channelBg = scene.add.rectangle(x + w/2, y + 151, w - 16, 22, 0x111722)
        .setScrollFactor(0).setDepth(2501);
    chatChannelButtons = [];
    [ ['GERAL', x + 16], ['SISTEMA', x + 95], ['GRUPO', x + 175], ['COMERCIO', x + 255] ].forEach(([canal, pos]) => {
        const btn = scene.add.text(pos, y + 144, `[ ${canal} ]`, {
            font: 'bold 8px monospace', fill: canal === chatChannel ? '#f3e5ab' : '#7f899d', padding: { x: 3, y: 2 }
        }).setScrollFactor(0).setDepth(2503).setInteractive();
        btn.on('pointerdown', () => {
            chatChannel = canal;
            chatScrollOffset = Math.max(0, getChatMessagesForCurrentChannel().length - CHAT_CONFIG.visibleMessages);
            atualizarTextoChatNativo();
        });
        chatChannelButtons.push(btn);
    });

    chatInputBg = scene.add.rectangle(x + w/2, y + h - 16, w - 16, 24, 0x12121a)
        .setScrollFactor(0).setDepth(2501).setStrokeStyle(1, 0xf3e5ab).setInteractive();

    chatInputText = scene.add.text(x + 14, y + h - 24, '> (Pressione Enter para digitar...)', {
        font: '11px monospace', fill: '#a0a0c0'
    }).setScrollFactor(0).setDepth(2502);

    mobileInputEl = document.getElementById('mobile-chat-input');
    const mobileChatBtn = document.getElementById('mobile-chat-btn');

    const abrirInputMobile = () => {
        if (mobileInputEl) {
            if (!isChatOpen) toggleChat(scene);
            mobileInputEl.style.bottom = '0px';
            setTimeout(() => mobileInputEl.focus(), 100);
        }
    };

    chatInputBg.on('pointerdown', abrirInputMobile);
    if (mobileChatBtn) {
        mobileChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirInputMobile();
        });
        mobileChatBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            abrirInputMobile();
        });
    }

    if (mobileInputEl) {
        mobileInputEl.addEventListener('input', (e) => {
            currentTypingText = e.target.value;
            atualizarTextoChatNativo();
        });
        mobileInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                let msg = mobileInputEl.value.trim();
                if (msg !== '') {
                    processarMensagemChat(msg);
                }
                currentTypingText = '';
                mobileInputEl.value = '';
                mobileInputEl.style.bottom = '-100px';
                mobileInputEl.blur();
                
                // ROLAGEM AUTOMÁTICA PERMANENTE: Força a rolagem imediata após o envio no mobile
                const mensagensFiltradas = getChatMessagesForCurrentChannel();
                chatScrollOffset = Math.max(0, mensagensFiltradas.length - CHAT_CONFIG.visibleMessages);
                atualizarTextoChatNativo();
            }
        });
        // Garante que o input suma se o teclado fechar (clicando fora)
        mobileInputEl.addEventListener('blur', () => {
            setTimeout(() => { mobileInputEl.style.bottom = '-100px'; }, 200);
        });
    }

    chatElements = [chatBg, chatHeaderBg, chatTitle, onlineDot, onlineText, chatUnreadText, chatMinBtn, chatCloseBtn, chatContentBg, chatMessagesText, channelBg, ...chatChannelButtons, chatInputBg, chatInputText];

    // Ajuste de z-index para os elementos DOM do chat mobile
    if (mobileInputEl) mobileInputEl.style.zIndex = "20000";
    const mBtn = document.getElementById('mobile-chat-btn');
    if (mBtn) mBtn.style.zIndex = "19999";

    chatElements.forEach(el => el.setVisible(false));

    chatMinBtn.on('pointerdown', (pointer, localX, localY, event) => {
        if (event) event.stopPropagation();
        isChatMinimized = !isChatMinimized;
        if (isChatMinimized) {
            chatContentBg.setVisible(false);
            chatMessagesText.setVisible(false);
            chatInputBg.setVisible(false);
            chatInputText.setVisible(false);
            chatChannelButtons.forEach(btn => btn.setVisible(false));
            channelBg.setVisible(false);
            chatBg.setSize(w, 34);
            chatBg.setY(y + 17);
            chatMinBtn.setText(' + ');
        } else {
            chatContentBg.setVisible(true);
            chatMessagesText.setVisible(true);
            chatInputBg.setVisible(true);
            chatInputText.setVisible(true);
            chatChannelButtons.forEach(btn => btn.setVisible(true));
            channelBg.setVisible(true);
            chatBg.setSize(w, h);
            chatBg.setY(y + h/2);
            chatMinBtn.setText(' - ');
        }
    });

    chatCloseBtn.on('pointerdown', (pointer, localX, localY, event) => {
        if (event) event.stopPropagation();
        toggleChat(scene);
    });
}

function toggleChat(scene) {
    if (isPlayerDead) return;
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
        if (isMenuOpen) {
            isMenuOpen = false;
            menuElements.forEach(element => element.destroy());
            menuElements = [];
            setMinimapVisible(!isPlayerDead);
        }
        chatElements.forEach(el => el.setVisible(true));
        if (isChatMinimized) {
            chatContentBg.setVisible(false);
            chatMessagesText.setVisible(false);
            chatInputBg.setVisible(false);
            chatInputText.setVisible(false);
            chatChannelButtons.forEach(btn => btn.setVisible(false));
        }
        currentTypingText = "";
        chatUnreadMessages = 0;
        chatScrollOffset = Math.max(0, getChatMessagesForCurrentChannel().length - CHAT_CONFIG.visibleMessages);
        atualizarTextoChatNativo();
    } else {
        chatElements.forEach(el => el.setVisible(false));
    }
}

function getChatMessagesForCurrentChannel() {
    if (chatChannel === 'SISTEMA') {
        return chatHistory.filter(msg => msg.autor === 'Sistema' || msg.canal === 'SISTEMA');
    }
    if (chatChannel === 'GERAL') {
        return chatHistory.filter(msg => msg.autor !== 'Sistema' && msg.canal !== 'SISTEMA');
    }
    return chatHistory.filter(msg => msg.canal === chatChannel && msg.autor !== 'Sistema');
}

function atualizarSpriteRoupaEquipada(scene) {
    if (equippedClothesSprite) {
        equippedClothesSprite.destroy();
        equippedClothesSprite = null;
    }
    if (playerEquippedClothes && scene && player) {
        equippedClothesSprite = scene.add.image(player.x, player.y + 2, playerEquippedClothes.id)
            .setDisplaySize(42, 42).setDepth(player.y + 0.5).setAlpha(0.82);
        if (minimap) minimap.ignore(equippedClothesSprite);
    }
}

function adicionarMensagemChat(autor, texto, canal = 'GERAL') {
    const agora = new Date();
    const hora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    // BLOQUEIO DE ROLAGEM: Nao remover esta linha, essencial para o chat mobile
    if (mobileInputEl && mobileInputEl.parentElement) {
        mobileInputEl.parentElement.scrollTop = mobileInputEl.parentElement.scrollHeight;
    }

    // Evita spam de mensagens de sistema repetidas
    if (autor === 'Sistema' && chatHistory.length > 0) {
        const ultimaMsg = chatHistory[chatHistory.length - 1];
        if (ultimaMsg.autor === 'Sistema' && ultimaMsg.texto === texto) {
            return; // Ignora se for a mesma mensagem de sistema consecutiva
        }
    }

    chatHistory.push({ autor, texto, canal, hora });
    if (chatHistory.length > CHAT_CONFIG.maxMessages) {
        chatHistory.shift();
    }
    if (!isChatOpen) chatUnreadMessages++;
    
    // ROLAGEM AUTOMÁTICA PERMANENTE: Garante que o chat sempre mostre as mensagens mais recentes
    const mensagensFiltradas = getChatMessagesForCurrentChannel();
    chatScrollOffset = Math.max(0, mensagensFiltradas.length - CHAT_CONFIG.visibleMessages);
    
    // Forçar rolagem do elemento DOM para o final se existir
    if (mobileInputEl && mobileInputEl.parentElement) {
        mobileInputEl.parentElement.scrollTop = mobileInputEl.parentElement.scrollHeight;
    }
    
    atualizarTextoChatNativo();
}

function atualizarTextoChatNativo() {
    if (!chatMessagesText) return;
    let formattedString = "";
    const mensagensDoCanal = getChatMessagesForCurrentChannel();
    const maxOffset = Math.max(0, mensagensDoCanal.length - CHAT_CONFIG.visibleMessages);
    chatScrollOffset = Phaser.Math.Clamp(chatScrollOffset, 0, maxOffset);
    let visibleHistory = mensagensDoCanal.slice(chatScrollOffset, chatScrollOffset + CHAT_CONFIG.visibleMessages);
    visibleHistory.forEach(msg => {
        const hora = msg.hora || '--:--';
        const canal = msg.canal && msg.canal !== 'GERAL' && msg.autor !== 'Sistema' ? ` ${msg.canal}` : '';
        const autor = msg.autor === 'Sistema' ? '[SISTEMA]' : `[${msg.autor}]`;
        formattedString += `${hora} ${autor}${canal}: ${msg.texto}\n`;
    });
    chatMessagesText.setText(formattedString);
    chatChannelButtons.forEach(btn => btn.setFill(btn.text.includes(chatChannel) ? '#f3e5ab' : '#7f899d'));
    if (chatUnreadText) chatUnreadText.setText(chatUnreadMessages ? `NOVAS: ${chatUnreadMessages}` : '');

    if (!chatInputText) return;
    if (currentTypingText === "") {
        chatInputText.setText("> Digite sua mensagem...");
        chatInputText.setFill('#a0a0c0');
    } else {
        chatInputText.setText("> " + currentTypingText + "_");
        chatInputText.setFill('#ffffff');
    }
}

function abrirPainelAdmin(scene) {
    if (isPlayerDead) return;
    const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
    const isAdminHigh = adminLevel >= 8 || isMestre;
    if (adminLevel <= 0 && !isMestre) return;
    
    menuElements.forEach(el => el.destroy());
    menuElements = [];
    setMinimapVisible(false);

    const ADMIN_DEPTH = 99999;
    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setScrollFactor(0).setDepth(ADMIN_DEPTH).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(ADMIN_DEPTH + 1);
    
    const headerBg = scene.add.rectangle(400, 80, 580, 40, 0x1b1b2f).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setStrokeStyle(2, 0xff4444);
    const title = scene.add.text(400, 80, `🛡️ PAINEL ADMINISTRATIVO - ${adminRole.toUpperCase()}`, { 
        font: 'bold 18px monospace', fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 3);
    
    const minBtn = scene.add.text(635, 80, ' [_] ', { font: 'bold 12px monospace', fill: '#ffffff', backgroundColor: '#333' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 3).setInteractive();
    const closeBtn = scene.add.text(675, 80, ' [X] ', { font: 'bold 12px monospace', fill: '#ffffff', backgroundColor: '#811' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 3).setInteractive();

    const mainContent = scene.add.group();
    menuElements.push(bgOverlay, panel, headerBg, title, minBtn, closeBtn);

    const fecharPainel = () => {
        menuElements.forEach(el => el.destroy());
        mainContent.clear(true, true);
        menuElements = [];
        isAdminMinimized = false;
        setMinimapVisible(true);
    };

    closeBtn.on('pointerdown', fecharPainel);
    minBtn.on('pointerdown', () => {
        isAdminMinimized = !isAdminMinimized;
        panel.setVisible(!isAdminMinimized);
        bgOverlay.setAlpha(isAdminMinimized ? 0 : 0.9);
        mainContent.setVisible(!isAdminMinimized);
        headerBg.setY(isAdminMinimized ? 25 : 80);
        title.setY(isAdminMinimized ? 25 : 80);
        minBtn.setY(isAdminMinimized ? 25 : 80);
        closeBtn.setY(isAdminMinimized ? 25 : 80);
        minBtn.setText(isAdminMinimized ? ' [+] ' : ' [_] ');
    });

    const callApi = async (target, action, value) => {
        try {
            const res = await fetch(`${BASE_URL}/api/admin/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminUser: currentUser, 
                    targetIdentifier: target, 
                    action, 
                    value 
                })
            });
            
            if (!res.ok) {
                const data = await res.json();
                adicionarMensagemChat('Sistema', `❌ Erro: ${data.message || 'Falha na API'}`);
                return;
            }

            adicionarMensagemChat('Sistema', `✅ Sucesso: ${action} em ${target}`);
        } catch (e) { 
            console.error(e);
            adicionarMensagemChat('Sistema', '❌ Erro de conexão com o servidor.');
        }
    };

    const createAdminSection = (y, label) => {
        const txt = scene.add.text(400, y, label, { font: 'bold 14px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2);
        mainContent.add(txt);
        return txt;
    };

    const btnStyle = { font: 'bold 11px monospace', fill: '#fff', backgroundColor: '#1b1b3d', padding: { x: 12, y: 8 } };

    // Seção de Jogador
    createAdminSection(130, "--- GESTÃO DE JOGADORES ---");
    
    const btnGold = scene.add.text(250, 170, '💰 DAR GOLD CUSTOM', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
    mainContent.add(btnGold);
    btnGold.on('pointerdown', () => {
        const t = prompt("Nick do Personagem alvo:");
        const v = prompt("Quantidade de Gold:");
        if (t && v) callApi(t, 'setGold', parseInt(v));
    });

    const btnWeapon = scene.add.text(isAdminHigh ? 330 : 400, 170, '⚔️ DAR ARMA LENDÁRIA', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
    mainContent.add(btnWeapon);
    btnWeapon.on('pointerdown', () => {
        const t = prompt("Nick do Personagem alvo:", charName);
        if (t) callApi(t, 'addItem', 'weapon_10');
    });

    if (isMestre) {
        const btnPass = scene.add.text(470, 170, '🔑 MUDAR SENHA', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
        mainContent.add(btnPass);
        btnPass.on('pointerdown', () => {
            const t = prompt("Usuário:");
            const p = prompt("Nova senha:");
            if (t && p) callApi(t, 'setPass', p);
        });
    }

    // Seção de Utilidades
    createAdminSection(230, "--- UTILITÁRIOS ---");

    const btnTp = scene.add.text(300, 270, '🚀 TELEPORTAR PARA X/Y', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
    mainContent.add(btnTp);
    btnTp.on('pointerdown', () => {
        const x = prompt("Coordenada X:");
        const y = prompt("Coordenada Y:");
        if (x && y) { player.setPosition(parseInt(x), parseInt(y)); player.body.reset(player.x, player.y); }
    });

    const btnGhost = scene.add.text(500, 270, isNoclipActive ? '👁️ FICAR VISÍVEL' : '👻 FICAR INVISÍVEL', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
    mainContent.add(btnGhost);
    btnGhost.on('pointerdown', () => {
        isNoclipActive = !isNoclipActive;
        player.setAlpha(isNoclipActive ? 0.3 : 1);
        player.body.checkCollision.none = isNoclipActive;
        btnGhost.setText(isNoclipActive ? '👁️ FICAR VISÍVEL' : '👻 FICAR INVISÍVEL');
    });

    // Seção de Equipe (Nível 8+)
    if (adminLevel >= 8 || isMestre) {
        createAdminSection(340, "--- FERRAMENTAS DE DESENVOLVEDOR ---");
        
        const btnEditor = scene.add.text(400, 380, editMode ? '❌ DESATIVAR EDITOR' : '⚒️ ATIVAR EDITOR DE OBJETOS', { ...btnStyle, backgroundColor: editMode ? '#881111' : '#1b3d1b' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
        btnEditor.on('pointerdown', () => {
            editMode = !editMode;
            if (editMode) editMinimized = false;
            infoText.setVisible(editMode);
            activeScene.btnMinEdit.setVisible(editMode);
            activeScene.atualizarVisibilidadeColisoes();
            if (!editMode && selectedObj) {
                if (selectedObj.clearTint) selectedObj.clearTint();
                selectedObj = null;
            }
            fecharPainel();
            adicionarMensagemChat('Sistema', editMode ? 'Editor de objetos habilitado.' : 'Editor de objetos desabilitado.');
        });
        mainContent.add(btnEditor);

        const btnTeam = scene.add.text(400, 435, '🛡️ DEFINIR CARGO ADM', { ...btnStyle, backgroundColor: '#444' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
        btnTeam.on('pointerdown', () => {
            const t = prompt("Usuário:");
            const lvl = prompt("Nível (1-8):");
            const role = prompt("Cargo (Moderador/Desenvolvedor/Dono):");
            if (t && lvl && role) callApi(t, 'setAdmin', { level: lvl, role });
        });
        mainContent.add(btnTeam);

        const btnListAdmins = scene.add.text(400, 475, '📋 LISTAR EQUIPE ADM', { ...btnStyle, backgroundColor: '#1b1b2f' }).setOrigin(0.5).setScrollFactor(0).setDepth(ADMIN_DEPTH + 2).setInteractive();
        btnListAdmins.on('pointerdown', async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/admin/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminUser: currentUser, action: 'listAdmins', targetIdentifier: 'self' })
                });
                const data = await res.json();
                if (data.success && data.admins) {
                    let lista = "--- EQUIPE ADMINISTRATIVA ---\n\n";
                    data.admins.forEach(adm => {
                        lista += `• ${adm.user} (ID: ${adm.fixedId || 'N/A'}) \n  Cargo: ${adm.adminRole} [Lvl ${adm.adminLevel}]\n\n`;
                    });
                    alert(lista);
                } else {
                    alert("Erro: " + (data.message || "Não foi possível carregar a lista."));
                }
            } catch (e) { 
                console.error(e);
                alert("Erro de conexão ao buscar lista."); 
            }
        });
        mainContent.add(btnListAdmins);
    }
}

function processarMensagemChat(texto) {
    if (!texto) return;
    const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
    const isAdmin = adminLevel >= 1;

    const callAdminAPI = async (target, action, value) => {
        try {
            await fetch(`${BASE_URL}/api/admin/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUser: currentUser, targetIdentifier: target, action, value })
            });
        } catch (e) { console.error(e); }
    };

    if (texto.startsWith('/dar_dinheiro') && (adminLevel >= 8 || isMestre)) {
        const parts = texto.split(' ');
        if (parts.length >= 3) callAdminAPI(parts[1], 'setGold', parts[2]);
    } else if (texto.startsWith('/dar_item') && (adminLevel >= 8 || isMestre)) {
        const parts = texto.split(' ');
        if (parts.length >= 3) callAdminAPI(parts[1], 'addItem', parts[2]);
    } else if (texto.startsWith('/setar_senha') && isMestre) {
        const parts = texto.split(' ');
        if (parts.length >= 3) callAdminAPI(parts[1], 'setPass', parts[2]);
    } else if (texto.toLowerCase() === '/admin') {
        if (isMestre || isAdmin) {
            adicionarMensagemChat('Sistema', '🛡️ Modo Administrativo ativado!');
            if (activeScene.btnAdminToggle) {
                activeScene.btnAdminToggle.setVisible(true);
            }
            if (!player.adminTag) {
                player.adminTag = activeScene.add.text(player.x, player.y + 40, isAdmin ? "ADMIN" : "MESTRE", {
                    font: 'bold 9px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 2
                }).setOrigin(0.5).setDepth(player.depth + 1);
                if (minimap) minimap.ignore(player.adminTag);
            }
        } else {
            adicionarMensagemChat('Sistema', '❌ Você não tem permissão para usar este comando.');
        }
    } else {
        enviarMensagemChatOnline(texto, chatChannel);
    }
}

function conectarChatOnline() {
    if (typeof CHAT_NETWORK === 'undefined' || !CHAT_NETWORK.enabled) return;
    
    // Garante que a conexão única seja estabelecida
    conectarMultiplayerOnline();

    socket.on('connect', () => {
        console.log("Conectado ao servidor multiplayer!");
    });

    socket.on('forceDisconnect', (data) => {
        alert(data.message || "Sua conta foi conectada em outro local.");
        window.location.reload();
    });

    if (isLoggedIn && charName) {
        socket.emit('joinGame', {
            x: player.x,
            y: player.y,
            name: charName,
            accountUser: currentUser,
            bodyColor: charBodyColor,
            facing: playerFacing,
            anim: player.anims.currentAnim ? player.anims.currentAnim.key : 'idle_down',
            adminRole: adminRole,
            adminLevel: adminLevel,
            clanTag: playerClanTag
        });

        // Configura salvamento automático robusto a cada 30 segundos (layer de proteção extra)
        if (activeScene.saveInterval) clearInterval(activeScene.saveInterval);
        activeScene.saveInterval = setInterval(async () => {
            await salvarEstadoRemoto();
        }, 30000);
    }

    socket.on('chatMessage', (data) => {
        // 1. Adicionar ao histórico de chat (caixa lateral)
        adicionarMensagemChat(data.playerName, data.message, data.channel);
        
        // 2. Localizar o sprite correto para o balão
        let targetSprite = null;
        if (data.senderId === socket.id) {
            targetSprite = player;
        } else if (otherPlayersSprites[data.senderId]) {
            targetSprite = otherPlayersSprites[data.senderId];
        }
        
        // 3. Exibir balão de fala se o sprite for encontrado
        if (targetSprite && activeScene) {
            mostrarBalaoFala(activeScene, targetSprite, data.message);
        }
    });

    socket.on('currentPlayers', (remotePlayers) => {
        Object.keys(remotePlayers).forEach((id) => {
            if (id !== socket.id && !otherPlayersSprites[id]) {
                adicionarOutroJogador(activeScene, remotePlayers[id]);
            }
        });
    });

    socket.on('newPlayer', (playerInfo) => {
        console.log("📢 Novo jogador detectado:", playerInfo.name);
        if (playerInfo.id !== socket.id && !otherPlayersSprites[playerInfo.id]) {
            adicionarOutroJogador(activeScene, playerInfo);
        }
    });

    // Sincronização inicial e total de objetos do mapa
    socket.on('syncMapObjects', (objects) => {
        if (!objects || !Array.isArray(objects)) return;
        if (activeScene && monsterObstacles) {
            console.log(`[REDE] Recebidos ${objects.length} objetos do mapa. Recriando...`);

            // Garante aplicação da skin customizada no player local se houver
            if (player && player.customSpriteData) {
                const texKey = 'custom_sheet_' + charName;
                if (!activeScene.textures.exists(texKey)) {
                    activeScene.textures.addBase64(texKey, player.customSpriteData);
                }
                // Garante que a textura seja usada apenas como skin, não como objeto de mapa
                player.setTexture(texKey);
                player.setFrame(0);
                player.clearTint();
            }

            monsterObstacles.clear(true, true);
            objects.forEach(d => {
                if (d && d.id) {
                    adicionarObjeto(activeScene, d.x, d.y, d.key, d.angle || 0, d.scaleX || 1, d.scaleY || 1, false, d.id, d.bodyEnable);
                }
            });
            activeScene.atualizarVisibilidadeColisoes();
        }
    });

    socket.on('syncTerritories', (data) => {
        territories = data;
        const ter = territories['castle'];
        if (ter && castle.door) {
            castle.door.setVisible(!ter.doorOpen);
            if (castle.door.body) castle.door.body.enable = !ter.doorOpen;
            castle.doorHpText.setText(`PORTA: ${ter.doorHp}/${ter.doorMaxHp}`);
            castle.doorHpText.setVisible(!ter.doorOpen);
            
            if (ter.owner) {
                castle.flag.setFillStyle(0x4488ff);
                castle.flagText.setText(ter.owner);
            }
        }
    });

    socket.on('skinUpdated', (data) => {
        console.log(`[REDE-SKIN] 🎭 Recebendo nova skin para jogador remoto: ${data.playerId}`);
        const remoteSprite = otherPlayersSprites[data.playerId];
        if (!remoteSprite || !data.skinData) return;

        const texKey = 'skin_' + data.playerId;
        activeScene.textures.addBase64(texKey, data.skinData);
        
        activeScene.textures.once('addtexture', (key) => {
            if (key === texKey && remoteSprite.active) {
                console.log(`[REDE-SKIN] ✅ Substituindo base padrão do jogador ${data.playerId}`);
                remoteSprite.setTexture(texKey);
                remoteSprite.setFrame(0);
                remoteSprite.clearTint();
            }
        });
    });

    socket.on('receberConviteClan', (data) => {
        if (confirm(`🏰 CONVITE DE CLÃ\n\nO jogador ${data.leaderName} convidou você para o clã [${data.clanTag}].\n\nDeseja aceitar?`)) {
            socket.emit('aceitarConviteClan', { clanTag: data.clanTag });
        }
    });


    socket.on('clanAtualizado', (data) => {
        playerClanTag = (data.clanTag && data.clanTag !== "") ? data.clanTag : null;
        playerClanRole = data.clanRole || 'Membro';
        playerClanMembers = data.members || [];

        if (player && player.playerNameText) {
            let displayName = (playerClanTag && playerClanTag !== "") ? `${charName} (${playerClanTag})` : charName;
            player.playerNameText.setText(displayName);
        }
        adicionarMensagemChat('Sistema', playerClanTag ? `Você agora faz parte do clã [${playerClanTag}]` : 'Você saiu do clã.');
        
        // Se o menu estiver aberto na aba de clãs, atualiza a interface
        if (isMenuOpen) {
            drawClansWindow(activeScene);
        }
    });

    // Receber novo objeto em tempo real
    socket.on('addMapObject', (d) => {
        if (activeScene) {
            adicionarObjeto(activeScene, d.x, d.y, d.key, d.angle || 0, d.scaleX || 1, d.scaleY || 1, false, d.id);
        }
    });

    // Atualizar objeto em tempo real
    socket.on('updateMapObject', (d) => {
        if (activeScene) {
            monsterObstacles.children.iterate(obj => {
                if (obj && obj.getData('id') === d.id) {
                    obj.setPosition(d.x, d.y);
                    obj.setAngle(d.angle || 0);
                    obj.setScale(d.scaleX || 1, d.scaleY || 1);
                    if (obj.body) obj.body.reset(d.x, d.y);
                    obj.setDepth(d.y);
                }
            });
        }
    });

    // Remover objeto em tempo real
    socket.on('removeMapObject', (objId) => {
        if (activeScene) {
            monsterObstacles.children.iterate(obj => {
                if (obj && obj.getData('id') === objId) {
                    obj.destroy();
                }
            });
        }
    });

    socket.on('playerMoved', (playerInfo) => {
        let remoteSprite = otherPlayersSprites[playerInfo.id];
        if (remoteSprite) {
            // Sincronização de skin ao mover (caso ainda não tenha carregado)
            if (playerInfo.customSpriteData) {
                const texKey = 'skin_' + playerInfo.id;
                if (!activeScene.textures.exists(texKey)) {
                    console.log(`[REDE] 📥 Carregando skin de movimento para: ${playerInfo.name}`);
                    const img = new Image();
                    img.onload = () => {
                        if (activeScene.textures.exists(texKey)) activeScene.textures.remove(texKey);
                        activeScene.textures.addSpriteSheet(texKey, img, { frameWidth: 64, frameHeight: 64 });
                        remoteSprite.setTexture(texKey);
                        remoteSprite.clearTint();
                    };
                    img.src = playerInfo.customSpriteData;
                } else if (remoteSprite.texture.key !== texKey) {
                    remoteSprite.setTexture(texKey);
                    remoteSprite.clearTint();
                }
            }

            remoteSprite.setData('playerData', playerInfo);
            remoteSprite.setPosition(playerInfo.x, playerInfo.y);
            remoteSprite.setDepth(playerInfo.y);
            remoteSprite.setFlipX(playerInfo.facing === 'left');
            if (playerInfo.anim) remoteSprite.anims.play(playerInfo.anim, true);
            if (remoteSprite.playerNameText) {
                remoteSprite.playerNameText.setPosition(playerInfo.x, playerInfo.y + 28);
                remoteSprite.playerNameText.setDepth(playerInfo.y + 1);
            }
            if (remoteSprite.adminTag) {
                remoteSprite.adminTag.setPosition(playerInfo.x, playerInfo.y + 40);
                remoteSprite.adminTag.setDepth(playerInfo.y + 1);
            }
        }
    });

    socket.on('updateAdminStatus', (data) => {
        adminLevel = data.adminLevel;
        adminRole = data.adminRole;
        adicionarMensagemChat('Sistema', `🛡️ Suas permissões foram atualizadas: ${adminRole}`);
        
        const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
        if (activeScene.btnAdminToggle && (adminLevel > 0 || isMestre)) {
            activeScene.btnAdminToggle.setVisible(true);
        }

        if (!player.adminTag && (adminLevel > 0 || isMestre)) {
            player.adminTag = activeScene.add.text(player.x, player.y + 40, adminRole.toUpperCase(), {
                font: 'bold 9px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(player.depth + 1);
            if (minimap) minimap.ignore(player.adminTag);
        } else if (player.adminTag) {
            player.adminTag.setText(adminRole.toUpperCase());
        }
    });

    socket.on('atualizarHp', (novoHp) => {
        playerHealth = novoHp;
        atualizarBarraDeVida();
        if (playerHealth <= 0 && !isPlayerDead) {
            isPlayerDead = true;
            mostrarTelaMorte(activeScene);
        }
    });

    socket.on('atualizarGold', (novoGold) => {
        playerGold = novoGold;
        atualizarHudGold();
    });

    socket.on('jogadorMorreu', (data) => {
        if (!isPlayerDead) {
            isPlayerDead = true;
            playerHealth = 0;
            atualizarBarraDeVida();
            mostrarTelaMorte(activeScene);
        }
    });

    socket.on('teleportPlayer', (data) => {
        if (player) {
            player.setPosition(data.x, data.y);
            player.body.reset(data.x, data.y);
            adicionarMensagemChat('Sistema', '🌌 Você atravessou um portal!');
        }
    });

    socket.on('takeDamage', (data) => {
        animarDanoImpacto(activeScene, player);
        adicionarMensagemChat('Sistema', `⚠️ Você recebeu ${data.amount} de dano de ${data.attackerName}!`);
    });

    // Listener para o evento de salvamento forçado pelo servidor (garante consistência)
    socket.on('requestImmediateSave', () => {
        salvarEstadoRemoto();
    });

    socket.on('playerDisconnected', (id) => {
        if (otherPlayersSprites[id]) {
            if (otherPlayersSprites[id].playerNameText) {
                otherPlayersSprites[id].playerNameText.destroy();
            }
            if (otherPlayersSprites[id].adminTag) {
                otherPlayersSprites[id].adminTag.destroy();
            }
            if (otherPlayersSprites[id].chatBubble) {
                otherPlayersSprites[id].chatBubble.destroy();
            }
            otherPlayersSprites[id].destroy();
            delete otherPlayersSprites[id];
        }
    });
}

function adicionarOutroJogador(scene, data) {
    if (!scene || !data || !data.id || otherPlayersSprites[data.id]) return;
    
    let other = scene.physics.add.sprite(data.x, data.y, 'player_idle');
    other.setTint(data.bodyColor || 0xffffff);
    other.setScale(1.3);
    other.setDepth(data.y);
    other.setInteractive();
    other.setData('playerData', data);

    other.on('pointerdown', (pointer) => {
        if (pointer.rightButtonDown() || pointer.button === 2) {
            abrirMenuInteracaoJogador(scene, other.getData('playerData'));
        }
    });
    
    let displayName = data.name;
    other.playerNameText = scene.add.text(data.x, data.y + 28, displayName, {
        font: 'bold 12px monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(data.y + 1);

    // Renderiza Tag de Cargo para Jogadores Remotos
    if (data.adminLevel > 0 || (data.name && data.name.toLowerCase() === 'mestre')) {
        let roleName = data.adminRole || (data.name.toLowerCase() === 'mestre' ? 'MESTRE' : 'ADMIN');
        other.adminTag = scene.add.text(data.x, data.y + 40, roleName.toUpperCase(), {
            font: 'bold 9px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(data.y + 1);
        if (minimap) minimap.ignore(other.adminTag);
    }

    if (minimap) minimap.ignore([other, other.playerNameText]);
    
    otherPlayersSprites[data.id] = other;
    otherPlayersGroup.add(other);
}

function abrirMenuInteracaoJogador(scene, data) {
    const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
    const isAdmin = adminLevel >= 1;
    if (!isAdmin && !isMestre) return;

    menuElements.forEach(el => el.destroy());
    menuElements = [];
    setMinimapVisible(false);

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.4).setScrollFactor(0).setDepth(10000).setInteractive();
    const panel = scene.add.rectangle(400, 300, 200, 150, 0x1b1b2f).setScrollFactor(0).setDepth(10001).setStrokeStyle(2, 0x967322);
    const txt = scene.add.text(400, 250, `Ações: ${data.name}`, { font: 'bold 12px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002);
    
    const btnPerfil = scene.add.text(400, 290, '[ VER PERFIL ]', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#333', padding: { x: 10, y: 5 } }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    btnPerfil.on('pointerdown', () => {
        fecharModais();
        abrirPerfilJogadorRemoto(scene, data);
    });

    const btnFechar = scene.add.text(400, 340, '[ FECHAR ]', { font: 'bold 11px monospace', fill: '#ff5555' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    const fecharModais = () => { 
        bg.destroy(); panel.destroy(); txt.destroy(); btnPerfil.destroy(); btnFechar.destroy(); 
        if (!isMenuOpen) setMinimapVisible(true);
    };
    btnFechar.on('pointerdown', fecharModais);
    bg.on('pointerdown', fecharModais);

    menuElements.push(bg, panel, txt, btnPerfil, btnFechar);
}

function abrirPerfilJogadorRemoto(scene, data) {
    menuElements.forEach(el => el.destroy());
    menuElements = [];
    setMinimapVisible(false);

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setScrollFactor(0).setDepth(10000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(10001);
    
    const title = scene.add.text(400, 85, '👤 INSPEÇÃO DE JOGADOR', { font: 'bold 18px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002);
    const closeBtn = scene.add.text(660, 85, ' [X] ', { font: 'bold 12px monospace', fill: '#fff', backgroundColor: '#811' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    closeBtn.on('pointerdown', () => { 
        bg.destroy(); panel.destroy(); title.destroy(); closeBtn.destroy(); menuElements.forEach(e => e.destroy()); 
        if (!isMenuOpen) setMinimapVisible(true);
    });

    const info = scene.add.text(400, 200, 
        `NICK: ${data.name} | USER: ${data.accountUser}\n` +
        `ID: ${data.mongoId || data.fixedId || 'N/A'} | CARGO: ${data.adminRole || 'Player'}`, 
    { font: 'bold 12px monospace', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002);

    const targetID = data.name || data.accountUser;

    const callAdminAPI = async (target, action, value) => {
        console.log(`[ADMIN] Solicitando ${action} para ${target}...`);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUser: currentUser, targetIdentifier: target, action, value })
            });
            
            const result = await res.json();
            
            if (res.ok) {
                console.log(`[ADMIN] Sucesso:`, result);
                adicionarMensagemChat('Sistema', `✅ Ação ${action} em ${target} concluída!`, 'SISTEMA');
            } else {
                console.error(`[ADMIN] Erro retornado pela API:`, result);
                adicionarMensagemChat('Sistema', `❌ Erro na ação: ${result.message || 'Desconhecido'}`, 'SISTEMA');
            }
        } catch (e) { 
            console.error(`[ADMIN] Falha crítica de conexão:`, e);
            adicionarMensagemChat('Sistema', `❌ Erro de conexão com o servidor.`, 'SISTEMA');
        }
    };

    const btnStyle = { font: 'bold 10px monospace', fill: '#fff', backgroundColor: '#1b1b3d', padding: { x: 8, y: 6 } };

    // Botões de Ações Admin
    const btnGold = scene.add.text(280, 260, '💰 DAR GOLD', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    btnGold.on('pointerdown', () => {
        const v = prompt(`Quanto gold deseja dar para ${targetID}?`);
        if (v && !isNaN(v)) callAdminAPI(targetID, 'setGold', parseInt(v));
    });

    const btnWeapon = scene.add.text(400, 260, '⚔️ DAR ARMA', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    btnWeapon.on('pointerdown', () => {
        const lista = weaponsShopData.map((w, i) => `${i}: ${w.name} (${w.id})`).join('\n');
        const itemID = prompt(`Digite o ID da arma ou escolha o índice:\n${lista}`);
        if (itemID !== null) {
            const weapon = weaponsShopData[parseInt(itemID)] || weaponsShopData.find(w => w.id === itemID);
            if (weapon) {
                callAdminAPI(targetID, 'addItem', weapon.id);
            } else {
                alert("Arma não encontrada.");
            }
        }
    });

    const btnCloth = scene.add.text(520, 260, '👗 DAR ROUPA', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    btnCloth.on('pointerdown', () => {
        const lista = clothesShopData.map((c, i) => `${i}: ${c.name} (${c.id})`).join('\n');
        const itemID = prompt(`Digite o ID da roupa ou escolha o índice:\n${lista}`);
        if (itemID !== null) {
            const cloth = clothesShopData[parseInt(itemID)] || clothesShopData.find(c => c.id === itemID);
            if (cloth) {
                callAdminAPI(targetID, 'addItem', cloth.id);
            } else {
                alert("Roupa não encontrada.");
            }
        }
    });

    const isMestre = currentUser && currentUser.toLowerCase() === 'mestre';
    if (isMestre || adminLevel >= 8) {
        const btnPass = scene.add.text(400, 310, '🔑 TROCAR SENHA', { ...btnStyle, backgroundColor: '#800' }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
        btnPass.on('pointerdown', () => {
            const p = prompt(`Nova senha para o usuário ${targetID}:`);
            if (p) callAdminAPI(targetID, 'setPass', p);
        });
        menuElements.push(btnPass);
    }

    const btnCopiarID = scene.add.text(400, 380, '[ COPIAR USERNAME ]', { font: 'bold 11px monospace', fill: '#00ffcc', backgroundColor: '#1b1b3d', padding: { x: 10, y: 5 } }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setInteractive();
    btnCopiarID.on('pointerdown', () => {
        adicionarMensagemChat('Sistema', `📋 Usuário "${data.accountUser}" selecionado.`);
    });
    
    menuElements.push(btnGold, btnWeapon, btnCloth, btnCopiarID);

    menuElements.push(bg, panel, title, closeBtn, info, btnCopiarID);
}

function enviarMensagemChatOnline(texto, canal) {
    if (!CHAT_NETWORK.enabled || !socket || !socket.connected) return;
    // O servidor agora espera playerName para identificar no broadcast
    socket.emit('chatMessage', { 
        playerName: charName || currentUser || 'Jogador', 
        message: texto, 
        channel: canal || 'GERAL' 
    });
}

function mostrarBalaoFala(scene, target, texto) {
    if (target.chatBubble) {
        target.chatBubble.destroy();
        if (target.bubbleTimer) target.bubbleTimer.remove();
    }

    let container = scene.add.container(target.x, target.y - 55).setDepth(3000);
    
    let textObj = scene.add.text(0, 0, texto, {
        font: 'bold 11px monospace',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 180 }
    }).setOrigin(0.5, 0.5);

    let bounds = textObj.getBounds();
    let bg = scene.add.rectangle(0, 0, bounds.width + 16, bounds.height + 12, 0x000000, 0.7)
        .setStrokeStyle(2, 0xf3e5ab, 0.8)
        .setOrigin(0.5, 0.5);

    container.add([bg, textObj]);
    target.chatBubble = container;

    if (minimap) minimap.ignore(container);

    target.bubbleTimer = scene.time.delayedCall(4000, () => {
        if (container && container.active) {
            scene.tweens.add({
                targets: container,
                alpha: 0,
                y: container.y - 10,
                duration: 300,
                onComplete: () => container.destroy()
            });
        }
    });
}

function toggleGameMenu(scene) {
    if (isPlayerDead) return;
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
        if (editMode) { editMode = false; infoText.setVisible(false); }
        if (isChatOpen) toggleChat(scene);
        if (minimap) minimap.setVisible(false);
        if (btnZoomOut) btnZoomOut.setVisible(false);
        if (btnZoomIn) btnZoomIn.setVisible(false);
        if (minimapBorder) minimapBorder.setVisible(false);

        menuElements = [];

        const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(2000).setInteractive();

        const panel = scene.add.image(400, 300, 'menu_panel_bg')
            .setScrollFactor(0).setDepth(2001);
        
        const titleText = scene.add.text(400, 85, 'AVARIS 2.0 - PAINEL PRINCIPAL', {
            font: 'bold 18px monospace', fill: '#f3e5ab', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

        const closeBtn = scene.add.text(660, 85, ' [X] ', {
            font: 'bold 12px monospace', fill: '#ffffff', backgroundColor: '#881111', padding: { x: 5, y: 4 },
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

        closeBtn.on('pointerdown', () => toggleGameMenu(scene));

        let bonusAtk = playerEquippedWeapon ? playerEquippedWeapon.atk : 0;
        modalText = scene.add.text(400, 485, `Ouro: 💰 ${playerGold} | Banco: 🏦 ${playerBankGold} | HP: ${playerHealth}/${playerMaxHealth} | ATK: ${5 + bonusAtk}`, {
            font: '13px monospace', fill: '#00ffcc', backgroundColor: '#0c0c14cc', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

        menuElements.push(bgOverlay, panel, titleText, closeBtn, modalText);

        const sistemas = [
            { name: 'Inventário', icon: '🎒' },
            { name: 'Personalizar', icon: '🎨' },
            { name: 'Shop', icon: '💰' },
            { name: 'Banco', icon: '🏦' },
            { name: 'Casa', icon: '🏠' },
            { name: 'Configuração', icon: '⚙️' },
            { name: 'Perfil Conta', icon: '👤' },
            { name: 'Mensagens', icon: '✉️' },
            { name: 'Discord', icon: '💬' },
            { name: 'Amigos', icon: '👥' },
            { name: 'Missão', icon: '📜' },
            { name: 'Clã', icon: '🏰' }
        ];

        const itemWidth = 110;
        const itemHeight = 60;
        const gapX = 12;
        const gapY = 12;
        const cols = 4;
        const rows = Math.ceil(sistemas.length / cols);
        const totalWidth = (cols * itemWidth) + ((cols - 1) * gapX);
        const totalHeight = (rows * itemHeight) + ((rows - 1) * gapY);
        const startX = 400 - (totalWidth / 2) + (itemWidth / 2);
        const startY = 260 - (totalHeight / 2) + (itemHeight / 2);

        sistemas.forEach((sys, index) => {
            let col = index % cols;
            let row = Math.floor(index / cols);
            let posX = startX + (col * (itemWidth + gapX));
            let posY = startY + (row * (itemHeight + gapY));

            let itemBg = scene.add.rectangle(posX, posY, itemWidth, itemHeight, 0x151522)
                .setScrollFactor(0).setDepth(2002).setStrokeStyle(1, 0x967322).setInteractive();

            let iconLabel = scene.add.text(posX, posY - 10, sys.icon, { font: '20px sans-serif' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(2003);

            let nameLabel = scene.add.text(posX, posY + 12, sys.name, { font: '10px monospace', fill: '#f3e5ab' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(2003);

            itemBg.on('pointerover', () => { itemBg.setFillStyle(0x282845); itemBg.setStrokeStyle(2, 0xf3e5ab); });
            itemBg.on('pointerout', () => { itemBg.setFillStyle(0x151522); itemBg.setStrokeStyle(1, 0x967322); });

            itemBg.on('pointerdown', () => {
                if (sys.name === 'Inventário') {
                    abrirInventario(scene);
                } else if (sys.name === 'Personalizar') {
                    abrirPainelPersonalizacao(scene);
                } else if (sys.name === 'Shop') {
                    abrirLojaArmas(scene);
                } else if (sys.name === 'Banco') {
                    abrirBancoModal(scene);
                } else if (sys.name === 'Placares') {
                    drawRankingWindow(scene);
                } else if (sys.name === 'Configuração') {
                    abrirConfiguracoesHUD(scene);
                } else if (sys.name === 'Perfil Conta') {
                    abrirPerfilConta(scene);
                } else if (sys.name === 'Clã') {
                    drawClansWindow(scene);
                } else {
                    modalText.setText(`Sistema de ${sys.name} em desenvolvimento!`);
                }
            });

            menuElements.push(itemBg, iconLabel, nameLabel);
        });

    } else {
        setMinimapVisible(!isPlayerDead);

        menuElements.forEach(element => element.destroy());
        menuElements = [];
    }
}

// --- SISTEMA DO BANCO ---
function abrirBancoModal(scene) {
    if (isPlayerDead) return;
    if (!isMenuOpen) {
        isMenuOpen = true;
        if (editMode) { editMode = false; infoText.setVisible(false); }
        if (isChatOpen) toggleChat(scene);
        if (minimap) minimap.setVisible(false);
        if (btnZoomOut) btnZoomOut.setVisible(false);
        if (btnZoomIn) btnZoomIn.setVisible(false);
        if (minimapBorder) minimapBorder.setVisible(false);
    }

    menuElements.forEach(el => el.destroy());
    menuElements = [];

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
        .setScrollFactor(0).setDepth(2000).setInteractive();

    const panel = scene.add.image(400, 300, 'menu_panel_bg')
        .setScrollFactor(0).setDepth(2001);

    const title = scene.add.text(400, 85, 'BANCO CENTRAL DE AVARIS', {
        font: 'bold 18px monospace', fill: '#418be8', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', {
        font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 },
        stroke: '#967322', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

    backBtn.on('pointerdown', () => toggleGameMenu(scene));

    let bankInfoText = scene.add.text(400, 485, `💰 Ouro na Mão: ${playerGold} | 🏦 Saldo no Banco: ${playerBankGold}`, {
        font: '13px monospace', fill: '#00ffcc', backgroundColor: '#0c0c14cc', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    menuElements.push(bgOverlay, panel, title, backBtn, bankInfoText);

    const createBankButton = (yPos, text, color, callback) => {
        let btn = scene.add.text(400, yPos, text, {
            font: 'bold 14px monospace', fill: '#ffffff', backgroundColor: color, padding: { x: 20, y: 10 },
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

        btn.on('pointerover', () => btn.setScale(1.03));
        btn.on('pointerout', () => btn.setScale(1.0));
        btn.on('pointerdown', callback);
        menuElements.push(btn);
    };

    createBankButton(180, '📥 Depositar 50 de Ouro', '#123d12', async () => {
        if (playerGold >= 50) {
            playerGold -= 50;
            playerBankGold += 50;
            atualizarHudGold();
            await salvarEstadoRemoto();
            bankInfoText.setText(`💰 Ouro na Mão: ${playerGold} | 🏦 Saldo no Banco: ${playerBankGold}`);
        } else {
            bankInfoText.setText('❌ Ouro insuficiente na mão!');
        }
    });

    createBankButton(240, '📥 Depositar TODO o Ouro na Mão', '#1a5c1a', () => {
        if (playerGold > 0) {
            let qtd = playerGold;
            playerBankGold += qtd;
            playerGold = 0;
            atualizarHudGold();
            salvarEstadoRemoto();
            bankInfoText.setText(`💰 Depositado ${qtd} ouros! Mão: 0 | Banco: ${playerBankGold}`);
        } else {
            bankInfoText.setText('❌ Você não tem ouro na mão!');
        }
    });

    createBankButton(300, '📤 Sacar 50 de Ouro', '#3d1212', () => {
        if (playerBankGold >= 50) {
            playerBankGold -= 50;
            playerGold += 50;
            atualizarHudGold();
            salvarEstadoRemoto();
            bankInfoText.setText(`💰 Ouro na Mão: ${playerGold} | 🏦 Saldo no Banco: ${playerBankGold}`);
        } else {
            bankInfoText.setText('❌ Saldo insuficiente no banco!');
        }
    });

    createBankButton(360, '📤 Sacar TODO o Ouro do Banco', '#5c1a1a', () => {
        if (playerBankGold > 0) {
            let qtd = playerBankGold;
            playerGold += qtd;
            playerBankGold = 0;
            atualizarHudGold();
            salvarEstadoRemoto();
            bankInfoText.setText(`💰 Sacado ${qtd} ouros! Mão: ${playerGold} | Banco: 0`);
        } else {
            bankInfoText.setText('❌ O banco está vazio!');
        }
    });
}

function abrirLojaRoupas(scene) {
    if (isPlayerDead) return;
    isMenuOpen = true;
    menuElements.forEach(el => el.destroy());
    menuElements = [];
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.76).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    const title = scene.add.text(400, 92, 'LOJA DE ROUPAS', { font: 'bold 20px monospace', fill: '#f0a8df', stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    const back = scene.add.text(140, 85, ' < VOLTAR ', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 } })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    back.on('pointerdown', () => toggleGameMenu(scene));
    const info = scene.add.text(400, 490, `Ouro: ${playerGold} | As roupas equipadas aparecem sobre o personagem.`, { font: '12px monospace', fill: '#00ffcc' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    menuElements.push(bg, panel, title, back, info);
    clothesShopData.forEach((clothes, index) => {
        const y = 175 + index * 105;
        const card = scene.add.rectangle(400, y, 500, 82, 0x171d29, 1).setScrollFactor(0).setDepth(2002).setStrokeStyle(2, 0x8d3d78).setInteractive();
        const icon = scene.add.image(190, y, clothes.id).setDisplaySize(56, 56).setScrollFactor(0).setDepth(2003);
        const text = scene.add.text(235, y - 25, `${clothes.name}\nDEF +${clothes.defense} | ${clothes.price} ouro`, { font: 'bold 12px monospace', fill: '#f3e5ab', lineSpacing: 5 })
            .setScrollFactor(0).setDepth(2003);
        card.on('pointerdown', () => {
            if (playerGold < clothes.price) { info.setText('Ouro insuficiente.'); return; }
            if (playerInventory.length >= 16) { info.setText('Inventário cheio.'); return; }
            playerGold -= clothes.price;
            playerInventory.push({ ...clothes });
            atualizarHudGold();
            info.setText(`Comprou: ${clothes.name}. Abra o Inventário para equipar.`);
        });
        menuElements.push(card, icon, text);
    });
}

function abrirInventario(scene) {
    if (isPlayerDead) return;
    menuElements.forEach(el => el.destroy());
    menuElements = [];

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
        .setScrollFactor(0).setDepth(2000).setInteractive();

    const panel = scene.add.image(400, 300, 'menu_panel_bg')
        .setScrollFactor(0).setDepth(2001);

    const title = scene.add.text(400, 85, 'INVENTÁRIO E EQUIPAMENTO', {
        font: 'bold 18px monospace', fill: '#f3e5ab', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', {
        font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 },
        stroke: '#967322', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

    backBtn.on('pointerdown', () => toggleGameMenu(scene));

    let currentAtkTotal = 5 + (playerEquippedWeapon ? playerEquippedWeapon.atk : 0);
    let currentDefense = playerEquippedClothes ? playerEquippedClothes.defense : 0;
    const goldDisplay = scene.add.text(400, 485, `Ouro: 💰 ${playerGold} | ATK Total: ${currentAtkTotal} (Clique para equipar armas/ferramentas)`, {
        font: '12px monospace', fill: '#00ffcc', backgroundColor: '#0c0c14cc', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    menuElements.push(bgOverlay, panel, title, backBtn, goldDisplay);

    const slotSize = 60;
    const cols = 4;
    const rows = 4;
    const startX = 340 - ((cols * slotSize + (cols - 1) * 10) / 2) + slotSize / 2;
    const startY = 270 - ((rows * slotSize + (rows - 1) * 10) / 2) + slotSize / 2;

    for (let i = 0; i < 16; i++) {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let posX = startX + col * (slotSize + 10);
        let posY = startY + row * (slotSize + 10);

        let slotBg = scene.add.rectangle(posX, posY, slotSize, slotSize, 0x0c0c14)
            .setScrollFactor(0).setDepth(2002).setStrokeStyle(2, 0x3d3d5c);

        menuElements.push(slotBg);

        if (playerInventory[i]) {
            let itemData = playerInventory[i];
            let itemIcon = scene.add.image(posX, posY, itemData.id)
                .setScrollFactor(0).setDepth(2003).setDisplaySize(38, 38);

            let qtyText = scene.add.text(posX + 18, posY + 18, `${itemData.qty || 1}`, {
                font: '10px monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 2
            }).setOrigin(1).setScrollFactor(0).setDepth(2004);

            slotBg.setInteractive();
            slotBg.on('pointerover', () => {
                goldDisplay.setText(`Item: ${itemData.name} | Venda: ${itemData.price || 0}G | ATK/Util: +${itemData.atk || 0}`);
                slotBg.setStrokeStyle(2, 0xf3e5ab);
            });
            slotBg.on('pointerout', () => {
                goldDisplay.setText(`Ouro: 💰 ${playerGold} | ATK Total: ${currentAtkTotal}`);
                slotBg.setStrokeStyle(2, 0x3d3d5c);
            });

            slotBg.on('pointerdown', () => {
                if (itemData.type === 'material') {
                    goldDisplay.setText(`ℹ️ ${itemData.name} é um material. Vá até a Loja do Ferreiro para vendê-lo por ouro!`);
                    return;
                }
                if (itemData.type === 'clothing') {
                    const tempClothes = playerEquippedClothes;
                    playerEquippedClothes = itemData;
                    if (tempClothes) playerInventory[i] = tempClothes;
                    else playerInventory.splice(i, 1);
                    atualizarSpriteRoupaEquipada(scene);
                    abrirInventario(scene);
                    return;
                }
                let temp = playerEquippedWeapon;
                playerEquippedWeapon = itemData;
                if (temp) {
                    playerInventory[i] = temp;
                } else {
                    playerInventory.splice(i, 1);
                }
                atualizarSpriteArmaEquipada(scene);
                salvarEstadoRemoto();
                abrirInventario(scene);
            });

            menuElements.push(itemIcon, qtyText);
        }
    }

    const equipX = 590;
    const equipY = startY + 45;

    let equipBoxLabel = scene.add.text(equipX, equipY - 45, '⚔️ EQUIPADO', {
        font: 'bold 11px monospace', fill: '#f3e5ab'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    let equipSlotBg = scene.add.rectangle(equipX, equipY, slotSize + 10, slotSize + 10, 0x0c0c14)
        .setScrollFactor(0).setDepth(2002).setStrokeStyle(2, 0xf3e5ab);

    menuElements.push(equipBoxLabel, equipSlotBg);

    if (playerEquippedWeapon) {
        let eqIcon = scene.add.image(equipX, equipY, playerEquippedWeapon.id)
            .setScrollFactor(0).setDepth(2003).setDisplaySize(46, 46);

        let eqText = scene.add.text(equipX, equipY + 42, playerEquippedWeapon.name, {
            font: '10px monospace', fill: '#00ffcc', backgroundColor: '#0c0c14ee', padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2003);

        equipSlotBg.setInteractive();
        equipSlotBg.on('pointerover', () => {
            goldDisplay.setText(`Equipado: ${playerEquippedWeapon.name}`);
        });
        equipSlotBg.on('pointerout', () => {
            goldDisplay.setText(`Ouro: 💰 ${playerGold} | ATK Total: ${currentAtkTotal}`);
        });

        equipSlotBg.on('pointerdown', () => {
            if (playerInventory.length >= 16) {
                goldDisplay.setText('❌ Inventário cheio!');
                return;
            }
            playerInventory.push(playerEquippedWeapon);
            playerEquippedWeapon = null;
            atualizarSpriteArmaEquipada(scene);
            salvarEstadoRemoto();
            abrirInventario(scene);
        });

        menuElements.push(eqIcon, eqText);
    } else {
        let emptyLabel = scene.add.text(equipX, equipY, 'Vazio', {
            font: '10px monospace', fill: '#666688'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2003);
        menuElements.push(emptyLabel);
    }
}

// --- LOJA DO FERREIRO ---
function abrirLojaArmas(scene) {
    if (isPlayerDead) return;
    if (!isMenuOpen) {
        isMenuOpen = true;
        if (editMode) { editMode = false; infoText.setVisible(false); }
        if (isChatOpen) toggleChat(scene);
        if (minimap) minimap.setVisible(false);
        if (btnZoomOut) btnZoomOut.setVisible(false);
        if (btnZoomIn) btnZoomIn.setVisible(false);
        if (minimapBorder) minimapBorder.setVisible(false);
    }

    let shopMode = 'comprar';

    const renderShopUI = () => {
        menuElements.forEach(el => el.destroy());
        menuElements = [];

        const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(2000).setInteractive();

        const panel = scene.add.image(400, 300, 'menu_panel_bg')
            .setScrollFactor(0).setDepth(2001);

        const title = scene.add.text(400, 85, shopMode === 'comprar' ? 'LOJA DE FERREIRO (ARMAS E PÁ)' : 'VENDA DE ITENS E MATERIAIS', {
            font: 'bold 18px monospace', fill: '#f3e5ab', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

        const backBtn = scene.add.text(140, 85, ' < VOLTAR ', {
            font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 },
            stroke: '#967322', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

        backBtn.on('pointerdown', () => toggleGameMenu(scene));

        let tabText = shopMode === 'comprar' ? ' [ 💰 IR PARA VENDAS (Materiais/Madeira) ] ' : ' [ ⚔️ IR PARA COMPRA DE ARMAS/PÁ ] ';
        let tabBtn = scene.add.text(570, 85, tabText, {
            font: 'bold 10px monospace', fill: '#00ffcc', backgroundColor: '#1b1b2f', padding: { x: 6, y: 4 },
            stroke: '#967322', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

        tabBtn.on('pointerdown', () => {
            shopMode = (shopMode === 'comprar') ? 'vender' : 'comprar';
            renderShopUI();
        });

        modalText = scene.add.text(400, 485, shopMode === 'comprar' ? `Ouro: 💰 ${playerGold} | Compre equipamentos para combater ogros` : `Ouro: 💰 ${playerGold} | Venda seus materiais (Madeira, Maçãs)`, {
            font: '13px monospace', fill: '#00ffcc', backgroundColor: '#0c0c14cc', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

        menuElements.push(bgOverlay, panel, title, backBtn, tabBtn, modalText);

        if (shopMode === 'comprar') {
            const cardWidth = 275;
            const cardHeight = 48;
            const startX1 = 265; 
            const startX2 = 535; 
            const startY = 145;
            const gapY = 10;

            weaponsShopData.forEach((weapon, index) => {
                let col = Math.floor(index / 6);
                let row = index % 6;
                let posX = col === 0 ? startX1 : startX2;
                let posY = startY + row * (cardHeight + gapY);

                let itemBox = scene.add.rectangle(posX, posY, cardWidth, cardHeight, 0x12121a)
                    .setScrollFactor(0).setDepth(2002).setStrokeStyle(1, 0x3d3d5c).setInteractive();

                let icon = scene.add.image(posX - 110, posY, weapon.id)
                    .setScrollFactor(0).setDepth(2003).setDisplaySize(32, 32);

                let info = scene.add.text(posX - 85, posY, `${weapon.name}\n(${weapon.isShovel ? 'Ferramenta' : '+' + weapon.atk + ' ATK'})`, {
                    font: '11px monospace', fill: '#ffffff', lineSpacing: 2
                }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2003);

                let priceBtn = scene.add.text(posX + 85, posY, ` 💰 ${weapon.price} `, {
                    font: 'bold 11px monospace', fill: '#f3e5ab', backgroundColor: '#1b1b2f', padding: { x: 5, y: 4 },
                    stroke: '#967322', strokeThickness: 2
                }).setOrigin(0.5).setScrollFactor(0).setDepth(2003).setInteractive();

                itemBox.on('pointerover', () => { itemBox.setFillStyle(0x1f1f33); itemBox.setStrokeStyle(1, 0xf3e5ab); });
                itemBox.on('pointerout', () => { itemBox.setFillStyle(0x12121a); itemBox.setStrokeStyle(1, 0x3d3d5c); });

                const comprarItem = () => {
                    if (playerGold >= weapon.price) {
                        if (playerInventory.length >= 16) {
                            modalText.setText('❌ Inventário cheio!');
                            return;
                        }
                        playerGold -= weapon.price;
                        atualizarHudGold();
                        playerInventory.push({ ...weapon });
                        salvarEstadoRemoto();
                        modalText.setText(`✅ Você comprou: ${weapon.name}!`);
                    } else {
                        modalText.setText('❌ Ouro insuficiente na mão!');
                    }
                };

                priceBtn.on('pointerdown', (pointer, localX, localY, event) => {
                    if (event) event.stopPropagation();
                    comprarItem();
                });
                itemBox.on('pointerdown', comprarItem);

                menuElements.push(itemBox, icon, info, priceBtn);
            });
        } else {
            const cardWidth = 540;
            const cardHeight = 52;
            const startX = 400;
            const startY = 150;
            const gapY = 12;

            if (playerInventory.length === 0) {
                let vazioMsg = scene.add.text(400, 300, 'Seu inventário está vazio para venda!', {
                    font: '14px monospace', fill: '#a0a0c0'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);
                menuElements.push(vazioMsg);
            } else {
                playerInventory.forEach((invItem, index) => {
                    if (index >= 6) return;
                    let posY = startY + index * (cardHeight + gapY);

                    let itemBox = scene.add.rectangle(startX, posY, cardWidth, cardHeight, 0x12121a)
                        .setScrollFactor(0).setDepth(2002).setStrokeStyle(1, 0x3d3d5c).setInteractive();

                    let icon = scene.add.image(startX - 230, posY, invItem.id)
                        .setScrollFactor(0).setDepth(2003).setDisplaySize(36, 36);

                    let sellPrice = invItem.price || 2;
                    let info = scene.add.text(startX - 190, posY, `${invItem.name} (Qtd: ${invItem.qty || 1})\nValor unitário: 💰 ${sellPrice} Ouros`, {
                        font: '11px monospace', fill: '#ffffff', lineSpacing: 2
                    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2003);

                    let sellBtn = scene.add.text(startX + 180, posY, ` VENDER 1x (+${sellPrice}G) `, {
                        font: 'bold 11px monospace', fill: '#2ecc71', backgroundColor: '#123d12', padding: { x: 8, y: 6 },
                        stroke: '#000000', strokeThickness: 2
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(2003).setInteractive();

                    const venderItem = () => {
                        let precoVenda = invItem.price || 2;
                        playerGold += precoVenda;
                        atualizarHudGold();

                        if (invItem.qty && invItem.qty > 1) {
                            invItem.qty--;
                        } else {
                            playerInventory.splice(index, 1);
                        }
                        salvarEstadoRemoto();
                        modalText.setText(`✅ Vendeu 1x ${invItem.name} por ${precoVenda} ouros!`);
                        renderShopUI();
                    };

                    sellBtn.on('pointerdown', (pointer, localX, localY, event) => {
                        if (event) event.stopPropagation();
                        venderItem();
                    });

                    menuElements.push(itemBox, icon, info, sellBtn);
                });
            }
        }
    };

    renderShopUI();
}


function drawCastle(scene) {
    if (!scene || !obstacles) return;
    const cx = 2500;
    const cy = 500;
    
    // Criar Paredes (Obstáculos Sólidos)
    const wallColor = 0x444444;
    const walls = [
        { x: cx, y: cy - 110, w: 240, h: 20 }, // Topo
        { x: cx - 110, y: cy, w: 20, h: 220 }, // Esquerda
        { x: cx + 110, y: cy, w: 20, h: 220 }, // Direita
        { x: cx - 70, y: cy + 110, w: 100, h: 20 }, // Baixo Esq
        { x: cx + 70, y: cy + 110, w: 100, h: 20 }  // Baixo Dir
    ];

    walls.forEach(w => {
        let wall = scene.add.rectangle(w.x, w.y, w.w, w.h, wallColor).setDepth(w.y);
        scene.physics.add.existing(wall, true);
        if (obstacles) obstacles.add(wall);
    });

    // Porta Destrutível
    castle.door = scene.add.rectangle(cx, cy + 110, 60, 20, 0x5d4037).setDepth(cy + 111);
    scene.physics.add.existing(castle.door, true);
    castle.doorHpText = scene.add.text(cx, cy + 130, 'PORTA: 500/500', { font: 'bold 10px monospace', fill: '#ff4444' }).setOrigin(0.5);

    // Bandeira de Dominação Interna
    castle.flag = scene.add.rectangle(cx, cy - 20, 32, 24, 0xaaaaaa).setDepth(cy - 19);
    castle.flagText = scene.add.text(cx, cy - 20, 'LIVRE', { font: 'bold 10px Arial', fill: '#000' }).setOrigin(0.5).setDepth(cy - 18);
    
    if (minimap) minimap.ignore([castle.door, castle.doorHpText, castle.flag, castle.flagText]);
}

function drawRankingWindow(scene) {
    if (isPlayerDead) return;
    menuElements.forEach(el => el.destroy());
    menuElements = [];
    if (minimap) minimap.setVisible(false);
    if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(false));

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    const title = scene.add.text(400, 85, `🏆 RANKING: ${aba.toUpperCase()}`, { font: 'bold 18px monospace', fill: '#ffd700' }).setOrigin(0.5).setDepth(2002);
    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(2002).setInteractive();
    backBtn.on('pointerdown', () => {
        if (minimap) minimap.setVisible(true);
        if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(true));
        toggleGameMenu(scene);
    });

    // Abas
    const abas = ['Mortes', 'Spar'];
    abas.forEach((nome, i) => {
        let btn = scene.add.text(325 + (i * 150), 130, nome, { font: 'bold 12px monospace', fill: aba === nome ? '#ffd700' : '#fff' }).setOrigin(0.5).setDepth(2002).setInteractive();
        btn.on('pointerdown', () => abrirPlacares(scene, nome));
        menuElements.push(btn);
    });

    menuElements.push(bgOverlay, panel, title, backBtn);

    const txtAviso = scene.add.text(400, 250, 'Ranking em desenvolvimento...', { font: '14px monospace', fill: '#aaa' }).setOrigin(0.5).setDepth(2002);
    menuElements.push(txtAviso);
}

function drawClansWindow(scene) {
    if (isPlayerDead) return;

    // Se o jogador já tem clã, redireciona para o painel de gerenciamento
    if (playerClanTag) {
        abrirPainelMeuCla(scene);
        return;
    }

    menuElements.forEach(el => el.destroy());
    menuElements = [];
    if (minimap) minimap.setVisible(false);
    if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(false));

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    const title = scene.add.text(400, 85, '🏰 SISTEMA DE CLÃS', { font: 'bold 20px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    
    backBtn.on('pointerdown', () => toggleGameMenu(scene));

    const btns = [
        { n: 'CRIAR CLÃ (500G)', y: 180, c: '#1b3d1b' },
        { n: 'HISTÓRICO DE CLÃS', y: 240, c: '#1b1b3d' },
        { n: 'PLACARES', y: 300, c: '#3d3d1b' },
        { n: 'CONVITES PENDENTES', y: 360, c: '#1b3d3d' },
        { n: 'AJUDA', y: 420, c: '#3d1b1b' }
    ];

    btns.forEach(b => {
        let btn = scene.add.text(400, b.y, b.n, { font: 'bold 14px monospace', fill: '#fff', backgroundColor: b.c, padding: {x:20, y:10} })
            .setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
        
        btn.on('pointerdown', () => {
            if (b.n === 'CRIAR CLÃ (500G)') {
                if (playerGold >= 500) {
                    let tag = prompt("Digite a TAG do seu novo clã (Máx 4 letras):");
                    if (tag && tag.length <= 4) {
                        playerClanTag = tag.toUpperCase();
                        playerClanRole = 'Lider';
                        localStorage.setItem('playerClan', playerClanTag);
                        localStorage.setItem('playerClanRole', playerClanRole);
                        window.meuClaInfo = { tag: playerClanTag, membros: 1 };
                        playerGold -= 500;
                        atualizarHudGold();
                        socket.emit('criarCla', { clanTag: playerClanTag });
                    
                        // Atualiza o nome do jogador local imediatamente
                        if (player && player.playerNameText) {
                            player.playerNameText.setText(`${charName} (${playerClanTag})`);
                        }
                    
                        abrirPainelMeuCla(scene);
                    } else if (tag) alert("TAG inválida.");
                } else alert("❌ Ouro insuficiente.");
            } else if (b.n === 'PLACARES') {
            } else if (b.n === 'PLACARES') {
                abrirPlacares(scene);
            } else if (b.n === 'CONVITES PENDENTES') {
                if (window.convitesCla.length === 0) alert("Sem convites.");
                else if (confirm("Aceitar convite pendente?")) {
                    window.meuClaInfo = { tag: "ALI", membros: 2 };
                    window.convitesCla = [];
                    abrirPainelMeuCla(scene);
                }
            } else {
                alert("Em desenvolvimento...");
            }
        });
        menuElements.push(btn);
    });

    menuElements.push(bgOverlay, panel, title, backBtn);
}

function abrirPainelMeuCla(scene) {
    if (isPlayerDead) return;
    menuElements.forEach(el => el.destroy());
    menuElements = [];
    if (minimap) minimap.setVisible(false);
    if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(false));

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    
    const title = scene.add.text(400, 85, `🏰 CLÃ: [${playerClanTag}]`, { font: 'bold 18px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    
    const infoX = 150;
    const infoY = 150;
    
    let tempoS = clanDominationTimes[playerClanTag] || 0;
    const horasDom = scene.add.text(infoX, infoY, `⏳ Tempo Dominado: ${tempoS}s`, { font: '14px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(2002);
    const rankPos = scene.add.text(infoX, infoY + 30, '🏆 Posição no Rank: --', { font: '14px monospace', fill: '#ffd700' }).setScrollFactor(0).setDepth(2002);
    const membrosTitle = scene.add.text(infoX, infoY + 70, `👥 Lista de Membros: (${playerClanMembers.length || 1}/15)`, { font: 'bold 14px monospace', fill: '#f3e5ab' }).setScrollFactor(0).setDepth(2002);
    menuElements.push(membrosTitle);
    
    let memberY = infoY + 100;
    if (playerClanMembers.length === 0) {
        const mTxt = scene.add.text(infoX + 10, memberY, `• ${charName} [${playerClanRole}]`, { font: '12px monospace', fill: '#ffffff' }).setScrollFactor(0).setDepth(2002);
        menuElements.push(mTxt);
    } else {
        playerClanMembers.slice(0, 10).forEach(m => {
            const mTxt = scene.add.text(infoX + 10, memberY, `• ${m.name} [${m.role}]`, { font: '12px monospace', fill: m.role === 'Lider' ? '#ffd700' : '#ffffff' }).setScrollFactor(0).setDepth(2002);
            menuElements.push(mTxt);
            memberY += 20;
        });
    }

    const btnStyle = { font: 'bold 11px monospace', fill: '#fff', backgroundColor: '#1b1b3d', padding: { x: 12, y: 8 } };

    const btnConvidar = scene.add.text(200, 430, '➕ CONVIDAR', btnStyle).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    const btnRemover = scene.add.text(330, 430, '❌ REMOVER', { ...btnStyle, backgroundColor: '#3d1b1b' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

    // Validação de interface: exibe botões se o cargo for Líder ou leader
    const isLeaderUI = (playerClanRole === 'Líder' || playerClanRole === 'Lider' || playerClanRole === 'leader');
    if (!isLeaderUI) {
        btnConvidar.setVisible(false);
        btnRemover.setVisible(false);
    }

    btnConvidar.on('pointerdown', () => {
        let nome = prompt("Digite o nome do jogador para convidar:");
        if (nome) {
            socket.emit('convidarCla', { nomeAlvo: nome });
            adicionarMensagemChat('Sistema', `Convite de clã enviado para ${nome}.`);
        }
    });

    btnRemover.on('pointerdown', () => {
        let nome = prompt("Digite o nome do jogador para remover do clã:");
        if (nome && nome.trim() !== "") {
            socket.emit('removerMembroCla', { nomeAlvo: nome.trim() });
        }
    });

    const btnSair = scene.add.text(460, 430, '🚪 SAIR DO CLÃ', { ...btnStyle, backgroundColor: '#800000' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    btnSair.on('pointerdown', () => {
        if (confirm("Tem certeza que deseja sair do clã?")) {
            socket.emit('sairCla', async (response) => {
                if (response && response.success) {
                    playerClanTag = null;
                    playerClanRole = "Membro";
                    localStorage.removeItem('playerClan');
                    localStorage.removeItem('playerClanRole');
                    
                    if (player && player.playerNameText) {
                        player.playerNameText.setText(charName);
                    }
                    
                    adicionarMensagemChat('Sistema', 'Você saiu do clã com sucesso!');
                    
                    if (minimap) minimap.setVisible(true);
                    if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(true));
                    toggleGameMenu(scene);
                } else {
                    alert("Erro ao sair do clã: " + (response ? response.error : "Erro desconhecido"));
                }
            });
        }
    });

    const btnVoltar = scene.add.text(600, 430, '🏠 VOLTAR', { ...btnStyle, backgroundColor: '#333' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    btnVoltar.on('pointerdown', () => {
        if (minimap) minimap.setVisible(true);
        if (minimapUiElements) minimapUiElements.forEach(e => e.setVisible(true));
        toggleGameMenu(scene);
    });

    menuElements.push(bgOverlay, panel, title, horasDom, rankPos, btnConvidar, btnRemover, btnSair, btnVoltar);
}

function abrirPerfilConta(scene) {
    if (isPlayerDead) return;
    menuElements.forEach(el => el.destroy());
    menuElements = [];

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    
    const title = scene.add.text(400, 85, '👤 PERFIL DO AVENTUREIRO', { font: 'bold 18px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    backBtn.on('pointerdown', () => toggleGameMenu(scene));

    const avatarBox = scene.add.rectangle(230, 240, 140, 180, 0x12121a).setScrollFactor(0).setDepth(2002).setStrokeStyle(2, 0x967322);
    const avatarImg = scene.add.sprite(230, 230, 'player_idle', 0).setScale(4).setScrollFactor(0).setDepth(2003).setTint(charBodyColor);
    const charNameTxt = scene.add.text(230, 300, charName.toUpperCase(), { font: 'bold 14px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(2003);

    const infoX = 330;
    const infoY = 160;
    const labelStyle = { font: 'bold 11px monospace', fill: '#7f899d' };
    const valueStyle = { font: '13px monospace', fill: '#ffffff' };

    const createInfoRow = (y, label, value, icon) => {
        const lbl = scene.add.text(infoX, y, `${icon} ${label}:`, labelStyle).setScrollFactor(0).setDepth(2002);
        const val = scene.add.text(infoX + 130, y - 1, value, valueStyle).setScrollFactor(0).setDepth(2002);
        menuElements.push(lbl, val);
    };

    createInfoRow(infoY, "ID ÚNICO", charId || '#avares---', "🆔");
    createInfoRow(infoY + 35, "CARGO", adminRole.toUpperCase(), "🛡️");
    createInfoRow(infoY + 105, "LOGIN", currentUser || "Visitante", "👤");
    createInfoRow(infoY + 140, "STATUS", "Online", "🟢");
    createInfoRow(infoY + 175, "MORTES", playerDeaths.toString(), "💀");
    createInfoRow(infoY + 210, "E-MAIL", "Protegido", "📧");
    
    const divider = scene.add.rectangle(480, infoY + 240, 300, 1, 0x3d3d5c).setScrollFactor(0).setDepth(2002);

    const timePlayed = scene.add.text(infoX, infoY + 260, `⏳ TEMPO DE JORNADA: --h --m`, { font: 'bold 10px monospace', fill: '#00ffcc' }).setScrollFactor(0).setDepth(2002);

    menuElements.push(bgOverlay, panel, title, backBtn, avatarBox, avatarImg, charNameTxt, divider, timePlayed);
}

function abrirPainelPersonalizacao(scene) {
    if (isPlayerDead) return;
    const modal = document.getElementById('customizationModal');
    const closeBtn = document.getElementById('closeCustomization');
    const btnSelect = document.getElementById('btnSelectFile');
    const fileInput = document.getElementById('spriteFileInput');
    const previewImg = document.getElementById('skinPreviewImg');
    const placeholder = document.getElementById('previewPlaceholder');
    const gallery = document.getElementById('savedSkinsGallery');

    modal.style.display = 'block';

    const fechar = () => {
        modal.style.display = 'none';
        if (!isMenuOpen) setMinimapVisible(true);
    };

    const aplicarEFechar = (base64) => {
        console.log("[DEBUG] Tentando aplicar skin da galeria...");
        const texKey = 'customPlayerSkin';
        const img = new Image();
        img.onload = () => {
            if (scene.textures.exists(texKey)) scene.textures.remove(texKey);
            scene.textures.addSpriteSheet(texKey, img, { frameWidth: 64, frameHeight: 64 });
            player.setTexture(texKey);
            player.clearTint();
            player.customSpriteData = base64;
            console.log("[DEBUG] Skin da galeria aplicada: ", texKey);

            // Notifica o servidor sobre a mudança de skin para sincronizar com outros
            if (socket && socket.connected) {
                socket.emit('skinChanged', base64);
            }

            setTimeout(() => {
                if (player && scene.textures.exists(texKey)) {
                    console.log("[DEBUG] Forçando skin da galeria (Fallback 3s)...");
                    player.setTexture(texKey);
                }
            }, 3000);
        };
        img.onerror = () => console.error("Erro ao aplicar skin: Base64 corrompido.");
        img.src = base64;
        
        fetch(`${BASE_URL}/api/upload-sprite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser, customSpriteData: base64, part: 'BODY' })
        });

        previewImg.src = base64;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';

        setTimeout(fechar, 300);
        adicionarMensagemChat('Sistema', `✅ Skin aplicada com sucesso!`);
    };

    const carregarGaleria = async () => {
        gallery.innerHTML = '<p style="grid-column: span 4; font-size: 8px; color: #666; text-align: center;">Carregando salvos...</p>';
        try {
            const res = await fetch(`${BASE_URL}/api/list-sprites?user=${currentUser}`);
            const data = await res.json();
            gallery.innerHTML = '';
            if (data.success && data.sprites.length > 0) {
                data.sprites.forEach(base64 => {
                    const img = document.createElement('img');
                    img.src = base64;
                    img.style.cssText = 'width: 100%; height: 40px; border: 1px solid #222; cursor: pointer; object-fit: none; object-position: 0 0; image-rendering: pixelated;';
                    img.addEventListener('click', () => {
                        aplicarEFechar(base64);
                    });
                    gallery.appendChild(img);
                });
            } else {
                gallery.innerHTML = '<p style="grid-column: span 4; font-size: 8px; color: #444; text-align: center;">Nenhuma salva.</p>';
            }
        } catch (e) {
            gallery.innerHTML = '<p style="grid-column: span 4; font-size: 8px; color: #822;">Erro.</p>';
        }
    };

    carregarGaleria();
    closeBtn.onclick = fechar;
    btnSelect.onclick = () => fileInput.click();

    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = event => aplicarEFechar(event.target.result);
        reader.readAsDataURL(file);
    };
}

function abrirConfiguracoesHUD(scene) {
    menuElements.forEach(el => el.destroy());
    menuElements = [];

    const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setScrollFactor(0).setDepth(2000).setInteractive();
    const panel = scene.add.image(400, 300, 'menu_panel_bg').setScrollFactor(0).setDepth(2001);
    const title = scene.add.text(400, 85, 'CONFIGURAÇÕES DE INTERFACE', { font: 'bold 18px monospace', fill: '#f3e5ab' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);
    const backBtn = scene.add.text(140, 85, ' < VOLTAR ', { font: 'bold 11px monospace', fill: '#ffffff', backgroundColor: '#2a2a40', padding: { x: 6, y: 4 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    backBtn.on('pointerdown', () => toggleGameMenu(scene));

    const labelEscala = scene.add.text(400, 200, `TAMANHO DO HUD: ${Math.round(globalHudScale * 100)}%`, { font: 'bold 16px monospace', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    const btnMenos = scene.add.text(300, 260, ' [ - ] ', { font: 'bold 20px monospace', fill: '#ff5555', backgroundColor: '#1b1b2f', padding: { x: 15, y: 10 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();
    const btnMais = scene.add.text(500, 260, ' [ + ] ', { font: 'bold 20px monospace', fill: '#55ff55', backgroundColor: '#1b1b2f', padding: { x: 15, y: 10 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setInteractive();

    const atualizarDisplay = () => {
        labelEscala.setText(`TAMANHO DO HUD: ${Math.round(globalHudScale * 100)}%`);
        localStorage.setItem('avaris_hud_scale', globalHudScale);
        aplicarEscalaHUD();
    };

    btnMenos.on('pointerdown', () => {
        globalHudScale = Math.max(0.5, globalHudScale - 0.1);
        atualizarDisplay();
    });

    btnMais.on('pointerdown', () => {
        globalHudScale = Math.min(1.5, globalHudScale + 0.1);
        atualizarDisplay();
    });

    menuElements.push(bgOverlay, panel, title, backBtn, labelEscala, btnMenos, btnMais);
}

function atualizarTextoEditor() {
    const key = assetList[currentAssetIndex];
    const statusColisao = editCollisionOnly ? "SIM" : "NÃO";
    
    infoText.setText(
        `🛠️ EDITOR AVARIS\n` +
        `──────────────\n` +
        `📦 OBJ: ${key}\n` +
        `🔢 #${currentAssetIndex + 1}/${assetList.length}\n` +
        `🧱 COLISÃO: ${statusColisao}\n` +
        `🔍 ZOOM: ${minimapZoom.toFixed(2)}\n` +
        `──────────────\n` +
        `🖱️ ESQ: Criar | DIR: Del\n` +
        `⌨️ SETAS: Trocar item\n` +
        `⌨️ WASD: Escala | Q/E: Giro\n` +
        `⌨️ ESPAÇO: Clonar | X: Sem Colisão\n` +
        `⌨️ F1: Alternar`
    );
}


function update() {
    if (!gameStarted || !isLoggedIn || isCreatingCharacter) {
        if (player && player.body) player.setVelocity(0);
        return;
    }

    // Sincronização periódica de posição e status (Apenas movimento leve)
    if (isLoggedIn && gameStarted && socket && socket.connected && !isPlayerDead) {
        socket.emit('playerMovement', {
            id: socket.id,
            x: player.x,
            y: player.y,
            gold: playerGold,
            health: playerHealth,
            facing: playerFacing,
            anim: player.anims.currentAnim ? player.anims.currentAnim.key : 'idle_down',
            adminRole: adminRole,
            adminLevel: adminLevel,
            name: charName,
            bodyColor: charBodyColor,
            clanTag: playerClanTag,
            customSpriteData: player.customSpriteData
        });
    }

    atualizarMinimapaHUD();

    if (document.activeElement === mobileInputEl) {
        player.setVelocity(0);
        return;
    }

    const isMobileChatFocused = document.activeElement === mobileInputEl;

    if (isCreatingCharacter || editMode || isMenuOpen || isPlayerDead || isChatOpen || isMobileChatFocused || document.activeElement.tagName === 'INPUT' || document.activeElement.id === 'mobile-chat-input') {
        player.setVelocity(0);
        ogres.children.iterate(ogre => { if (ogre && ogre.active) ogre.setVelocity(0); });
        return;
    }

    player.setVelocity(0);
    let isMoving = false;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown || keys.A.isDown || mobileMoveLeft) { vx = -SPEED; player.setFlipX(true); isMoving = true; playerFacing = 'left'; }
    else if (cursors.right.isDown || keys.D.isDown || mobileMoveRight) { vx = SPEED; player.setFlipX(false); isMoving = true; playerFacing = 'right'; }

    if (cursors.up.isDown || keys.W.isDown || mobileMoveUp) { vy = -SPEED; isMoving = true; playerFacing = 'up'; }
    else if (cursors.down.isDown || keys.S.isDown || mobileMoveDown) { vy = SPEED; isMoving = true; playerFacing = 'down'; }

    player.setVelocity(vx, vy);


    let animToPlay = isMoving ? `walk_${playerFacing}` : `idle_${playerFacing}`;
    if (!player.anims.exists(animToPlay)) {
        animToPlay = isMoving ? 'walk' : 'idle'; 
    }
    player.anims.play(animToPlay, true);

    // Bloqueio de segurança e Estabilização de Textura (Evita camada dupla/overwrites)
    if (activeScene.textures.exists('customPlayerSkin')) {
        if (player.texture.key !== 'customPlayerSkin') {
            console.log("[SYSTEM] ⚠️ Correção em tempo real: Restaurando skin customizada.");
            player.setTexture('customPlayerSkin');
            player.clearTint(); // Garante que o tint do boneco padrão não afete a skin
        }
    }

    player.setDepth(player.y);
    if (equippedWeaponSprite) {
        equippedWeaponSprite.setDepth(player.y + 1);
    }

    ogres.children.iterate(ogre => {
        if (ogre && ogre.active) {
            ogre.setDepth(ogre.y); 
            let dist = Phaser.Math.Distance.Between(ogre.x, ogre.y, player.x, player.y);
            // Só persegue o jogador se ele estiver no centro (longe do spawn) e perto do monstro
            if (dist < 280 && player.x > 800 && player.y > 600) {
                this.physics.moveToObject(ogre, player, 65);
            } else {
                // Patrulha básica ou parado se estiver fora da zona central
                if (ogre.x < 1000 || ogre.x > 2200 || ogre.y < 800 || ogre.y > 1800) {
                    this.physics.moveTo(ogre, 1600, 1200, 40);
                } else {
                    ogre.setVelocity(0);
                }
            }
        }
    });

    if (player.chatBubble && player.chatBubble.active) {
        player.chatBubble.x = player.x;
        player.chatBubble.y = player.y - 55;
    }
    Object.values(otherPlayersSprites).forEach(sprite => {
        if (sprite.chatBubble && sprite.chatBubble.active) {
            sprite.chatBubble.x = sprite.x;
            sprite.chatBubble.y = sprite.y - 55;
        }
    });

    if (player.playerNameText) {
        let displayName = (playerClanTag && playerClanTag !== "") ? `${charName} (${playerClanTag})` : charName;
        if (player.playerNameText.text !== displayName) player.playerNameText.setText(displayName);
        player.playerNameText.setPosition(player.x, player.y + 28);
        player.playerNameText.setDepth(player.depth + 1);
    }

    if (player.adminTag) {
        player.adminTag.setPosition(player.x, player.y + 40);
        player.adminTag.setDepth(player.depth + 1);
    }

    if (equippedWeaponSprite && player) {
        let offsetX = player.flipX ? -16 : 16;
        equippedWeaponSprite.setPosition(player.x + offsetX, player.y + 2);
        equippedWeaponSprite.setFlipX(player.flipX);
        if (!isAttacking) {
            equippedWeaponSprite.setAngle(player.flipX ? -35 : 35);
        }
    }
    if (equippedClothesSprite && player) {
        equippedClothesSprite.setPosition(player.x, player.y + 2);
        equippedClothesSprite.setDepth(player.y + 0.5);
        equippedClothesSprite.setFlipX(player.flipX);
    }

}

function adicionarObjeto(scene, x, y, key, angle = 0, scaleX = 1, scaleY = 1, emitRede = true, id = null, bodyEnable = null) {
    if (!scene || !monsterObstacles) return null;
    const upperKey = key.toUpperCase();
    
    let obj = monsterObstacles.create(x, y, key);
    obj.setOrigin(0, 0);
    obj.setScale(scaleX, scaleY);
    obj.setAngle(angle);
    obj.setDepth(y);
    
    // Define colisão: se bodyEnable vier do servidor usa ele, senão usa padrão por key
    const shouldHaveCollision = bodyEnable !== null ? bodyEnable : (upperKey === 'COLLISION_BOX');
    
    if (upperKey === 'COLLISION_BOX') {
        obj.setAlpha(editMode ? 0.5 : 0);
    } else {
        obj.setAlpha(1);
    }

    if (obj.body) {
        obj.body.enable = shouldHaveCollision;
        obj.refreshBody();
    }

    obj.setInteractive();
    scene.input.setDraggable(obj);
    obj.setData('tileKey', key);
    obj.setData('id', id || (Date.now() + Math.random().toString(36).substr(2, 9)));

    if (key.includes('TREE 1')) {
        obj.setData('hp', 5);
    }
    
    return obj;
}

function criarMapaInicial(scene) {
    adicionarObjeto(scene, 300, 300, 'TREE 1 - DAY');
}

function salvarMapa() {
    const data = [];
    monsterObstacles.children.iterate(obj => {
        if (obj && obj.active) {
            data.push({
                x: obj.x, y: obj.y, key: obj.getData('tileKey'),
                angle: obj.angle, scaleX: obj.scaleX, scaleY: obj.scaleY
            });
        }
    });
    localStorage.setItem('meu_jogo_mapa', JSON.stringify(data));
}

function carregarMapaSalvo(scene) {
    try {
        const savedData = localStorage.getItem('meu_jogo_mapa');
        if (savedData) {
            monsterObstacles.clear(true, true);

            const data = JSON.parse(savedData);
            data.forEach(d => adicionarObjeto(scene, d.x, d.y, d.key, d.angle, d.scaleX, d.scaleY));
        } else {
            criarMapaInicial(scene);
        }
    } catch (e) {
        criarMapaInicial(scene);
    }
}
