const app=document.querySelector('#app');
const STORE='just-one-more-meeting-v14';
const DEFAULT={step:'start',meeting:1023,wrong:null};
let state=load();
function load(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return {...DEFAULT}}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function fmt(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function partyState(m){if(m<=1031)return 1;if(m<=1044)return 2;if(m<=1059)return 3;return 4}
function debugTime(){const p=new URLSearchParams(location.search).get('time');if(!p)return null;const r=/^(\d{1,2}):(\d{2})$/.exec(p);return r?Number(r[1])*60+Number(r[2]):null}
function effectiveTime(){return debugTime()??state.meeting}
function scene(){const f=partyState(effectiveTime());return `<section class="scene"><div class="stage"><img src="assets/scene-f${f}.png" alt="Meetingraum mit vier Personen und Blick auf die Weihnachtsfeier, Zustand ${f}"></div></section>`}
function top(){const t=effectiveTime();return `<header class="topbar"><span>${fmt(t)} Uhr</span><span>Weihnachtsfeier seit ${t-1020} Min.</span></header>`}
function button(label,attr){return `<div class="btnrow"><button class="btn" ${attr}>${label}</button></div>`}

// Station 1
const wrong={
  0:{p:4,s:'Daniel · Fachseite',line:'„Beschlossen? Von wem eigentlich?“',follow:'Leonie · Technical Lead',followLine:'„Und die Security-Freigabe haben wir auch noch nicht.“',why:'„Wenn“ und „könnten“ machen aus dem 15. Januar eine bedingte Möglichkeit, keinen beschlossenen Termin.'},
  1:{p:2,s:'Nina · Projektleitung',line:'„Zieltermin klingt schon ziemlich verbindlich.“',follow:'Leonie · Technical Lead',followLine:'„Der 15. Januar hängt weiterhin von der Security-Freigabe ab.“',why:'Der 15. Januar wurde als mögliche Folge einer Bedingung genannt, nicht als festgelegtes Ziel.'},
  3:{p:2,s:'Leonie · Technical Lead',line:'„Ganz ignorieren sollten wir den 15. Januar auch nicht.“',follow:'Nina · Projektleitung',followLine:'„Die Aussage ist relevant, nur eben nicht verbindlich.“',why:'Die Aussage enthält einen möglichen Rollouttermin. Entscheidend ist, die Bedingung und Unsicherheit zu erhalten.'}
};

// Station 2
const evidenceItems=[
 {id:'a',text:'Die Security-Freigabe steht noch aus.',correct:'direct',source:'Transkript: „Wir haben von Security noch keine finale Freigabe.“',explain:'Die Aussage steht sinngemäß unmittelbar im Transkript.'},
 {id:'b',text:'Ein Rollout vor dem 15. Januar ist nicht vorgesehen.',correct:'derived',source:'Transkript: „… könnten wir am 15. Januar … beginnen.“<br>Chat: „Vor dem 15.01. haben wir ohnehin kein Deployment Window.“',explain:'Keiner sagt den Satz exakt so. Aus beiden Informationen lässt er sich aber belastbar ableiten.'},
 {id:'c',text:'Option B ist die bevorzugte Lösung des Teams.',correct:'plausible',source:'Transkript: „Ich persönlich würde momentan zu Option B tendieren.“ Später: „B hätte wahrscheinlich Vorteile bei der Integration.“',explain:'Einzelne positive Aussagen ergeben noch keine belastbare Präferenz des gesamten Teams.'},
 {id:'d',text:'Die Verzögerung erhöht die Projektkosten.',correct:'unsupported',source:'In Transkript, Chat und Präsentation gibt es keine Aussage zu zusätzlichen Kosten.',explain:'Die Aussage mag plausibel sein, ist durch die verfügbaren Quellen aber nicht belegt.'}
];
const evidenceLabels={direct:'Direkt belegt',derived:'Aus den Informationen ableitbar',plausible:'Plausibel, aber nicht ausreichend belegt',unsupported:'Nicht belegt'};
function s2Init(){if(!state.s2)state.s2={index:0,answers:{},showSource:false}}
function s2Score(){return evidenceItems.reduce((n,it)=>n+(state.s2?.answers?.[it.id]===it.correct),0)}
function s2Penalty(score){return score===4?0:score===3?2:score>=2?4:6}

// Station 3
const s3Sources={
 transcript:{label:'Transkript',meta:'16:18 Uhr',body:'„Dann planen wir zunächst mit maximal 50.000 Euro. Die finale Zahl klären wir noch mit Finance.“',note:''},
 chat:{label:'Meeting-Chat',meta:'16:47 Uhr',body:'„Finance ist durch. Ich habe die freigegebene Version gerade aktualisiert: 47.500 Euro. Hier ist der Link.“',note:'Verweist auf Budget_Final.xlsx.'},
 presentation:{label:'Präsentation',meta:'Project_Status_v3.pptx · vor 12 Tagen aktualisiert',body:'Budgetrahmen: 45.000 Euro',note:''},
 excel:{label:'Excel-Datei',meta:'Budget_Final.xlsx · Version 4 · 16:45 Uhr',body:'Budgetobergrenze: 47.500 Euro',note:''}
};
function s3Init(){if(!state.s3)state.s3={source:null,viewed:[],answer:null,penalty:0}}
const s3Answers=[
 {text:'45.000 Euro aus der Präsentation',penalty:3,title:'Die Präsentation ist veraltet.',why:'Project_Status_v3.pptx ist älter als der im Chat dokumentierte und in der Excel-Datei bestätigte Stand.'},
 {text:'50.000 Euro aus dem Transkript',penalty:4,title:'Das Transkript enthält einen vorläufigen Stand.',why:'Im Gespräch wird ausdrücklich gesagt, dass die finale Zahl noch mit Finance geklärt wird.'},
 {text:'47.500 Euro aus der Excel-Datei',penalty:0,title:'Aktueller belastbarer Stand',why:'Die Excel-Datei dokumentiert Version 4 mit einer Budgetobergrenze von 47.500 Euro.'},
 {text:'Keine Zahl, weil sich die Quellen widersprechen',penalty:2,title:'Unterschiedliche Werte sind nicht automatisch ein Widerspruch.',why:'Zeitstempel, Version und Aktualisierung zeigen eine Entwicklung des Informationsstands.'}
];

// Station 4
const s4Categories={decision:'Entscheidung',task:'Aufgabe',question:'Offene Frage',discussion:'Diskussionsstand',none:'Passt nicht'};
const s4Cards=[
 {id:'a',text:'Sam prüft bis Freitag, ob Security die Freigabe erteilen kann.',correct:'task',explain:'Klare Person, konkrete Aktivität und Frist: Das ist eine Aufgabe.'},
 {id:'b',text:'Option B könnte bei der Integration Vorteile haben.',correct:'discussion',explain:'Die Aussage beschreibt einen Diskussionsstand. Es wurde weder entschieden noch eine Aufgabe vergeben.'},
 {id:'c',text:'Für die weitere Planung wird Version 4 verwendet.',correct:'decision',explain:'Hier liegt eine konkrete Festlegung des Projektteams vor.'},
 {id:'d',text:'Ist der Betriebsrat bereits vollständig eingebunden?',correct:'question',explain:'Die Frage wurde nicht beantwortet und bleibt damit offen.'},
 {id:'e',text:'Der Rollout soll möglichst im Januar beginnen.',correct:'discussion',explain:'„Soll möglichst“ beschreibt eine Zielrichtung, aber noch keine belastbare Entscheidung.'},
 {id:'f',text:'Finance bestätigt eine Budgetobergrenze von 47.500 Euro.',correct:'none',explain:'Die 47.500 Euro sind weder Aufgabe noch offene Frage und auch keine Entscheidung des Projektteams. Finance hat die Budgetobergrenze festgelegt. Für das Projekt ist sie damit eine Rahmenbedingung beziehungsweise Vorgabe.'}
];
function s4Init(){if(!state.s4)state.s4={index:0,answers:{}}}
function s4Score(){return s4Cards.reduce((n,it)=>n+(state.s4?.answers?.[it.id]===it.correct),0)}
function s4Penalty(score){return score===6?0:score===5?2:score>=3?4:6}

function render(){
 save();
 if(state.step==='start'){
   app.innerHTML=`<section class="start"><div class="start-card"><h1>Escape the Christmas Meeting</h1><p class="lead">Das letzte Meeting vor der Weihnachtsfeier.<br>Eigentlich sollte es längst vorbei sein.</p>${button('Meeting beitreten','data-go="intro1"')}</div></section>`;
   return bind();
 }
 let html=`<div class="game">${top()}${scene()}`;
 if(state.step==='intro1')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Perfekt. Dann sind wir ja durch.“</div>${button('Weiter','data-go="intro2"')}</section>`;
 if(state.step==='intro2')html+=`<section class="story"><div class="speaker">Daniel · Fachseite</div><div>„Fast. Ich würde nur noch kurz das Protokoll mit Copilot prüfen.“</div>${button('Weiter','data-intro-time')}</section>`;
 if(state.step==='goal')html+=`<div class="chat"><strong>Feier-Chat</strong><br>Das Buffet ist eröffnet.</div><section class="goal"><div><strong>Dein Ziel:</strong> Bring dieses Meeting zu Ende.<br>Jede unnötige Diskussion kostet Zeit.</div>${button("Dann bringen wir's hinter uns.",'data-go="station1a"')}</section>`;
 if(state.step==='station1a')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Dann prüfen wir nur noch kurz die Zusammenfassung.“</div>${button('Weiter','data-go="station1b"')}</section>`;
 if(state.step==='station1b')html+=`<section class="story"><div class="speaker">Daniel · Fachseite</div><div>„Perfekt. Dann können wir das so ins Protokoll übernehmen.“</div>${button('Prüfen','data-go="question"')}</section>`;
 if(state.step==='question')html+=`<section class="work"><div class="eyebrow">Copilot-Zusammenfassung</div><div class="quote">Der Rollout startet am 15. Januar.</div><div class="eyebrow">Transkript · Auszug</div><div class="quote">„Wenn Security die Freigabe bis Jahresende erteilt, könnten wir am 15. Januar mit dem Rollout beginnen.“</div><div class="question">Was ist tatsächlich vereinbart worden?</div><div class="answers">${['Rollout am 15. Januar beschlossen','15. Januar als Zieltermin festgelegt','Rollout am 15. Januar unter einer Bedingung möglich','Noch keine Aussage zum möglichen Rollouttermin'].map((x,i)=>`<button class="answer" data-answer="${i}"><span class="num">${i+1}.</span><span class="txt">${x}</span></button>`).join('')}</div></section>`;
 if(state.step==='correct')html+=`<section class="work"><div class="eyebrow">Transkript · Auflösung</div><div class="quote">„<mark>Wenn</mark> Security die Freigabe bis Jahresende erteilt, <mark>könnten</mark> wir am 15. Januar mit dem Rollout beginnen.“</div><div class="result"><strong>✓ Bedingte Möglichkeit</strong><p>Aus „wenn … könnten“ wurde in der Zusammenfassung „wird“. Die Bedingung und Unsicherheit dürfen nicht verloren gehen.</p></div>${button('Weiter','data-finish')}</section>`;
 if(state.step==='wrong'){const w=wrong[state.wrong];html+=`<div class="penalty">+${w.p} Min.<br><small>${fmt(state.meeting-w.p)} → ${fmt(state.meeting)} Uhr</small></div><section class="story"><div class="speaker">${w.s}</div><div>${w.line}</div>${button('Weiter','data-go="wrong2"')}</section>`}
 if(state.step==='wrong2'){const w=wrong[state.wrong];html+=`<section class="story"><div class="speaker">${w.follow}</div><div>${w.followLine}</div><div class="result"><strong>Warum das Meeting länger dauert</strong><p>${w.why}</p></div>${button('Weiter','data-finish')}</section>`}
 if(state.step==='done')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Okay. Wenn das schon nicht gestimmt hat, sollten wir die anderen Aussagen vielleicht auch kurz prüfen.“</div>${button('Aussagen prüfen','data-go="s2intro"')}</section>`;
 if(state.step==='s2intro')html+=`<div class="chat"><strong>Feier-Chat</strong><br>Wer noch was Warmes möchte: jetzt.</div><section class="story"><div class="speaker">Alex</div><div>„Kurz wäre gut.“</div>${button('Belege prüfen','data-go="s2question"')}</section>`;
 if(state.step==='s2question'){s2Init();const it=evidenceItems[state.s2.index];html+=`<section class="work"><div class="eyebrow">Evidenzprüfung · Aussage ${state.s2.index+1} von 4</div><div class="quote"><strong>Copilot sagt:</strong><br>${it.text}</div>${state.s2.showSource?`<div class="source-box"><strong>Verfügbare Quelle</strong><br>${it.source}</div>`:''}<div class="source-action"><button class="secondary" data-source>${state.s2.showSource?'Quelle schließen':'Quellen ansehen'}</button></div><div class="question">Wie gut ist diese Aussage durch das Meeting belegt?</div><div class="answers evidence">${Object.entries(evidenceLabels).map(([key,label],i)=>`<button class="answer" data-evidence="${key}"><span class="num">${i+1}.</span><span class="txt">${label}</span></button>`).join('')}</div></section>`}
 if(state.step==='s2result'){const score=s2Score(),pen=s2Penalty(score);html+=`${pen?`<div class="penalty">+${pen} Min.<br><small>${score} von 4 Aussagen korrekt eingeordnet</small></div>`:''}<section class="work"><div class="eyebrow">Evidenzprüfung · Auflösung</div><div class="evidence-results">${evidenceItems.map(it=>`<article class="evidence-result"><strong>${evidenceLabels[it.correct]}</strong><div>${it.text}</div><small>${it.explain}</small></article>`).join('')}</div><div class="result"><strong>Copilot-Aussagen sind nicht nur „richtig“ oder „falsch“.</strong><p>Entscheidend ist auch, wie stark eine Aussage durch die verfügbaren Quellen getragen wird.</p></div>${button('Weiter','data-s2-finish')}</section>`}
 if(state.step==='s2done')html+=`<section class="story"><div class="speaker">Daniel · Fachseite</div><div>„Woher kommt eigentlich die Budgetzahl in der Zusammenfassung?“</div>${button('Quellen prüfen','data-go="s3intro"')}</section>`;
 if(state.step==='s3intro')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Welche Budgetgrenze gehört jetzt ins Abschlussprotokoll?“</div>${button('Quellen öffnen','data-go="s3research"')}</section>`;
 if(state.step==='s3research'){s3Init();const src=state.s3.source?s3Sources[state.s3.source]:null;html+=`<section class="work"><div class="eyebrow">Quellenprüfung · Budgetobergrenze</div><div class="source-tabs">${Object.entries(s3Sources).map(([key,v])=>`<button class="source-tab ${state.s3.source===key?'active':''}" data-s3-source="${key}">${v.label}${state.s3.viewed.includes(key)?' ✓':''}</button>`).join('')}</div>${src?`<article class="source-document"><div class="source-meta">${src.meta}</div><div class="source-body">${src.body}</div>${src.note?`<small>${src.note}</small>`:''}</article>`:`<div class="source-empty">Wähle eine Quelle aus. Du kannst anschließend jederzeit zwischen den Quellen wechseln.</div>`}<div class="question">Was übernimmst du ins Protokoll?</div><div class="answers">${s3Answers.map((a,i)=>`<button class="answer" data-s3-answer="${i}"><span class="num">${i+1}.</span><span class="txt">${a.text}</span></button>`).join('')}</div></section>`}
 if(state.step==='s3result'){s3Init();const a=s3Answers[state.s3.answer];const traced=state.s3.viewed.includes('chat')&&state.s3.viewed.includes('excel');html+=`${a.penalty?`<div class="penalty">+${a.penalty} Min.</div>`:''}<section class="work"><div class="eyebrow">Quellenprüfung · Auflösung</div><div class="result"><strong>${a.title}</strong><p>${a.why}</p>${state.s3.answer===2?`<p>${traced?'Der Chat führte zur aktualisierten Datei und machte den Herkunftspfad nachvollziehbar.':'Die Excel-Datei liefert den aktuellen Stand. Im Chat wäre zusätzlich nachvollziehbar gewesen, wann und warum sie aktualisiert wurde.'}</p>`:''}</div><p><strong>Quellenlogik:</strong> Transkript, Chat, Präsentation und Datei können unterschiedliche Informationsstände abbilden. Aktualität und Freigabestatus gehören zur Bewertung.</p>${button('Weiter','data-s3-finish')}</section>`}
 if(state.step==='s3done')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Gut. Dann müssen wir jetzt nur noch sauber festhalten, was eigentlich Aufgabe, Entscheidung und offene Frage ist.“</div>${button('Protokoll sortieren','data-go="s4intro"')}</section>`;
 if(state.step==='s4intro')html+=`<section class="story"><div class="speaker">Alex</div><div>„Copilot hat das doch schon sortiert.“</div>${button('Sortierung prüfen','data-go="s4question"')}</section>`;
 if(state.step==='s4question'){s4Init();const it=s4Cards[state.s4.index];html+=`<section class="work"><div class="eyebrow">Protokoll reparieren · Eintrag ${state.s4.index+1} von 6</div><div class="quote">${it.text}</div><div class="question">Wohin gehört dieser Eintrag?</div><div class="answers category-answers">${Object.entries(s4Categories).map(([key,label],i)=>`<button class="answer" data-s4-answer="${key}"><span class="num">${i+1}.</span><span class="txt">${label}</span></button>`).join('')}</div></section>`}
 if(state.step==='s4result'){const score=s4Score(),pen=s4Penalty(score);html+=`${pen?`<div class="penalty">+${pen} Min.<br><small>${score} von 6 Einträgen korrekt eingeordnet</small></div>`:''}<section class="work"><div class="eyebrow">Protokoll reparieren · Auflösung</div><div class="classification-results">${s4Cards.map(it=>`<article class="classification-result"><div class="classification-label">${it.correct==='none'?'Rahmenbedingung / Vorgabe':s4Categories[it.correct]}</div><strong>${it.text}</strong><small>${it.explain}</small></article>`).join('')}</div><div class="result"><strong>Gute Strukturierung bedeutet auch, eine unpassende Kategorie nicht zu erzwingen.</strong><p>Nicht jede Entscheidung im Umfeld eines Meetings ist eine Entscheidung des Projektteams. Entscheidend ist auch, wer entschieden hat und welche Bedeutung diese Entscheidung für den betrachteten Kontext hat.</p></div>${button('Weiter','data-s4-finish')}</section>`}
 if(state.step==='s4done')html+=`<section class="story"><div class="speaker">Nina · Projektleitung</div><div>„Gut. Dann fehlt eigentlich nur noch die Betriebsratsfreigabe.“</div>${button('Prototyp neu starten','data-reset')}</section>`;
 const dt=debugTime();if(dt!==null)html+=`<div class="debug">Debug-Zeit: ${fmt(dt)} · F${partyState(dt)}</div>`;
 app.innerHTML=html+'</div>';bind();
}

function bind(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{state.step=b.dataset.go;render()});
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const i=+b.dataset.answer;if(i===2)state.step='correct';else{state.wrong=i;state.meeting+=wrong[i].p;state.step='wrong'}render()});
 document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{state.meeting+=1;state.step='done';render()});
 document.querySelectorAll('[data-intro-time]').forEach(b=>b.onclick=()=>{state.meeting=1024;state.step='goal';render()});
 document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>{s2Init();state.s2.showSource=!state.s2.showSource;render()});
 document.querySelectorAll('[data-evidence]').forEach(b=>b.onclick=()=>{s2Init();const it=evidenceItems[state.s2.index];state.s2.answers[it.id]=b.dataset.evidence;state.s2.showSource=false;if(state.s2.index<evidenceItems.length-1){state.s2.index++;render()}else{const score=s2Score();state.meeting+=s2Penalty(score);state.step='s2result';render()}});
 document.querySelectorAll('[data-s2-finish]').forEach(b=>b.onclick=()=>{state.meeting+=1;state.step='s2done';render()});
 document.querySelectorAll('[data-s3-source]').forEach(b=>b.onclick=()=>{s3Init();state.s3.source=b.dataset.s3Source;if(!state.s3.viewed.includes(state.s3.source))state.s3.viewed.push(state.s3.source);render()});
 document.querySelectorAll('[data-s3-answer]').forEach(b=>b.onclick=()=>{s3Init();state.s3.answer=Number(b.dataset.s3Answer);state.meeting+=s3Answers[state.s3.answer].penalty;state.step='s3result';render()});
 document.querySelectorAll('[data-s3-finish]').forEach(b=>b.onclick=()=>{state.meeting+=1;state.step='s3done';render()});
 document.querySelectorAll('[data-s4-answer]').forEach(b=>b.onclick=()=>{s4Init();const it=s4Cards[state.s4.index];state.s4.answers[it.id]=b.dataset.s4Answer;if(state.s4.index<s4Cards.length-1){state.s4.index++;render()}else{const score=s4Score();state.meeting+=s4Penalty(score);state.step='s4result';render()}});
 document.querySelectorAll('[data-s4-finish]').forEach(b=>b.onclick=()=>{state.meeting+=1;state.step='s4done';render()});
 document.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{try{localStorage.removeItem(STORE)}catch{}state={...DEFAULT};render()});
}
render();
