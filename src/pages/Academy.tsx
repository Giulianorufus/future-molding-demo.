import { useMemo, useState } from "react";
import { GraduationCap, PlayCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDrawingStore } from "@/stores/drawingStore";

type Lesson = { id: string; title: string; description: string; question: string; answers: string[]; correct: number; explanation: string };

const lessons: Lesson[] = [
  { id:"cavita", title:"Cavità e dose", description:"Impara come il numero di cavità modifica la stampata senza cambiare la geometria del singolo pezzo.", question:"Passando da 1 a 4 cavità, cosa accade al volume totale dei pezzi?", answers:["Resta uguale","Raddoppia","Quadruplica","Dipende dalla pressa"], correct:2, explanation:"Il volume CAD è del singolo pezzo. Il volume dei pezzi per stampata è volume pezzo × numero cavità." },
  { id:"chiusura", title:"Area proiettata e chiusura", description:"Collega area proiettata, pressione in cavità e forza di chiusura.", question:"A parità di pezzo e pressione, aumentando le cavità cosa accade alla forza di chiusura richiesta?", answers:["Diminuisce","Aumenta con l'area proiettata totale","Non cambia","Dipende solo dalla vite"], correct:1, explanation:"La forza richiesta dipende dall'area proiettata complessiva sottoposta alla pressione in cavità." },
  { id:"runner", title:"Canale caldo e freddo", description:"Comprendi quando materozza e canali entrano nella dose.", question:"Con canale freddo, quale dato serve per una dose più attendibile?", answers:["Solo temperatura stampo","Volume di materozza e canali","Solo tonnellaggio pressa","Numero zone cilindro"], correct:1, explanation:"Il volume dei canali freddi va aggiunto al volume totale dei pezzi. Future Molding non lo inventa se non è noto." },
];

export default function Academy() {
  const [lessonId,setLessonId]=useState(lessons[0].id);
  const [answer,setAnswer]=useState<number|null>(null);
  const ds=useDrawingStore();
  const lesson=lessons.find(l=>l.id===lessonId)!;
  const context=useMemo(()=>({
    partVolume: ds.volumeCm3,
    cavities: ds.cavityCount,
    total: ds.volumeCm3 ? ds.volumeCm3*ds.cavityCount : null,
    feed: ds.feedSystem
  }),[ds.volumeCm3,ds.cavityCount,ds.feedSystem]);

  return <div className="max-w-5xl mx-auto space-y-5">
    <div className="bg-blue-800 text-white rounded-xl p-6">
      <div className="flex items-center gap-3"><GraduationCap/><h1 className="text-2xl font-bold">Future Molding Academy</h1></div>
      <p className="mt-2 text-blue-100">Impara sullo stesso pezzo, stampo e processo usati in Produzione.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-3">{lessons.map(l=><button key={l.id} onClick={()=>{setLessonId(l.id);setAnswer(null)}} className={`text-left border rounded-lg p-4 ${lessonId===l.id?'border-blue-600 bg-blue-50':'bg-white'}`}><div className="font-semibold text-blue-800">{l.title}</div><div className="text-sm text-gray-600 mt-1">{l.description}</div></button>)}</div>
    <div className="grid md:grid-cols-3 gap-5">
      <section className="md:col-span-2 bg-white border rounded-xl p-5">
        <div className="flex items-center gap-2 text-blue-800 font-semibold"><PlayCircle size={20}/>{lesson.title}</div>
        <p className="mt-4 font-medium">{lesson.question}</p>
        <div className="grid gap-2 mt-3">{lesson.answers.map((a,i)=><button key={a} onClick={()=>setAnswer(i)} className={`text-left border rounded p-3 ${answer===i?'border-blue-600 bg-blue-50':''}`}>{a}</button>)}</div>
        {answer!==null && <div className={`mt-4 rounded p-4 ${answer===lesson.correct?'bg-green-50':'bg-amber-50'}`}><div className="flex items-center gap-2 font-semibold">{answer===lesson.correct?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>} {answer===lesson.correct?'Corretto':'Da rivedere'}</div><p className="text-sm mt-1">{lesson.explanation}</p></div>}
      </section>
      <aside className="bg-gray-50 border rounded-xl p-5">
        <h2 className="font-semibold text-blue-800">Caso reale corrente</h2>
        {context.partVolume ? <div className="text-sm space-y-2 mt-3"><div>Volume pezzo: <strong>{context.partVolume.toFixed(2)} cm³</strong></div><div>Cavità: <strong>{context.cavities}</strong></div><div>Volume pezzi/stampata: <strong>{context.total?.toFixed(2)} cm³</strong></div><div>Alimentazione: <strong>{context.feed==='hot'?'Canale caldo':context.feed==='cold'?'Canale freddo':'Non nota'}</strong></div></div>:<p className="text-sm text-gray-600 mt-3">Carica un CAD nel Wizard per trasformare le lezioni in esercizi sul tuo pezzo.</p>}
      </aside>
    </div>
  </div>
}
