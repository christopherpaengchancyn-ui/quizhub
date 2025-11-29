// --- Avatars List ---
const AVATARS = [
  // Image avatars
  'avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg', 'avatar4.jpg', 'avatar5.jpg',
  'avatar6.jpg', 'avatar7.jpg', 'avatar8.jpg', 'avatar9.jpg', 'avatar10.jpg',
  'avatar11.jpg', 'avatar12.jpg', 'avatar13.jpg', 'avatar14.jpg', 'avatar15.jpg',
  'avatar16.jpg', 'avatar17.jpg', 'avatar18.jpg', 'avatar19.jpg', 'avatar20.jpg',
  'avatar21.jpg',
  // Logo avatars
  'isulogo.jpg', 'ITlogo.jpg'
];

// Helper function to check if avatar is an image file
function isImageAvatar(avatar) {
  return avatar && (avatar.endsWith('.jpg') || avatar.endsWith('.png') || avatar.endsWith('.gif'));
}

// Helper function to render avatar (image or emoji)
function renderAvatar(avatar, size = 40) {
  if (isImageAvatar(avatar)) {
    return `<img src="${avatar}" alt="Avatar" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  }
  return `<span style="font-size:${size * 0.7}px;">${avatar || '😎'}</span>`;
}

// --- Sound System (Web Audio API) ---
const SoundSystem = {
  audioContext: null,
  settings: {
    soundEffects: true,
    backgroundMusic: true,
    volume: 0.5
  },
  bgMusicOscillator: null,
  bgMusicGain: null,

  init() {
    // Load settings from localStorage
    const saved = localStorage.getItem('quizhub_sound_settings');
    if (saved) {
      this.settings = JSON.parse(saved);
    }
    // Create audio context on first user interaction
    document.addEventListener('click', () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    }, { once: true });
  },

  saveSettings() {
    localStorage.setItem('quizhub_sound_settings', JSON.stringify(this.settings));
  },

  setSoundEffects(enabled) {
    this.settings.soundEffects = enabled;
    this.saveSettings();
  },

  setBackgroundMusic(enabled) {
    this.settings.backgroundMusic = enabled;
    this.saveSettings();
    if (!enabled) this.stopBgMusic();
  },

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.settings.soundEffects || !this.audioContext) return;
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume * this.settings.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch(e) { console.log('Sound error:', e); }
  },

  // Sound Effects
  correct() {
    if (!this.audioContext) return;
    this.playTone(523.25, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.2), 200); // G5
  },

  wrong() {
    if (!this.audioContext) return;
    this.playTone(200, 0.3, 'sawtooth', 0.2);
  },

  tick() {
    if (!this.audioContext) return;
    this.playTone(800, 0.05, 'sine', 0.1);
  },

  click() {
    if (!this.audioContext) return;
    this.playTone(600, 0.05, 'sine', 0.1);
  },

  gameStart() {
    if (!this.audioContext) return;
    this.playTone(392, 0.15); // G4
    setTimeout(() => this.playTone(523.25, 0.15), 150); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 300); // E5
    setTimeout(() => this.playTone(783.99, 0.3), 450); // G5
  },

  victory() {
    if (!this.audioContext) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15), i * 100);
    });
  },

  gameOver() {
    if (!this.audioContext) return;
    this.playTone(392, 0.3, 'sine', 0.2);
    setTimeout(() => this.playTone(349.23, 0.3, 'sine', 0.2), 300);
    setTimeout(() => this.playTone(329.63, 0.5, 'sine', 0.2), 600);
  },

  countdown(num) {
    if (!this.audioContext) return;
    if (num > 0) {
      this.playTone(440, 0.1, 'sine', 0.2);
    } else {
      this.playTone(880, 0.3, 'sine', 0.3);
    }
  },

  // Background Music (simple looping ambient)
  startBgMusic() {
    if (!this.settings.backgroundMusic || !this.audioContext || this.bgMusicOscillator) return;
    try {
      this.bgMusicGain = this.audioContext.createGain();
      this.bgMusicGain.connect(this.audioContext.destination);
      this.bgMusicGain.gain.value = 0.05 * this.settings.volume;

      // Create a simple ambient pad
      const playChord = () => {
        if (!this.settings.backgroundMusic || !this.bgMusicGain) return;
        const freqs = [130.81, 164.81, 196.00, 261.63]; // C chord
        freqs.forEach(freq => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.connect(gain);
          gain.connect(this.bgMusicGain);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 4);
          osc.start();
          osc.stop(this.audioContext.currentTime + 4);
        });
      };

      playChord();
      this.bgMusicInterval = setInterval(playChord, 4000);
    } catch(e) { console.log('BG Music error:', e); }
  },

  stopBgMusic() {
    if (this.bgMusicInterval) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
    if (this.bgMusicGain) {
      this.bgMusicGain.disconnect();
      this.bgMusicGain = null;
    }
  }
};

// Initialize sound system
SoundSystem.init();

// --- Render Avatar (handles emoji or logo images) ---
function renderAvatar(avatar, size = 50) {
  if (!avatar) avatar = '😎';
  if (avatar === 'isulogo') {
    return `<img src="isulogo.jpg" alt="ISU" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  } else if (avatar === 'itlogo') {
    return `<img src="ITlogo.jpg" alt="IT" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  } else if (avatar.endsWith('.jpg') || avatar.endsWith('.png') || avatar.endsWith('.gif')) {
    return `<img src="${avatar}" alt="Avatar" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  }
  return avatar;
}

// --- Accounts ---
function loadAccounts(){ return JSON.parse(localStorage.getItem('sn_accounts')||'{}'); }
function saveAccounts(a){ localStorage.setItem('sn_accounts',JSON.stringify(a)); }

function doRegister(name,email,pass,avatar){
  const accounts=loadAccounts();
  email=email.toLowerCase();
  if(accounts[email]){ alert('Account exists'); return false; }
  accounts[email]={
    name,
    pass,
    avatar: avatar || '😎',
    joinDate: new Date().toLocaleDateString(),
    stats: { gamesPlayed: 0, wins: 0, totalScore: 0, bestStreak: 0 }
  };
  saveAccounts(accounts);
  return true;
}

function doLogin(email,pass){
  const accounts=loadAccounts();
  email=email.toLowerCase();
  if(!accounts[email]||accounts[email].pass!==pass){ alert('Invalid credentials'); return false; }
  localStorage.setItem('sn_current',email); return true;
}

function getCurrentUser(){
  const cur=localStorage.getItem('sn_current'); const accounts=loadAccounts();
  if(cur && accounts[cur]) return accounts[cur].name;
  return null;
}

function getCurrentUserData(){
  const cur=localStorage.getItem('sn_current'); const accounts=loadAccounts();
  if(cur && accounts[cur]) return accounts[cur];
  return null;
}

function getCurrentAvatar(){
  const data = getCurrentUserData();
  return data ? data.avatar : '😎';
}

function updateUserStats(statsUpdate){
  const cur=localStorage.getItem('sn_current');
  const accounts=loadAccounts();
  if(cur && accounts[cur]){
    if(!accounts[cur].stats) accounts[cur].stats = { gamesPlayed: 0, wins: 0, totalScore: 0, bestStreak: 0 };
    const stats = accounts[cur].stats;
    // Increment values
    if(statsUpdate.gamesPlayed) stats.gamesPlayed = (stats.gamesPlayed || 0) + statsUpdate.gamesPlayed;
    if(statsUpdate.wins) stats.wins = (stats.wins || 0) + statsUpdate.wins;
    if(statsUpdate.totalScore) stats.totalScore = (stats.totalScore || 0) + statsUpdate.totalScore;
    // Keep best streak
    if(statsUpdate.bestStreak && statsUpdate.bestStreak > (stats.bestStreak || 0)) stats.bestStreak = statsUpdate.bestStreak;
    saveAccounts(accounts);
  }
}

function updateAvatar(avatar){
  const cur=localStorage.getItem('sn_current');
  const accounts=loadAccounts();
  if(cur && accounts[cur]){
    accounts[cur].avatar = avatar;
    saveAccounts(accounts);
  }
}

function updateUserName(newName){
  const cur=localStorage.getItem('sn_current');
  const accounts=loadAccounts();
  if(cur && accounts[cur]){
    if(!newName || newName.trim().length === 0) {
      alert('Name cannot be empty!');
      return false;
    }
    accounts[cur].name = newName.trim();
    saveAccounts(accounts);
    return true;
  }
  return false;
}

function updatePassword(currentPass, newPass, confirmPass){
  const cur=localStorage.getItem('sn_current');
  const accounts=loadAccounts();
  if(cur && accounts[cur]){
    if(accounts[cur].pass !== currentPass){
      alert('Current password is incorrect!');
      return false;
    }
    if(!newPass || newPass.length < 4){
      alert('New password must be at least 4 characters!');
      return false;
    }
    if(newPass !== confirmPass){
      alert('New passwords do not match!');
      return false;
    }
    accounts[cur].pass = newPass;
    saveAccounts(accounts);
    return true;
  }
  return false;
}

function requireLogin(){
  if(!localStorage.getItem('sn_current')){ alert('Please login first!'); window.location.href='index.html'; return false; }
  return true;
}

// --- Scoring System ---
const SCORING = {
  BASE_POINTS: 100,
  SPEED_BONUS_MAX: 100,      // Max bonus for super fast answer
  SPEED_THRESHOLD_FAST: 10,   // Seconds for fast bonus
  SPEED_THRESHOLD_SUPER: 5,   // Seconds for super fast bonus
  STREAK_BONUS: 25,           // Points per streak level
  SURVIVAL_BONUS: 50,         // Extra points in survival mode
};

function calculatePoints(timeRemaining, streak, gameMode){
  let points = SCORING.BASE_POINTS;

  // Speed bonus
  if(timeRemaining >= 25) points += SCORING.SPEED_BONUS_MAX; // Super fast (under 5 sec)
  else if(timeRemaining >= 20) points += 75; // Fast (under 10 sec)
  else if(timeRemaining >= 15) points += 50; // Quick (under 15 sec)
  else if(timeRemaining >= 10) points += 25; // Normal

  // Streak bonus
  points += (streak * SCORING.STREAK_BONUS);

  // Game mode bonus
  if(gameMode === 'survival') points += SCORING.SURVIVAL_BONUS;
  if(gameMode === 'speed') points += Math.floor(timeRemaining * 5); // Extra speed points

  return points;
}

// --- Categories Info ---
const CATEGORIES = {
  HTML_CSS: { name: "HTML & CSS", icon: "🌐", color: "#e34c26" },
  JavaScript: { name: "JavaScript", icon: "⚡", color: "#f7df1e" },
  Database_SQL: { name: "Database & SQL", icon: "🗄️", color: "#336791" },
  Mobile_Dev: { name: "Mobile Dev", icon: "📱", color: "#3ddc84" },
  Web_Dev: { name: "Web Development", icon: "🔧", color: "#61dafb" },
  UI_UX: { name: "UI/UX Design", icon: "🎨", color: "#ff69b4" },
  Networking: { name: "Networking", icon: "🔌", color: "#00d4aa" },
  Programming_Logic: { name: "Programming Logic", icon: "💻", color: "#9b59b6" }
};

// --- Game Modes ---
const GAME_MODES = {
  classic: { name: "Classic", icon: "🎮", desc: "Answer questions, earn points!" },
  survival: { name: "Survival", icon: "💀", desc: "One wrong answer = Game Over!" },
  speed: { name: "Speed Run", icon: "⚡", desc: "Fastest answers win!" }
};

// --- Quiz Data - BSIT WMAD Categories (50 questions each) ---
const QUESTIONS = {
  HTML_CSS: [
    {q:"What does HTML stand for?", a:"HyperText Markup Language", choices:["HyperText Markup Language","High Tech Modern Language","Home Tool Markup Language","Hyperlink Text Markup Language"]},
    {q:"Which HTML tag is used for the largest heading?", a:"<h1>", choices:["<h1>","<h6>","<head>","<heading>"]},
    {q:"What CSS property changes text color?", a:"color", choices:["color","text-color","font-color","text-style"]},
    {q:"Which CSS property is used for background color?", a:"background-color", choices:["background-color","bgcolor","color-background","back-color"]},
    {q:"What does CSS stand for?", a:"Cascading Style Sheets", choices:["Cascading Style Sheets","Computer Style Sheets","Creative Style System","Colorful Style Sheets"]},
    {q:"Which HTML tag creates a hyperlink?", a:"<a>", choices:["<a>","<link>","<href>","<url>"]},
    {q:"What CSS property controls text size?", a:"font-size", choices:["font-size","text-size","font-style","text-scale"]},
    {q:"Which HTML tag is used for images?", a:"<img>", choices:["<img>","<image>","<pic>","<photo>"]},
    {q:"What CSS display value hides an element?", a:"none", choices:["none","hidden","invisible","collapse"]},
    {q:"Which CSS property creates rounded corners?", a:"border-radius", choices:["border-radius","corner-radius","border-round","round-corner"]},
    {q:"What HTML tag creates a line break?", a:"<br>", choices:["<br>","<lb>","<break>","<newline>"]},
    {q:"Which CSS property adds space inside an element?", a:"padding", choices:["padding","margin","spacing","gap"]},
    {q:"What HTML tag creates an unordered list?", a:"<ul>", choices:["<ul>","<ol>","<li>","<list>"]},
    {q:"Which CSS property makes text bold?", a:"font-weight", choices:["font-weight","font-bold","text-weight","bold"]},
    {q:"What HTML attribute specifies image source?", a:"src", choices:["src","href","link","source"]},
    {q:"Which CSS property centers text?", a:"text-align", choices:["text-align","align-text","center","text-center"]},
    {q:"What HTML tag creates a paragraph?", a:"<p>", choices:["<p>","<para>","<text>","<paragraph>"]},
    {q:"Which CSS property sets element width?", a:"width", choices:["width","size","length","wide"]},
    {q:"What HTML tag is used for tables?", a:"<table>", choices:["<table>","<tbl>","<grid>","<tab>"]},
    {q:"Which CSS property controls element visibility?", a:"visibility", choices:["visibility","display","show","visible"]},
    {q:"What HTML tag creates a form?", a:"<form>", choices:["<form>","<input>","<submit>","<formdata>"]},
    {q:"Which CSS property adds shadow to text?", a:"text-shadow", choices:["text-shadow","font-shadow","shadow-text","text-effect"]},
    {q:"What HTML attribute makes a link open in new tab?", a:"target=\"_blank\"", choices:["target=\"_blank\"","new=\"true\"","window=\"new\"","open=\"new\""]},
    {q:"Which CSS position value is relative to viewport?", a:"fixed", choices:["fixed","absolute","relative","static"]},
    {q:"What HTML tag defines a section?", a:"<section>", choices:["<section>","<div>","<part>","<area>"]},
    {q:"Which CSS property changes cursor style?", a:"cursor", choices:["cursor","pointer","mouse","click"]},
    {q:"What HTML tag creates a button?", a:"<button>", choices:["<button>","<btn>","<input type='button'>","<click>"]},
    {q:"Which CSS property controls flex direction?", a:"flex-direction", choices:["flex-direction","flex-flow","direction","flex-orient"]},
    {q:"What HTML tag embeds video?", a:"<video>", choices:["<video>","<media>","<movie>","<vid>"]},
    {q:"Which CSS property adds box shadow?", a:"box-shadow", choices:["box-shadow","shadow","element-shadow","shadow-box"]},
    {q:"What HTML tag defines the document body?", a:"<body>", choices:["<body>","<main>","<content>","<document>"]},
    {q:"Which CSS property sets font family?", a:"font-family", choices:["font-family","font-name","font-type","font"]},
    {q:"What HTML tag creates a span?", a:"<span>", choices:["<span>","<inline>","<text>","<s>"]},
    {q:"Which CSS property controls element overflow?", a:"overflow", choices:["overflow","scroll","hide","clip"]},
    {q:"What HTML5 tag is for navigation?", a:"<nav>", choices:["<nav>","<navigation>","<menu>","<links>"]},
    {q:"Which CSS property sets line spacing?", a:"line-height", choices:["line-height","line-spacing","text-height","spacing"]},
    {q:"What HTML tag defines a footer?", a:"<footer>", choices:["<footer>","<bottom>","<end>","<foot>"]},
    {q:"Which CSS property creates transitions?", a:"transition", choices:["transition","animation","transform","effect"]},
    {q:"What HTML tag is for header content?", a:"<header>", choices:["<header>","<head>","<top>","<title>"]},
    {q:"Which CSS property rotates elements?", a:"transform", choices:["transform","rotate","turn","spin"]},
    {q:"What HTML attribute specifies input type?", a:"type", choices:["type","input","kind","form"]},
    {q:"Which CSS property sets z-index?", a:"z-index", choices:["z-index","layer","level","stack"]},
    {q:"What HTML tag creates a dropdown list?", a:"<select>", choices:["<select>","<dropdown>","<option>","<list>"]},
    {q:"Which CSS property controls opacity?", a:"opacity", choices:["opacity","transparency","alpha","visible"]},
    {q:"What HTML tag is for main content?", a:"<main>", choices:["<main>","<content>","<body>","<primary>"]},
    {q:"Which CSS unit is relative to font size?", a:"em", choices:["em","px","pt","%"]},
    {q:"What HTML tag creates an ordered list?", a:"<ol>", choices:["<ol>","<ul>","<list>","<numbered>"]},
    {q:"Which CSS property aligns flex items?", a:"align-items", choices:["align-items","vertical-align","flex-align","item-align"]},
    {q:"What HTML5 tag is for aside content?", a:"<aside>", choices:["<aside>","<sidebar>","<side>","<extra>"]},
    {q:"Which CSS property sets max width?", a:"max-width", choices:["max-width","width-max","limit-width","top-width"]}
  ],
  JavaScript: [
    {q:"Which keyword declares a variable in JavaScript?", a:"let", choices:["let","variable","var","int"]},
    {q:"What method adds an element to the end of an array?", a:"push()", choices:["push()","add()","append()","insert()"]},
    {q:"Which symbol is used for single-line comments?", a:"//", choices:["//","#","<!--","/*"]},
    {q:"What does DOM stand for?", a:"Document Object Model", choices:["Document Object Model","Data Object Management","Document Order Method","Digital Object Model"]},
    {q:"Which method selects an element by ID?", a:"getElementById()", choices:["getElementById()","selectById()","findById()","getElement()"]},
    {q:"What is the result of typeof null?", a:"object", choices:["object","null","undefined","string"]},
    {q:"Which array method removes the last element?", a:"pop()", choices:["pop()","remove()","delete()","shift()"]},
    {q:"What keyword creates a function?", a:"function", choices:["function","func","def","method"]},
    {q:"Which event fires when a button is clicked?", a:"onclick", choices:["onclick","onpress","onbutton","onaction"]},
    {q:"What method converts a string to an integer?", a:"parseInt()", choices:["parseInt()","toInt()","stringToInt()","convert()"]},
    {q:"What does NaN stand for?", a:"Not a Number", choices:["Not a Number","Null and None","No Actual Number","Negative Any Number"]},
    {q:"Which method finds array element index?", a:"indexOf()", choices:["indexOf()","findIndex()","search()","position()"]},
    {q:"What operator checks strict equality?", a:"===", choices:["===","==","=","!=="]},
    {q:"Which method joins array elements?", a:"join()", choices:["join()","concat()","merge()","combine()"]},
    {q:"What keyword stops a loop?", a:"break", choices:["break","stop","exit","end"]},
    {q:"Which method reverses an array?", a:"reverse()", choices:["reverse()","flip()","backward()","invert()"]},
    {q:"What is undefined in JavaScript?", a:"Variable declared but not assigned", choices:["Variable declared but not assigned","An error","Empty string","Zero"]},
    {q:"Which method sorts array elements?", a:"sort()", choices:["sort()","order()","arrange()","organize()"]},
    {q:"What does JSON.parse() do?", a:"Converts JSON string to object", choices:["Converts JSON string to object","Converts object to string","Validates JSON","Sends JSON"]},
    {q:"Which loop runs at least once?", a:"do...while", choices:["do...while","while","for","foreach"]},
    {q:"What method removes first array element?", a:"shift()", choices:["shift()","pop()","remove()","unshift()"]},
    {q:"Which keyword creates a constant?", a:"const", choices:["const","let","var","constant"]},
    {q:"What is an arrow function?", a:"() => {}", choices:["() => {}","function()","func =>","-> function"]},
    {q:"Which method checks if array includes element?", a:"includes()", choices:["includes()","contains()","has()","exists()"]},
    {q:"What does console.log() do?", a:"Prints to console", choices:["Prints to console","Shows alert","Creates log file","Stops execution"]},
    {q:"Which method filters array elements?", a:"filter()", choices:["filter()","find()","search()","select()"]},
    {q:"What is a callback function?", a:"Function passed as argument", choices:["Function passed as argument","A phone feature","Return statement","Error handler"]},
    {q:"Which method maps array elements?", a:"map()", choices:["map()","forEach()","transform()","convert()"]},
    {q:"What is hoisting?", a:"Moving declarations to top", choices:["Moving declarations to top","Lifting elements","Error handling","Memory management"]},
    {q:"Which method reduces array to single value?", a:"reduce()", choices:["reduce()","compress()","minimize()","shrink()"]},
    {q:"What is the spread operator?", a:"...", choices:["...","***","###","@@@"]},
    {q:"Which event fires when page loads?", a:"onload", choices:["onload","onready","onstart","onopen"]},
    {q:"What is a promise in JavaScript?", a:"Object representing async operation", choices:["Object representing async operation","A guarantee","Contract","Agreement"]},
    {q:"Which method finds array element?", a:"find()", choices:["find()","search()","get()","locate()"]},
    {q:"What keyword handles exceptions?", a:"try...catch", choices:["try...catch","error","handle","except"]},
    {q:"Which method checks if all elements pass test?", a:"every()", choices:["every()","all()","check()","test()"]},
    {q:"What is async/await used for?", a:"Handling asynchronous code", choices:["Handling asynchronous code","Creating loops","Defining variables","Error handling"]},
    {q:"Which method checks if some elements pass test?", a:"some()", choices:["some()","any()","few()","partial()"]},
    {q:"What is destructuring?", a:"Extracting values from objects/arrays", choices:["Extracting values from objects/arrays","Deleting objects","Breaking code","Error type"]},
    {q:"Which method creates new array from array?", a:"slice()", choices:["slice()","cut()","piece()","part()"]},
    {q:"What is template literal syntax?", a:"Backticks ``", choices:["Backticks ``","Single quotes ''","Double quotes \"\"","Parentheses ()"]},
    {q:"Which method modifies array in place?", a:"splice()", choices:["splice()","slice()","split()","spice()"]},
    {q:"What does JSON.stringify() do?", a:"Converts object to JSON string", choices:["Converts object to JSON string","Parses JSON","Validates JSON","Sends JSON"]},
    {q:"Which method adds element to array start?", a:"unshift()", choices:["unshift()","push()","prepend()","add()"]},
    {q:"What is the ternary operator?", a:"condition ? true : false", choices:["condition ? true : false","if/else","switch","for"]},
    {q:"Which method flattens nested arrays?", a:"flat()", choices:["flat()","flatten()","spread()","merge()"]},
    {q:"What is a closure?", a:"Function with access to outer scope", choices:["Function with access to outer scope","A bracket","End of code","Variable type"]},
    {q:"Which method creates array from string?", a:"split()", choices:["split()","toArray()","divide()","separate()"]},
    {q:"What is the nullish coalescing operator?", a:"??", choices:["??","||","&&","!!"]}
  ],
  Database_SQL: [
    {q:"What does SQL stand for?", a:"Structured Query Language", choices:["Structured Query Language","Simple Query Language","Standard Query Logic","System Query Language"]},
    {q:"Which SQL command retrieves data?", a:"SELECT", choices:["SELECT","GET","RETRIEVE","FETCH"]},
    {q:"What SQL keyword filters results?", a:"WHERE", choices:["WHERE","FILTER","IF","WHEN"]},
    {q:"Which command adds new data to a table?", a:"INSERT", choices:["INSERT","ADD","CREATE","APPEND"]},
    {q:"What SQL command modifies existing data?", a:"UPDATE", choices:["UPDATE","MODIFY","CHANGE","ALTER"]},
    {q:"Which SQL command removes data?", a:"DELETE", choices:["DELETE","REMOVE","DROP","ERASE"]},
    {q:"What creates a new table?", a:"CREATE TABLE", choices:["CREATE TABLE","NEW TABLE","MAKE TABLE","ADD TABLE"]},
    {q:"Which keyword sorts results?", a:"ORDER BY", choices:["ORDER BY","SORT BY","ARRANGE BY","GROUP BY"]},
    {q:"What SQL function counts rows?", a:"COUNT()", choices:["COUNT()","TOTAL()","SUM()","NUMBER()"]},
    {q:"Which keyword removes duplicate results?", a:"DISTINCT", choices:["DISTINCT","UNIQUE","NODUPS","SINGLE"]},
    {q:"What is a primary key?", a:"Unique identifier for each row", choices:["Unique identifier for each row","First column","Table name","Database name"]},
    {q:"Which SQL clause limits results?", a:"LIMIT", choices:["LIMIT","TOP","MAX","RESTRICT"]},
    {q:"What is a foreign key?", a:"Reference to primary key in another table", choices:["Reference to primary key in another table","Password field","Index","Backup key"]},
    {q:"Which SQL function finds average?", a:"AVG()", choices:["AVG()","AVERAGE()","MEAN()","MID()"]},
    {q:"What SQL keyword combines conditions?", a:"AND", choices:["AND","PLUS","WITH","COMBINE"]},
    {q:"Which SQL function finds maximum value?", a:"MAX()", choices:["MAX()","MAXIMUM()","HIGHEST()","TOP()"]},
    {q:"What is normalization?", a:"Organizing data to reduce redundancy", choices:["Organizing data to reduce redundancy","Deleting data","Backing up data","Encrypting data"]},
    {q:"Which SQL function finds minimum value?", a:"MIN()", choices:["MIN()","MINIMUM()","LOWEST()","BOTTOM()"]},
    {q:"What is an index in SQL?", a:"Structure to speed up queries", choices:["Structure to speed up queries","Row number","Table position","Column name"]},
    {q:"Which SQL keyword groups results?", a:"GROUP BY", choices:["GROUP BY","SORT BY","ORDER BY","COLLECT BY"]},
    {q:"What is a JOIN in SQL?", a:"Combines rows from multiple tables", choices:["Combines rows from multiple tables","Creates new table","Deletes rows","Sorts data"]},
    {q:"Which SQL function calculates sum?", a:"SUM()", choices:["SUM()","TOTAL()","ADD()","PLUS()"]},
    {q:"What is INNER JOIN?", a:"Returns matching rows from both tables", choices:["Returns matching rows from both tables","All rows","First table only","Last row"]},
    {q:"Which clause filters grouped results?", a:"HAVING", choices:["HAVING","WHERE","FILTER","WHEN"]},
    {q:"What is LEFT JOIN?", a:"All rows from left table plus matches", choices:["All rows from left table plus matches","Only right table","No rows","Random rows"]},
    {q:"Which data type stores text?", a:"VARCHAR", choices:["VARCHAR","INT","FLOAT","BOOLEAN"]},
    {q:"What is NULL in SQL?", a:"Missing or unknown value", choices:["Missing or unknown value","Zero","Empty string","False"]},
    {q:"Which data type stores whole numbers?", a:"INT", choices:["INT","VARCHAR","FLOAT","CHAR"]},
    {q:"What is a transaction?", a:"Group of operations as single unit", choices:["Group of operations as single unit","Single query","Table creation","Data backup"]},
    {q:"Which command saves transaction changes?", a:"COMMIT", choices:["COMMIT","SAVE","APPLY","CONFIRM"]},
    {q:"What is RIGHT JOIN?", a:"All rows from right table plus matches", choices:["All rows from right table plus matches","Only left table","No rows","First row"]},
    {q:"Which command undoes transaction?", a:"ROLLBACK", choices:["ROLLBACK","UNDO","REVERT","CANCEL"]},
    {q:"What is a view in SQL?", a:"Virtual table based on query", choices:["Virtual table based on query","Physical table","Index","Backup"]},
    {q:"Which keyword creates alias?", a:"AS", choices:["AS","ALIAS","NAME","CALL"]},
    {q:"What is FULL OUTER JOIN?", a:"All rows from both tables", choices:["All rows from both tables","Matching only","Left only","Right only"]},
    {q:"Which command removes table structure?", a:"DROP TABLE", choices:["DROP TABLE","DELETE TABLE","REMOVE TABLE","CLEAR TABLE"]},
    {q:"What is a stored procedure?", a:"Precompiled SQL statements", choices:["Precompiled SQL statements","Table backup","Index type","Data type"]},
    {q:"Which command modifies table structure?", a:"ALTER TABLE", choices:["ALTER TABLE","CHANGE TABLE","MODIFY TABLE","UPDATE TABLE"]},
    {q:"What is ACID in databases?", a:"Atomicity, Consistency, Isolation, Durability", choices:["Atomicity, Consistency, Isolation, Durability","A query type","Table format","Index type"]},
    {q:"Which keyword checks for NULL?", a:"IS NULL", choices:["IS NULL","= NULL","== NULL","EQUALS NULL"]},
    {q:"What is a trigger?", a:"Automatic action on data change", choices:["Automatic action on data change","Manual backup","Query type","Table name"]},
    {q:"Which function concatenates strings?", a:"CONCAT()", choices:["CONCAT()","JOIN()","MERGE()","COMBINE()"]},
    {q:"What is a subquery?", a:"Query nested inside another query", choices:["Query nested inside another query","Main query","Table","Index"]},
    {q:"Which keyword checks value in list?", a:"IN", choices:["IN","CONTAINS","HAS","INCLUDES"]},
    {q:"What is denormalization?", a:"Adding redundancy for performance", choices:["Adding redundancy for performance","Removing data","Creating indexes","Backing up"]},
    {q:"Which keyword checks range of values?", a:"BETWEEN", choices:["BETWEEN","RANGE","FROM TO","WITHIN"]},
    {q:"What is a schema?", a:"Database structure definition", choices:["Database structure definition","Table data","Query result","Index"]},
    {q:"Which function gets current date?", a:"CURRENT_DATE or GETDATE()", choices:["CURRENT_DATE or GETDATE()","NOW()","TODAY()","DATE()"]},
    {q:"What is a cursor?", a:"Pointer to query result row", choices:["Pointer to query result row","Mouse pointer","Index","Table"]},
    {q:"Which keyword searches patterns?", a:"LIKE", choices:["LIKE","MATCH","PATTERN","SEARCH"]}
  ],
  Mobile_Dev: [
    {q:"Which language is primarily used for Android development?", a:"Kotlin", choices:["Kotlin","Swift","Python","Ruby"]},
    {q:"What is Flutter's programming language?", a:"Dart", choices:["Dart","Java","TypeScript","C#"]},
    {q:"Which company developed React Native?", a:"Facebook/Meta", choices:["Facebook/Meta","Google","Microsoft","Apple"]},
    {q:"What is an APK in Android?", a:"Android Package", choices:["Android Package","App Package Kit","Android Program Key","Application Pack"]},
    {q:"Which language is used for iOS development?", a:"Swift", choices:["Swift","Kotlin","Java","Dart"]},
    {q:"What is the Android layout file format?", a:"XML", choices:["XML","JSON","HTML","YAML"]},
    {q:"What is React Native used for?", a:"Cross-platform mobile apps", choices:["Cross-platform mobile apps","Desktop apps","Web servers","Databases"]},
    {q:"Which tool is Android's official IDE?", a:"Android Studio", choices:["Android Studio","Visual Studio","Eclipse","Xcode"]},
    {q:"What is an Activity in Android?", a:"A single screen with UI", choices:["A single screen with UI","A database","A background service","A file manager"]},
    {q:"What platform uses Xcode for development?", a:"iOS/Apple", choices:["iOS/Apple","Android","Windows","Linux"]},
    {q:"What is an Intent in Android?", a:"Message to request action", choices:["Message to request action","A variable","A layout","An image"]},
    {q:"Which file contains Android app settings?", a:"AndroidManifest.xml", choices:["AndroidManifest.xml","settings.json","config.xml","app.properties"]},
    {q:"What is a Fragment in Android?", a:"Reusable UI component", choices:["Reusable UI component","A database","An image","A sound file"]},
    {q:"Which iOS file contains app settings?", a:"Info.plist", choices:["Info.plist","config.xml","settings.json","app.manifest"]},
    {q:"What is Gradle in Android?", a:"Build automation tool", choices:["Build automation tool","Database","Layout editor","Emulator"]},
    {q:"What is CocoaPods?", a:"iOS dependency manager", choices:["iOS dependency manager","Android build tool","Web framework","Database"]},
    {q:"What is a RecyclerView?", a:"Efficient scrollable list", choices:["Efficient scrollable list","A button","An image view","A database"]},
    {q:"What is SwiftUI?", a:"iOS declarative UI framework", choices:["iOS declarative UI framework","Android layout","Web framework","Database tool"]},
    {q:"What is a ViewModel in Android?", a:"Manages UI data across config changes", choices:["Manages UI data across config changes","A layout file","An image","A database"]},
    {q:"What is CoreData?", a:"iOS data persistence framework", choices:["iOS data persistence framework","Android database","Web storage","Cloud service"]},
    {q:"What is a Service in Android?", a:"Background operation without UI", choices:["Background operation without UI","A layout","An activity","A database"]},
    {q:"What is Storyboard in iOS?", a:"Visual UI designer", choices:["Visual UI designer","Code editor","Database tool","Build tool"]},
    {q:"What is LiveData in Android?", a:"Observable data holder", choices:["Observable data holder","A layout","An animation","A sound"]},
    {q:"What is ARKit?", a:"iOS augmented reality framework", choices:["iOS augmented reality framework","Android camera","Web AR","Database"]},
    {q:"What is a BroadcastReceiver?", a:"Responds to system-wide events", choices:["Responds to system-wide events","A layout","A database","An image"]},
    {q:"What is TestFlight?", a:"iOS beta testing platform", choices:["iOS beta testing platform","Android emulator","Web testing","Database tool"]},
    {q:"What is Room in Android?", a:"SQLite abstraction library", choices:["SQLite abstraction library","A layout","An animation","A service"]},
    {q:"What is App Clips?", a:"Small part of iOS app", choices:["Small part of iOS app","Android widget","Web app","Database"]},
    {q:"What is Jetpack Compose?", a:"Android declarative UI toolkit", choices:["Android declarative UI toolkit","iOS framework","Web framework","Database"]},
    {q:"What is Push Notification?", a:"Message sent to device", choices:["Message sent to device","Email","SMS","Call"]},
    {q:"What is a ContentProvider?", a:"Shares data between apps", choices:["Shares data between apps","A layout","An image","A service"]},
    {q:"What is HealthKit?", a:"iOS health data framework", choices:["iOS health data framework","Android fitness","Web health","Database"]},
    {q:"What is WorkManager?", a:"Android background task scheduler", choices:["Android background task scheduler","iOS scheduler","Web worker","Database"]},
    {q:"What is SiriKit?", a:"iOS voice assistant integration", choices:["iOS voice assistant integration","Android voice","Web speech","Database"]},
    {q:"What is Navigation Component?", a:"Android navigation framework", choices:["Android navigation framework","iOS navigation","Web routing","Database"]},
    {q:"What is WatchKit?", a:"Apple Watch development framework", choices:["Apple Watch development framework","Android Wear","Web watch","Database"]},
    {q:"What is Data Binding in Android?", a:"Binds UI to data sources", choices:["Binds UI to data sources","Database connection","Web API","Image loading"]},
    {q:"What is CloudKit?", a:"iOS cloud storage service", choices:["iOS cloud storage service","Android cloud","Web storage","Local database"]},
    {q:"What is Hilt?", a:"Android dependency injection", choices:["Android dependency injection","iOS injection","Web DI","Database"]},
    {q:"What is MapKit?", a:"iOS maps framework", choices:["iOS maps framework","Android maps","Web maps","Database"]},
    {q:"What is an Emulator?", a:"Virtual device for testing", choices:["Virtual device for testing","Real phone","Server","Database"]},
    {q:"What is Core ML?", a:"iOS machine learning framework", choices:["iOS machine learning framework","Android ML","Web ML","Database"]},
    {q:"What is ProGuard?", a:"Android code obfuscation tool", choices:["Android code obfuscation tool","iOS security","Web encryption","Database"]},
    {q:"What is App Transport Security?", a:"iOS network security feature", choices:["iOS network security feature","Android security","Web HTTPS","Database encryption"]},
    {q:"What is the Android Lifecycle?", a:"States an activity goes through", choices:["States an activity goes through","Database life","Web session","Server uptime"]},
    {q:"What is Universal Links?", a:"iOS deep linking", choices:["iOS deep linking","Android links","Web URLs","Database links"]},
    {q:"What is Firebase?", a:"Google's mobile development platform", choices:["Google's mobile development platform","Apple service","Web framework","Database only"]},
    {q:"What is Sign in with Apple?", a:"iOS authentication method", choices:["iOS authentication method","Android login","Web auth","Database login"]},
    {q:"What is ADB?", a:"Android Debug Bridge", choices:["Android Debug Bridge","iOS debugger","Web console","Database tool"]},
    {q:"What is In-App Purchase?", a:"Buying within an app", choices:["Buying within an app","External purchase","Free download","Ad viewing"]}
  ],
  Web_Dev: [
    {q:"What does API stand for?", a:"Application Programming Interface", choices:["Application Programming Interface","Advanced Program Integration","Application Process Interface","Auto Program Interface"]},
    {q:"Which HTTP method retrieves data?", a:"GET", choices:["GET","POST","PUT","DELETE"]},
    {q:"What does REST stand for?", a:"Representational State Transfer", choices:["Representational State Transfer","Remote State Transfer","Request State Transfer","Resource State Transfer"]},
    {q:"Which HTTP status code means 'Not Found'?", a:"404", choices:["404","500","200","301"]},
    {q:"What is npm?", a:"Node Package Manager", choices:["Node Package Manager","New Program Manager","Node Process Module","Net Package Manager"]},
    {q:"Which framework is built on Node.js?", a:"Express", choices:["Express","Django","Laravel","Rails"]},
    {q:"What does JSON stand for?", a:"JavaScript Object Notation", choices:["JavaScript Object Notation","Java Source Object Net","JavaScript Online Notation","Java Standard Object Notation"]},
    {q:"Which HTTP method sends new data?", a:"POST", choices:["POST","GET","PUT","PATCH"]},
    {q:"What is CORS?", a:"Cross-Origin Resource Sharing", choices:["Cross-Origin Resource Sharing","Cross-Object Request Service","Common Origin Resource System","Cross-Origin Request Standard"]},
    {q:"What is a SPA in web development?", a:"Single Page Application", choices:["Single Page Application","Simple Program App","Secure Page Access","Static Page Application"]},
    {q:"What does MVC stand for?", a:"Model-View-Controller", choices:["Model-View-Controller","Main Visual Code","Modern View Control","Multiple View Container"]},
    {q:"What is middleware?", a:"Software between client and server", choices:["Software between client and server","A database","A web browser","A programming language"]},
    {q:"Which HTTP method updates data?", a:"PUT", choices:["PUT","GET","POST","DELETE"]},
    {q:"What is a cookie?", a:"Small data stored in browser", choices:["Small data stored in browser","A programming language","A server","A database"]},
    {q:"What does CDN stand for?", a:"Content Delivery Network", choices:["Content Delivery Network","Code Development Network","Central Data Node","Computer Device Network"]},
    {q:"What is WebSocket?", a:"Full-duplex communication protocol", choices:["Full-duplex communication protocol","A web browser","A database","A file format"]},
    {q:"What is OAuth?", a:"Authorization framework", choices:["Authorization framework","A database","A web server","A programming language"]},
    {q:"Which HTTP status means success?", a:"200", choices:["200","404","500","301"]},
    {q:"What is GraphQL?", a:"Query language for APIs", choices:["Query language for APIs","A database","A web framework","A programming language"]},
    {q:"What does SSR stand for?", a:"Server-Side Rendering", choices:["Server-Side Rendering","Simple Site Routing","Secure Server Request","Static Site Rendering"]},
    {q:"What is a JWT?", a:"JSON Web Token", choices:["JSON Web Token","Java Web Tool","JavaScript Web Template","JSON Website Transfer"]},
    {q:"What is caching?", a:"Storing data for faster access", choices:["Storing data for faster access","Deleting data","Encrypting data","Compressing data"]},
    {q:"What does URL stand for?", a:"Uniform Resource Locator", choices:["Uniform Resource Locator","Universal Resource Link","United Resource Location","Unique Reference Locator"]},
    {q:"What is a 500 error?", a:"Internal Server Error", choices:["Internal Server Error","Not Found","Unauthorized","Bad Request"]},
    {q:"What is Webpack?", a:"Module bundler", choices:["Module bundler","Web server","Database","Browser"]},
    {q:"What is a RESTful API?", a:"API following REST principles", choices:["API following REST principles","A database","A web server","A programming language"]},
    {q:"What does CRUD stand for?", a:"Create, Read, Update, Delete", choices:["Create, Read, Update, Delete","Copy, Run, Update, Delete","Create, Run, Update, Download","Copy, Read, Upload, Delete"]},
    {q:"What is a 301 redirect?", a:"Permanent redirect", choices:["Permanent redirect","Temporary redirect","Error","Success"]},
    {q:"What is Docker?", a:"Container platform", choices:["Container platform","Web browser","Database","Programming language"]},
    {q:"What is a session?", a:"Server-side user data storage", choices:["Server-side user data storage","Client-side storage","A database","A file format"]},
    {q:"What is HTTPS certificate?", a:"SSL/TLS certificate for encryption", choices:["SSL/TLS certificate for encryption","A password","A username","A database"]},
    {q:"What is a 403 error?", a:"Forbidden", choices:["Forbidden","Not Found","Server Error","Redirect"]},
    {q:"What is rate limiting?", a:"Limiting API requests", choices:["Limiting API requests","Increasing speed","Caching data","Compressing files"]},
    {q:"What is load balancing?", a:"Distributing traffic across servers", choices:["Distributing traffic across servers","Caching","Encrypting","Compressing"]},
    {q:"What is a microservice?", a:"Small independent service", choices:["Small independent service","Large monolithic app","Database","Web browser"]},
    {q:"What is serverless?", a:"Cloud execution without managing servers", choices:["Cloud execution without managing servers","No internet","Offline app","Local development"]},
    {q:"What is a reverse proxy?", a:"Server forwarding client requests", choices:["Server forwarding client requests","Web browser","Database","Programming language"]},
    {q:"What is CI/CD?", a:"Continuous Integration/Deployment", choices:["Continuous Integration/Deployment","Code Implementation/Design","Computer Interface/Database","Central Information/Data"]},
    {q:"What is a webhook?", a:"HTTP callback for events", choices:["HTTP callback for events","A web browser","A database","A file format"]},
    {q:"What is AJAX?", a:"Asynchronous JavaScript and XML", choices:["Asynchronous JavaScript and XML","Advanced Java Extension","Automated JavaScript Action","Async JSON and XML"]},
    {q:"What is a 401 error?", a:"Unauthorized", choices:["Unauthorized","Not Found","Server Error","Success"]},
    {q:"What is Nginx?", a:"Web server software", choices:["Web server software","Database","Programming language","Web browser"]},
    {q:"What is a DNS record?", a:"Domain name information", choices:["Domain name information","Database record","File record","Log record"]},
    {q:"What is XSS?", a:"Cross-Site Scripting attack", choices:["Cross-Site Scripting attack","XML Style Sheet","Extra Secure Server","External Script Source"]},
    {q:"What is SQL injection?", a:"Malicious SQL query attack", choices:["Malicious SQL query attack","Normal query","Database backup","Data import"]},
    {q:"What is CSRF?", a:"Cross-Site Request Forgery", choices:["Cross-Site Request Forgery","Central Server Request","Common Site Resource","Client-Side Rendering"]},
    {q:"What is a favicon?", a:"Website icon in browser tab", choices:["Website icon in browser tab","A font","A file","A form"]},
    {q:"What is minification?", a:"Removing unnecessary code characters", choices:["Removing unnecessary code characters","Adding code","Encrypting code","Deleting code"]},
    {q:"What is lazy loading?", a:"Loading content on demand", choices:["Loading content on demand","Fast loading","No loading","Pre-loading all"]}
  ],
  UI_UX: [
    {q:"What does UI stand for?", a:"User Interface", choices:["User Interface","Universal Interface","User Interaction","Unified Interface"]},
    {q:"What does UX stand for?", a:"User Experience", choices:["User Experience","Universal Experience","User Extension","Unified Experience"]},
    {q:"What is a wireframe?", a:"Basic layout sketch of a design", choices:["Basic layout sketch of a design","A type of database","A programming framework","A security feature"]},
    {q:"What is a prototype?", a:"Interactive mockup of a design", choices:["Interactive mockup of a design","Final product","Source code","Documentation"]},
    {q:"Which tool is popular for UI design?", a:"Figma", choices:["Figma","Excel","Word","Notepad"]},
    {q:"What is responsive design?", a:"Design that adapts to screen sizes", choices:["Design that adapts to screen sizes","Fast loading design","Colorful design","Simple design"]},
    {q:"What is a call-to-action (CTA)?", a:"Button that prompts user action", choices:["Button that prompts user action","A phone feature","A code comment","A database query"]},
    {q:"What is whitespace in design?", a:"Empty space between elements", choices:["Empty space between elements","White colored text","Blank code","Error message"]},
    {q:"What is accessibility in UI?", a:"Making design usable for everyone", choices:["Making design usable for everyone","Password protection","Fast loading","Bright colors"]},
    {q:"What is a mockup?", a:"Visual representation of design", choices:["Visual representation of design","Code template","Database schema","Server configuration"]},
    {q:"What is typography?", a:"Art of arranging text", choices:["Art of arranging text","A programming language","A database","An animation"]},
    {q:"What is a color palette?", a:"Set of colors for a design", choices:["Set of colors for a design","A painting tool","A database","A programming feature"]},
    {q:"What is user flow?", a:"Path user takes through product", choices:["Path user takes through product","A river","A programming loop","A database query"]},
    {q:"What is a persona?", a:"Fictional representation of user", choices:["Fictional representation of user","A mask","A database record","A programming variable"]},
    {q:"What is A/B testing?", a:"Comparing two design versions", choices:["Comparing two design versions","A grading system","A programming test","A database operation"]},
    {q:"What is a hamburger menu?", a:"Three-line mobile menu icon", choices:["Three-line mobile menu icon","A food item","A database","A programming term"]},
    {q:"What is a breadcrumb?", a:"Navigation showing location path", choices:["Navigation showing location path","A food item","A file type","A database"]},
    {q:"What is visual hierarchy?", a:"Arranging elements by importance", choices:["Arranging elements by importance","A folder structure","A database schema","A programming order"]},
    {q:"What is a heat map?", a:"Visualization of user interactions", choices:["Visualization of user interactions","A weather map","A database chart","A programming diagram"]},
    {q:"What is onboarding?", a:"Introducing users to a product", choices:["Introducing users to a product","Hiring employees","Database migration","Server setup"]},
    {q:"What is a grid system?", a:"Layout structure with columns", choices:["Layout structure with columns","A game","A database","A programming pattern"]},
    {q:"What is a style guide?", a:"Document of design standards", choices:["Document of design standards","A fashion book","A code tutorial","A database manual"]},
    {q:"What is micro-interaction?", a:"Small animated response", choices:["Small animated response","A tiny button","A database query","A programming function"]},
    {q:"What is affordance?", a:"Design that suggests how to use it", choices:["Design that suggests how to use it","A budget term","A programming concept","A database feature"]},
    {q:"What is a splash screen?", a:"Initial loading screen", choices:["Initial loading screen","A water animation","A error screen","A login page"]},
    {q:"What is gestalt principles?", a:"How humans perceive visual elements", choices:["How humans perceive visual elements","A programming concept","A database theory","A network protocol"]},
    {q:"What is a mood board?", a:"Collection of design inspiration", choices:["Collection of design inspiration","An emotion tracker","A database","A programming tool"]},
    {q:"What is card sorting?", a:"Method to organize information", choices:["Method to organize information","A card game","A database sort","A programming pattern"]},
    {q:"What is information architecture?", a:"Organizing content structure", choices:["Organizing content structure","Building design","A database schema","A programming framework"]},
    {q:"What is usability testing?", a:"Evaluating product with real users", choices:["Evaluating product with real users","Code testing","Database testing","Network testing"]},
    {q:"What is a tooltip?", a:"Small info box on hover", choices:["Small info box on hover","A tool","A programming tip","A database hint"]},
    {q:"What is a modal?", a:"Pop-up dialog box", choices:["Pop-up dialog box","A fashion style","A database type","A programming mode"]},
    {q:"What is a dropdown?", a:"Expandable list of options", choices:["Expandable list of options","A falling animation","A database query","A programming error"]},
    {q:"What is a carousel?", a:"Rotating content slideshow", choices:["Rotating content slideshow","A fair ride","A database rotation","A programming loop"]},
    {q:"What is a skeleton screen?", a:"Placeholder during loading", choices:["Placeholder during loading","An X-ray","A bare design","An error state"]},
    {q:"What is dark mode?", a:"Dark-colored interface theme", choices:["Dark-colored interface theme","Night time","A coding style","A database mode"]},
    {q:"What is contrast ratio?", a:"Difference between colors", choices:["Difference between colors","A comparison tool","A programming ratio","A database metric"]},
    {q:"What is a design system?", a:"Collection of reusable components", choices:["Collection of reusable components","A computer system","A database system","A programming language"]},
    {q:"What is a tab bar?", a:"Navigation at bottom of screen", choices:["Navigation at bottom of screen","A drinking place","A database row","A code tab"]},
    {q:"What is touch target?", a:"Area that responds to touch", choices:["Area that responds to touch","A shooting game","A database record","A programming goal"]},
    {q:"What is the fold?", a:"Content visible without scrolling", choices:["Content visible without scrolling","A paper fold","A database partition","A code block"]},
    {q:"What is progressive disclosure?", a:"Revealing info gradually", choices:["Revealing info gradually","Fast loading","Data encryption","Code compilation"]},
    {q:"What is a stepper?", a:"Multi-step form indicator", choices:["Multi-step form indicator","An exercise machine","A database counter","A programming loop"]},
    {q:"What is a toggle?", a:"Switch between two states", choices:["Switch between two states","A game","A database switch","A programming operator"]},
    {q:"What is a snackbar?", a:"Brief notification message", choices:["Brief notification message","A food item","A database alert","A programming warning"]},
    {q:"What is a floating action button?", a:"Primary action button that floats", choices:["Primary action button that floats","A flying button","A database button","A special variable"]},
    {q:"What is a chip?", a:"Small interactive element", choices:["Small interactive element","A food item","A computer chip","A database record"]},
    {q:"What is parallax scrolling?", a:"Background moves slower than foreground", choices:["Background moves slower than foreground","Fast scrolling","Database scrolling","Code scrolling"]},
    {q:"What is infinite scroll?", a:"Content loads as you scroll", choices:["Content loads as you scroll","Never-ending page","Database query","Programming loop"]}
  ],
  Networking: [
    {q:"What does IP stand for?", a:"Internet Protocol", choices:["Internet Protocol","Internal Process","Internet Program","Information Protocol"]},
    {q:"What port does HTTP use?", a:"80", choices:["80","443","22","21"]},
    {q:"What does DNS do?", a:"Translates domain names to IPs", choices:["Translates domain names to IPs","Secures connections","Stores data","Sends emails"]},
    {q:"What is HTTPS?", a:"Secure HTTP with encryption", choices:["Secure HTTP with encryption","Faster HTTP","Older version of HTTP","Hyperlink Transfer Protocol"]},
    {q:"What does LAN stand for?", a:"Local Area Network", choices:["Local Area Network","Large Area Network","Link Access Node","Local Access Network"]},
    {q:"What device connects networks together?", a:"Router", choices:["Router","Monitor","Keyboard","Printer"]},
    {q:"What is TCP?", a:"Transmission Control Protocol", choices:["Transmission Control Protocol","Transfer Control Program","Technical Control Protocol","Total Connection Protocol"]},
    {q:"What port does HTTPS use?", a:"443", choices:["443","80","22","25"]},
    {q:"What is a firewall?", a:"Security system that filters traffic", choices:["Security system that filters traffic","A web browser","A programming language","A database"]},
    {q:"What does VPN stand for?", a:"Virtual Private Network", choices:["Virtual Private Network","Visual Private Network","Virtual Public Network","Verified Private Network"]},
    {q:"What is UDP?", a:"User Datagram Protocol", choices:["User Datagram Protocol","Universal Data Protocol","User Data Program","Unified Datagram Protocol"]},
    {q:"What does WAN stand for?", a:"Wide Area Network", choices:["Wide Area Network","Web Area Network","Wireless Area Network","World Access Network"]},
    {q:"What is an IP address?", a:"Unique identifier for a device", choices:["Unique identifier for a device","A website name","A password","A username"]},
    {q:"What is a MAC address?", a:"Hardware address of network card", choices:["Hardware address of network card","Software address","Website address","Email address"]},
    {q:"What port does SSH use?", a:"22", choices:["22","80","443","21"]},
    {q:"What is a subnet?", a:"Division of a network", choices:["Division of a network","A submarine","A website","A database"]},
    {q:"What does DHCP do?", a:"Assigns IP addresses automatically", choices:["Assigns IP addresses automatically","Encrypts data","Stores files","Sends emails"]},
    {q:"What is a gateway?", a:"Entry point to another network", choices:["Entry point to another network","A door","A website","A database"]},
    {q:"What port does FTP use?", a:"21", choices:["21","22","80","443"]},
    {q:"What is bandwidth?", a:"Data transfer capacity", choices:["Data transfer capacity","A music band","A type of width","A measurement"]},
    {q:"What is latency?", a:"Delay in data transmission", choices:["Delay in data transmission","Speed","Bandwidth","A late fee"]},
    {q:"What does SMTP do?", a:"Sends emails", choices:["Sends emails","Receives emails","Stores files","Browses web"]},
    {q:"What is a packet?", a:"Unit of data transmitted", choices:["Unit of data transmitted","A package","A file","A folder"]},
    {q:"What port does SMTP use?", a:"25", choices:["25","22","80","443"]},
    {q:"What is a switch?", a:"Connects devices in a network", choices:["Connects devices in a network","A light switch","A programming command","A database"]},
    {q:"What is a hub?", a:"Basic network connection device", choices:["Basic network connection device","A center point","A website","A database"]},
    {q:"What is NAT?", a:"Network Address Translation", choices:["Network Address Translation","Natural Access Type","Network Access Tool","Node Address Transfer"]},
    {q:"What is a proxy server?", a:"Intermediary between client and server", choices:["Intermediary between client and server","A backup server","A database","A website"]},
    {q:"What port does POP3 use?", a:"110", choices:["110","25","80","443"]},
    {q:"What is the OSI model?", a:"7-layer networking framework", choices:["7-layer networking framework","An operating system","A database model","A programming language"]},
    {q:"What is Layer 1 of OSI?", a:"Physical Layer", choices:["Physical Layer","Data Link","Network","Transport"]},
    {q:"What is Layer 3 of OSI?", a:"Network Layer", choices:["Network Layer","Physical","Data Link","Transport"]},
    {q:"What is ping?", a:"Tests network connectivity", choices:["Tests network connectivity","A sound","A game","A protocol"]},
    {q:"What does ICMP do?", a:"Sends network error messages", choices:["Sends network error messages","Transfers files","Encrypts data","Assigns IPs"]},
    {q:"What is a network topology?", a:"Physical layout of a network", choices:["Physical layout of a network","A map","A diagram","A file type"]},
    {q:"What is a star topology?", a:"All devices connect to central hub", choices:["All devices connect to central hub","A space design","A rating system","A database"]},
    {q:"What is a mesh network?", a:"Devices interconnect directly", choices:["Devices interconnect directly","A fishing net","A web page","A database"]},
    {q:"What is ARP?", a:"Address Resolution Protocol", choices:["Address Resolution Protocol","Automatic Response Protocol","Address Routing Protocol","Application Request Protocol"]},
    {q:"What port does IMAP use?", a:"143", choices:["143","110","25","22"]},
    {q:"What is port forwarding?", a:"Redirecting traffic to specific device", choices:["Redirecting traffic to specific device","Sending email","Backing up data","Creating folders"]},
    {q:"What is a modem?", a:"Modulates/demodulates signals", choices:["Modulates/demodulates signals","A modern device","A music player","A database"]},
    {q:"What is QoS?", a:"Quality of Service", choices:["Quality of Service","Query of Server","Quick Operation System","Quantity of Storage"]},
    {q:"What is SSL?", a:"Secure Sockets Layer", choices:["Secure Sockets Layer","Simple Security Layer","Standard Socket Language","Secure Server Link"]},
    {q:"What is TLS?", a:"Transport Layer Security", choices:["Transport Layer Security","Transfer Link Security","Technical Layer System","Transport Level Service"]},
    {q:"What is a DMZ?", a:"Demilitarized Zone network", choices:["Demilitarized Zone network","Data Management Zone","Direct Memory Zone","Database Migration Zone"]},
    {q:"What is load balancing?", a:"Distributing traffic across servers", choices:["Distributing traffic across servers","Weighing data","Balancing loads","Measuring weight"]},
    {q:"What is a VLAN?", a:"Virtual Local Area Network", choices:["Virtual Local Area Network","Very Large Area Network","Virtual LAN","Visual Local Area"]},
    {q:"What is traceroute?", a:"Shows path to destination", choices:["Shows path to destination","Traces routes","A GPS tool","A database query"]},
    {q:"What is a network protocol?", a:"Rules for communication", choices:["Rules for communication","A file type","A database","A programming language"]}
  ],
  Programming_Logic: [
    {q:"What is a variable?", a:"Container that stores data", choices:["Container that stores data","A type of loop","A function call","A file type"]},
    {q:"What is a loop used for?", a:"Repeating code multiple times", choices:["Repeating code multiple times","Storing data","Connecting to internet","Displaying images"]},
    {q:"What is an if statement?", a:"Conditional code execution", choices:["Conditional code execution","A type of variable","A loop structure","A function"]},
    {q:"What is a function?", a:"Reusable block of code", choices:["Reusable block of code","A variable type","A file format","A database"]},
    {q:"What does OOP stand for?", a:"Object-Oriented Programming", choices:["Object-Oriented Programming","Online Operation Protocol","Open Object Program","Output Operation Process"]},
    {q:"What is an array?", a:"Collection of items in order", choices:["Collection of items in order","A single variable","A function","A loop"]},
    {q:"What is debugging?", a:"Finding and fixing code errors", choices:["Finding and fixing code errors","Writing new code","Deleting files","Installing software"]},
    {q:"What is a boolean?", a:"True or false value", choices:["True or false value","A number","A string","An array"]},
    {q:"What is recursion?", a:"Function that calls itself", choices:["Function that calls itself","A type of loop","A variable","A database query"]},
    {q:"What is an algorithm?", a:"Step-by-step problem solution", choices:["Step-by-step problem solution","A programming language","A type of variable","A file format"]},
    {q:"What is a while loop?", a:"Loop that runs while condition is true", choices:["Loop that runs while condition is true","A variable","A function","A class"]},
    {q:"What is a for loop?", a:"Loop with counter", choices:["Loop with counter","A variable","A function","A class"]},
    {q:"What is a class?", a:"Blueprint for creating objects", choices:["Blueprint for creating objects","A variable","A loop","A function"]},
    {q:"What is an object?", a:"Instance of a class", choices:["Instance of a class","A variable type","A loop","A function"]},
    {q:"What is inheritance?", a:"Class inheriting from another class", choices:["Class inheriting from another class","A variable","A loop","A function"]},
    {q:"What is encapsulation?", a:"Hiding internal details", choices:["Hiding internal details","A variable","A loop","A function"]},
    {q:"What is polymorphism?", a:"Same method, different behaviors", choices:["Same method, different behaviors","A variable","A loop","A function"]},
    {q:"What is abstraction?", a:"Hiding complexity", choices:["Hiding complexity","A variable","A loop","A function"]},
    {q:"What is a constructor?", a:"Method that initializes an object", choices:["Method that initializes an object","A variable","A loop","A destructor"]},
    {q:"What is a method?", a:"Function inside a class", choices:["Function inside a class","A variable","A loop","A property"]},
    {q:"What is a parameter?", a:"Input to a function", choices:["Input to a function","Output of a function","A variable type","A loop"]},
    {q:"What is a return value?", a:"Output from a function", choices:["Output from a function","Input to a function","A variable type","A loop"]},
    {q:"What is scope?", a:"Where a variable is accessible", choices:["Where a variable is accessible","A telescope","A loop","A function"]},
    {q:"What is a global variable?", a:"Variable accessible everywhere", choices:["Variable accessible everywhere","Local variable","A loop","A function"]},
    {q:"What is a local variable?", a:"Variable accessible only in its scope", choices:["Variable accessible only in its scope","Global variable","A loop","A function"]},
    {q:"What is a constant?", a:"Value that cannot change", choices:["Value that cannot change","A variable","A loop","A function"]},
    {q:"What is a string?", a:"Sequence of characters", choices:["Sequence of characters","A number","A boolean","An array"]},
    {q:"What is an integer?", a:"Whole number", choices:["Whole number","Decimal number","A string","A boolean"]},
    {q:"What is a float?", a:"Decimal number", choices:["Decimal number","Whole number","A string","A boolean"]},
    {q:"What is type casting?", a:"Converting one type to another", choices:["Converting one type to another","A movie term","A loop","A function"]},
    {q:"What is a switch statement?", a:"Multiple condition checker", choices:["Multiple condition checker","A light switch","A loop","A variable"]},
    {q:"What is a break statement?", a:"Exits a loop or switch", choices:["Exits a loop or switch","Breaks code","A variable","A function"]},
    {q:"What is a continue statement?", a:"Skips to next iteration", choices:["Skips to next iteration","Continues code","A variable","A function"]},
    {q:"What is a do-while loop?", a:"Loop that runs at least once", choices:["Loop that runs at least once","A while loop","A for loop","A function"]},
    {q:"What is a nested loop?", a:"Loop inside another loop", choices:["Loop inside another loop","A bird's home","A variable","A function"]},
    {q:"What is an infinite loop?", a:"Loop that never ends", choices:["Loop that never ends","A finite loop","A variable","A function"]},
    {q:"What is a linked list?", a:"Data structure with connected nodes", choices:["Data structure with connected nodes","An array","A variable","A function"]},
    {q:"What is a stack?", a:"LIFO data structure", choices:["LIFO data structure","FIFO data structure","An array","A variable"]},
    {q:"What is a queue?", a:"FIFO data structure", choices:["FIFO data structure","LIFO data structure","An array","A variable"]},
    {q:"What is LIFO?", a:"Last In First Out", choices:["Last In First Out","First In First Out","A variable","A function"]},
    {q:"What is FIFO?", a:"First In First Out", choices:["First In First Out","Last In First Out","A variable","A function"]},
    {q:"What is a binary tree?", a:"Tree with max 2 children per node", choices:["Tree with max 2 children per node","A plant","An array","A variable"]},
    {q:"What is sorting?", a:"Arranging data in order", choices:["Arranging data in order","Deleting data","Creating data","Copying data"]},
    {q:"What is searching?", a:"Finding data in a collection", choices:["Finding data in a collection","Deleting data","Creating data","Sorting data"]},
    {q:"What is Big O notation?", a:"Measures algorithm efficiency", choices:["Measures algorithm efficiency","A big letter","A variable","A function"]},
    {q:"What is O(1)?", a:"Constant time complexity", choices:["Constant time complexity","Linear time","Quadratic time","Logarithmic time"]},
    {q:"What is O(n)?", a:"Linear time complexity", choices:["Linear time complexity","Constant time","Quadratic time","Logarithmic time"]},
    {q:"What is a hash table?", a:"Key-value data structure", choices:["Key-value data structure","An array","A variable","A function"]},
    {q:"What is a pointer?", a:"Variable storing memory address", choices:["Variable storing memory address","A finger","An array","A function"]},
    {q:"What is null?", a:"Absence of value", choices:["Absence of value","Zero","Empty string","False"]}
  ],
  // Legacy difficulty levels for backward compatibility
  Easy: [
    {q:"What does HTML stand for?", a:"HyperText Markup Language", choices:["HyperText Markup Language","High Tech Modern Language","Home Tool Markup Language","Hyperlink Text Markup Language"]},
    {q:"Which keyword declares a variable in JavaScript?", a:"let", choices:["let","variable","var","int"]},
    {q:"What does SQL stand for?", a:"Structured Query Language", choices:["Structured Query Language","Simple Query Language","Standard Query Logic","System Query Language"]},
    {q:"What does UI stand for?", a:"User Interface", choices:["User Interface","Universal Interface","User Interaction","Unified Interface"]},
    {q:"What does IP stand for?", a:"Internet Protocol", choices:["Internet Protocol","Internal Process","Internet Program","Information Protocol"]}
  ],
  Medium: [
    {q:"What CSS display value hides an element?", a:"none", choices:["none","hidden","invisible","collapse"]},
    {q:"What is the result of typeof null?", a:"object", choices:["object","null","undefined","string"]},
    {q:"Which HTTP status code means 'Not Found'?", a:"404", choices:["404","500","200","301"]},
    {q:"What is Flutter's programming language?", a:"Dart", choices:["Dart","Java","TypeScript","C#"]},
    {q:"What port does HTTPS use?", a:"443", choices:["443","80","22","25"]}
  ],
  Hard: [
    {q:"What is CORS?", a:"Cross-Origin Resource Sharing", choices:["Cross-Origin Resource Sharing","Cross-Object Request Service","Common Origin Resource System","Cross-Origin Request Standard"]},
    {q:"What is an Activity in Android?", a:"A single screen with UI", choices:["A single screen with UI","A database","A background service","A file manager"]},
    {q:"What does DOM stand for?", a:"Document Object Model", choices:["Document Object Model","Data Object Management","Document Order Method","Digital Object Model"]},
    {q:"What does OOP stand for?", a:"Object-Oriented Programming", choices:["Object-Oriented Programming","Online Operation Protocol","Open Object Program","Output Operation Process"]},
    {q:"What does API stand for?", a:"Application Programming Interface", choices:["Application Programming Interface","Advanced Program Integration","Application Process Interface","Auto Program Interface"]}
  ]
};

function shuffle(a){ return a.slice().sort(()=>Math.random()-0.5); }

// --- Leaderboard ---
function saveScore(diff,score){
  const name=getCurrentUser(); if(!name) return;
  const lb=JSON.parse(localStorage.getItem('sn_leaderboard')||'{}');
  if(!lb[diff]) lb[diff]=[];
  lb[diff].push({name,score,date:new Date().toLocaleString()});
  lb[diff].sort((a,b)=>b.score-a.score); if(lb[diff].length>50) lb[diff].length=50;
  localStorage.setItem('sn_leaderboard',JSON.stringify(lb));
}

function getLeaderboard(diff){ const lb=JSON.parse(localStorage.getItem('sn_leaderboard')||'{}'); return lb[diff]||[]; }
