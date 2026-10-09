// ====== НАСТРОЙКИ: ссылки на картинки ======
const GIANT_URL="";// optional: your own giant image URL (empty = built-in cartoon giant)
const BG_URL="";// optional: your own background URL
// Рот на картинке гиганта (в % от рамки). Подвиньте, если на вашей картинке рот в другом месте:
const MOUTH={x:50,y:30};
// Свои картинки еды: img:"https://..." (если не загрузится - покажется эмодзи)
const FOODS=[
 {w:"apple",e:"🍎",p:"an apple"},{w:"banana",e:"🍌",p:"a banana"},{w:"bread",e:"🍞",p:"some bread"},
 {w:"milk",e:"🥛",p:"some milk"},{w:"cake",e:"🍰",p:"a cake"},{w:"pizza",e:"🍕",p:"a pizza"},
 {w:"cheese",e:"🧀",p:"some cheese"},{w:"carrot",e:"🥕",p:"a carrot"},{w:"egg",e:"🥚",p:"an egg"},
 {w:"fish",e:"🐟",p:"a fish"},{w:"ice cream",e:"🍦",p:"an ice cream"},{w:"cookie",e:"🍪",p:"a cookie"},
 {w:"orange",e:"🍊",p:"an orange"},{w:"chicken",e:"🍗",p:"some chicken"},{w:"grapes",e:"🍇",p:"some grapes"}
];
const BELLY={x:50,y:68,w:40,h:32};// живот на вашей картинке (в %)
const DRINKS=[{w:"water",e:"💧",p:"some water"},{w:"juice",e:"🧃",p:"some juice"},{w:"tea",e:"🍵",p:"some tea"}];
const PL={apple:"apples",banana:"bananas",bread:"bread",milk:"milk",cake:"cake",pizza:"pizza",cheese:"cheese",carrot:"carrots",egg:"eggs",fish:"fish","ice cream":"ice cream",cookie:"cookies",orange:"oranges",chicken:"chicken",grapes:"grapes",water:"water",juice:"juice",tea:"tea"};
const verb=f=>["milk","water","juice","tea"].includes(f.w)?"drink":"eat";
let level=1,phrase="",neg=null,need=0,got=0,gen=0,mic=false,pts=0,streak=0;const used=new Set();
const Q={1:"Giant, what would you like to eat?",2:"Giant, what do you like?",3:"Giant, what would you like?",4:"Giant, what would you like to eat?",5:""};
const COL=[{w:"red apple",k:"apple",e:"🍎",p:"a red apple"},{w:"green apple",k:"apple",e:"🍏",p:"a green apple"},{w:"yellow banana",k:"banana",e:"🍌",p:"a yellow banana"},{w:"purple grapes",k:"grapes",e:"🍇",p:"some purple grapes"},{w:"orange carrot",k:"carrot",e:"🥕",p:"an orange carrot"},{w:"yellow lemon",k:"lemon",e:"🍋",p:"a yellow lemon"},{w:"green cucumber",k:"cuc",e:"🥒",p:"a green cucumber"},{w:"purple eggplant",k:"egg",e:"🍆",p:"a purple eggplant"},{w:"red strawberry",k:"straw",e:"🍓",p:"a red strawberry"}];
const NUM=["zero","one","two","three","four","five"];
const PC={apple:"apples",banana:"bananas",cake:"cakes",pizza:"pizzas",carrot:"carrots",egg:"eggs",cookie:"cookies",orange:"oranges","ice cream":"ice creams"};
let GOAL=8;const $=id=>document.getElementById(id);
let target=null,score=0,showText=false,busy=false,last="";
// фон и гигант: пробуем загрузить, иначе рисунок по умолчанию
function tryImg(u,ok){if(!u)return;const i=new Image();i.onload=()=>ok(u);i.onerror=()=>{};i.src=u}
function applyImgs(g,b){
 tryImg(b,u=>$("bg").style.backgroundImage=`url("${u}")`);
 tryImg(g,u=>{$("gimg").src=u;$("gimg").style.display="block";$("gsvg").style.display="none"});
}
applyImgs(GIANT_URL,BG_URL);
Object.assign($("bin").style,{left:BELLY.x+"%",top:BELLY.y+"%",width:BELLY.w+"%",height:BELLY.h+"%"});$("mouth").style.left=MOUTH.x+"%";$("mouth").style.top=MOUTH.y+"%";
for(let i=0;i<7;i++){const f=document.createElement("div");f.className="fly";f.textContent=["🦋","🐦","✨","🍃"][i%4];f.style.left=(8+i*13)+"%";f.style.top=(12+(i*17)%45)+"%";f.style.animationDelay=-i*1.3+"s";document.body.appendChild(f)}
// звук
let ac;function beep(f,d,t="sine",v=.15,s=0){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.setValueAtTime(f,ac.currentTime+s);o.frequency.exponentialRampToValueAtTime(f*.6,ac.currentTime+s+d);g.gain.setValueAtTime(v,ac.currentTime+s);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+s+d);o.connect(g);g.connect(ac.destination);o.start(ac.currentTime+s);o.stop(ac.currentTime+s+d)}catch(e){}}
function munch(){[0,.18,.36,.54].forEach(s=>beep(160+Math.random()*60,.12,"square",.12,s))}
function speak(t,giant){return new Promise(r=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.8;u.pitch=giant?.4:1.4;u.onend=r;u.onerror=r;speechSynthesis.speak(u);setTimeout(r,6000)}catch(e){r()}})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function say(t,kid){const b=$("bubble");b.className=kid?"kid":"";b.textContent=(showText||kid)?t:"🔊 …";b.dataset.t=t}
function mouth(open){$("mo").setAttribute("ry",open?20:8)}
function talk(t,giant=true,kid=false){say(t,kid);return speak(t,giant)}
function anim(c,ms){const g=$("gwrap");g.classList.remove("chew","no","jump");void g.offsetWidth;g.classList.add(c);setTimeout(()=>g.classList.remove(c),ms)}
// еда
function makeFood(f){const d=document.createElement("div");d.className="food";d.dataset.w=f.w;
 if(f.img){const i=new Image();i.src=f.img;i.onerror=()=>{d.textContent=f.e};d.appendChild(i)}else d.textContent=f.e;
 d.onpointerdown=ev=>startDrag(ev,d,f);return d}
function shuffle(a){return a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1])}
function pick(pool){let c=pool.filter(f=>!used.has(f.w)&&f.w!==last);if(!c.length){pool.forEach(f=>used.delete(f.w));c=pool.filter(f=>f.w!==last)}const t=shuffle(c)[0];used.add(t.w);last=t.w;return t}
function newRound(){
 let set;const all=FOODS.concat(DRINKS),eat=FOODS.filter(f=>f.w!=="milk");
 if(level==4){target=pick(COL);const sib=COL.filter(f=>f.k==target.k&&f!==target);const rest=shuffle(COL.filter(f=>f.k!=target.k)).slice(0,5-sib.length);set=[target,...sib,...rest];phrase=`I would like to eat ${target.p}, please.`}
 else if(level==3){target=pick(FOODS.filter(f=>PC[f.w]));need=1+Math.floor(Math.random()*5);got=0;const others=shuffle(FOODS.filter(f=>f.w!==target.w)).slice(0,3);set=[target,target,target,target,target,...others];phrase=`I would like ${NUM[need]} ${need==1?target.w:PC[target.w]}.`}
 else{const P=level==1?eat:all;target=pick(P);neg=shuffle(P.filter(f=>f.w!==target.w))[0];set=[target,neg,...shuffle(P.filter(f=>f.w!==target.w&&f.w!==neg.w)).slice(0,4)];
  phrase=level==1?`I would like to eat ${target.p}.`:level==2?`I don't like ${PL[neg.w]}. I would like to ${verb(target)} ${target.p}.`:`Can I have ${target.p}, please?`}
 $("tray").replaceChildren(...shuffle(set).map(makeFood));
 $("ask").textContent=level==5?"👂 Listen to the Giant":"🗣 "+Q[level];
 $("ask").onclick=askH;$("ask").style.display="";busy=false;$("rep").dataset.k="";
 say("I'm hungry!");
}
function listen(chk){return new Promise(res=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){mic=false;updMic();return res(true)}
 let done=false,r;const fin=v=>{if(!done){done=true;try{r.stop()}catch(e){}$("mic").classList.remove("rec");res(v)}};
 try{r=new SR();r.lang="en-US";r.maxAlternatives=3;
 r.onresult=e=>fin(chk([...e.results[0]].map(a=>a.transcript.toLowerCase()).join(" ")));
 r.onerror=e=>{if(e.error=="not-allowed"||e.error=="service-not-allowed"){mic=false;updMic();$("bubble").textContent="Microphone is blocked in this window. Open the game on your own HTTPS website in Chrome.";fin(true)}else fin(false)};
 r.onend=()=>fin(false);setTimeout(()=>fin(false),7000);$("mic").classList.add("rec");r.start()}catch(e){fin(true)}})}
function updMic(){$("mic").style.opacity=mic?1:.55;$("mic").textContent=mic?"🎤 ON":"🎤"}
$("mic").onclick=()=>{if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){$("bubble").textContent="The microphone needs Chrome or Safari";return}mic=!mic;updMic()};updMic();
async function hereYouAre(){
 if(!mic){await talk("Here you are!",false,true);return false}
 for(let i=0;i<2;i++){say("Here you are!",true);$("bubble").textContent="🎤 Say: Here you are!";
  if(await listen(t=>/here|you|are|go|take/.test(t))){beep(880,.2,"triangle");say("⭐ Great!",true);await sleep(500);return true}
  await talk("Say: Here you are!",false,true)}return false}
async function askH(){if(busy)return;busy=true;const g=gen;$("ask").style.display="none";
 const q=Q[level];
 if(level==5){}else if(mic){say(q,true);$("bubble").textContent="🎤 Say: "+q;
  if(await listen(t=>/giant|like|what/.test(t)))beep(880,.2,"triangle");else{await talk(q,false,true)}}
 else await talk(q,false,true);
 if(g!==gen)return;await sleep(300);mouth(1);const pr=talk(phrase);setTimeout(()=>mouth(0),500);await pr;if(g!==gen)return;mouth(0);busy=false;$("rep").dataset.k="1"}
$("rep").onclick=()=>{if(phrase&&$("rep").dataset.k)talk(phrase)};
$("hint").onclick=()=>{showText=!showText;$("hint").textContent=showText?"🙈 Hide text":"👁 Show text";if($("bubble").dataset.t&&!$("bubble").classList.contains("kid"))say($("bubble").dataset.t)};
// перетаскивание
let drag=null;
function startDrag(ev,el,f){
 if(busy||!$("rep").dataset.k)return;ev.preventDefault();
 const c=el.cloneNode(true);c.classList.add("drag");document.body.appendChild(c);
 el.classList.add("gone");drag={el,c,f};move(ev);
 window.addEventListener("pointermove",move);window.addEventListener("pointerup",drop,{once:true});
}
function near(ev){const r=$("mouth").getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;return Math.hypot(ev.clientX-cx,ev.clientY-cy)<Math.max(r.width,70)}
function move(ev){if(!drag)return;drag.c.style.left=ev.clientX+"px";drag.c.style.top=ev.clientY+"px";$("mouth").classList.toggle("hot",near(ev));mouth(near(ev))}
async function drop(ev){
 window.removeEventListener("pointermove",move);
 const {el,c,f}=drag;drag=null;$("mouth").classList.remove("hot");c.remove();
 if(!near(ev)){el.classList.remove("gone");mouth(0);return}
 busy=true;const g=gen;
 if(f.w!==target.w){mouth(0);anim("no",500);el.classList.remove("gone");beep(200,.3,"sawtooth");streak=0;
  await talk("No, thank you!");busy=false;return}
 // правильно!
 el.classList.add("gone");
 const hy=await hereYouAre();if(g!==gen)return;
 mouth(1);anim("chew",1500);munch();
 const s=document.createElement("span");s.textContent=f.e;$("bin").appendChild(s);streak++;addPts(10+(streak>=3?5:0)+(hy?5:0));
 await sleep(900);mouth(0);if(g!==gen)return;
 if(level==3){got++;if(got<need){await talk(NUM[got][0].toUpperCase()+NUM[got].slice(1)+"!");busy=false;return}}
 score++;$("sc").textContent=score;
 beep(660,.2,"triangle",.2);beep(880,.3,"triangle",.2,.15);
 await talk(["Mmm, tasty!","Yummy, yummy!","Mmm! So tasty! Yummy!"][score%3]);
 if(g!==gen)return;if(score>=GOAL){win();return}
 newRound();
}
async function win(){
 const g=gen;anim("jump",1800);confetti();
 await talk("I'm full! Thank you, friends!");if(g!==gen)return;
 $("ask").style.display="";
 if(level<5){$("ask").textContent="➡️ Level "+(level+1);$("ask").onclick=()=>setLevel(level+1)}
 else{$("ask").textContent="🔄 Play again";$("ask").onclick=()=>{pts=0;$("pts").textContent=0;used.clear();setLevel(1)}}
}
function addPts(n){pts+=n;$("pts").textContent=pts;const d=document.createElement("div"),r=$("mouth").getBoundingClientRect();d.textContent="+"+n+" ⭐";
 d.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top}px;z-index:80;font:bold 28px sans-serif;color:#ffeb3b;text-shadow:0 2px 3px #000;pointer-events:none;transition:all 1s;transform:translate(-50%,0)`;
 document.body.appendChild(d);requestAnimationFrame(()=>{d.style.top=(r.top-90)+"px";d.style.opacity=0});setTimeout(()=>d.remove(),1100)}
function setLevel(n){gen++;try{speechSynthesis.cancel()}catch(e){}level=n;score=0;GOAL=n==3?5:8;
 $("goal").textContent=GOAL;$("sc").textContent=0;$("lv").textContent=n;$("bin").replaceChildren();$("bin").style.fontSize=n==3?"clamp(11px,2.3vw,16px)":"";
 document.querySelectorAll("#lvls button").forEach(b=>b.classList.toggle("act",+b.dataset.n==n));mouth(0);newRound()}
{const t=document.createElement("span");t.textContent="Level";t.style.cssText="align-self:center;font-weight:bold;color:#fff;text-shadow:0 2px 3px #000";$("lvls").appendChild(t)}
[1,2,3,4,5].forEach(n=>{const b=document.createElement("button");b.className="btn g";b.dataset.n=n;b.title="Level "+n;b.textContent=n;b.onclick=()=>setLevel(n);$("lvls").appendChild(b)});
["🌴","🍄","🌿","🌴"].forEach((e,i)=>{const d=document.createElement("div");d.className="fly";d.textContent=e;d.style.cssText=`font-size:${44+i*8}px;bottom:${4+i*3}%;top:auto;left:${[2,22,70,92][i]}%;animation:none`;document.body.appendChild(d)});
function confetti(){for(let i=0;i<40;i++){const c=document.createElement("div");c.className="conf";c.textContent=["⭐","🎉","🍎","🎈","🍕"][i%5];c.style.left=Math.random()*100+"vw";c.style.animationDelay=Math.random()*1.2+"s";document.body.appendChild(c);setTimeout(()=>c.remove(),4500)}}
$("goal").textContent=GOAL;
setLevel(1);
$("helpTop").onclick=$("helpStart").onclick=()=>{$("how").style.display="flex"};
$("howOk").onclick=()=>{$("how").style.display="none"};
$("how").onclick=e=>{if(e.target===$("how"))$("how").style.display="none"};
$("play").onclick=()=>{$("start").style.display="none";beep(660,.15,"triangle");beep(880,.2,"triangle",.15,.12)};