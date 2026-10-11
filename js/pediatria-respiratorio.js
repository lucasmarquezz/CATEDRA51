document.querySelectorAll('.topic-tabs .topic-tab').forEach(button=>{button.addEventListener('click',()=>{const target=button.dataset.tab;document.querySelectorAll('.topic-tabs .topic-tab').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));});document.querySelectorAll('.tab-panel').forEach(panel=>{const active=panel.id===target;panel.hidden=!active;panel.classList.toggle('active',active);});});});
const quizData={
'sibilancias-preescolar':[
{q:'¿Una sibilancia confirma por sí sola el diagnóstico de asma?',o:['Sí, siempre','No, es un signo inespecífico','Solo si hay fiebre'],a:1,e:'Las sibilancias aparecen en diferentes enfermedades; se necesita integrar historia, examen y evolución.'},
{q:'¿Qué patrón se asocia más con atopia y mayor probabilidad de asma persistente?',o:['Sibilancias precoces transitorias','Sibilancias persistentes atópicas','Todos por igual'],a:1,e:'La atopia personal o familiar se asocia con mayor probabilidad de persistencia, aunque no predice con certeza individual.'},
{q:'¿Qué dato hace pensar en una causa alternativa?',o:['Tos al correr','Inicio brusco con ahogo durante el juego','Antecedente familiar de asma'],a:1,e:'El comienzo brusco durante juego o alimentación obliga a considerar aspiración de cuerpo extraño.'},
{q:'¿Un API positivo confirma asma?',o:['Sí','No; aumenta la probabilidad futura','Descarta asma'],a:1,e:'Es un índice predictivo, no una prueba diagnóstica definitiva.'}],
'asma-6-anos':[
{q:'¿Qué característica define mejor al asma?',o:['Obstrucción siempre fija','Inflamación crónica y limitación variable del flujo aéreo','Infección bacteriana crónica'],a:1,e:'El asma se caracteriza por síntomas variables y limitación variable del flujo espiratorio.'},
{q:'¿Una espirometría normal descarta asma?',o:['Sí','No'],a:1,e:'Puede ser normal entre episodios; repetir o ampliar pruebas si la sospecha clínica persiste.'},
{q:'Antes de intensificar el controlador, ¿qué revisar?',o:['Diagnóstico, adherencia y técnica','Solo la edad','Suspender toda medicación'],a:0,e:'La técnica incorrecta, la mala adherencia y las comorbilidades pueden explicar el mal control.'},
{q:'¿Qué hallazgo es una alarma en una crisis?',o:['Tos aislada que mejora','Silencio auscultatorio con dificultad respiratoria','Síntomas leves al correr'],a:1,e:'Puede indicar flujo aéreo críticamente reducido y requiere atención urgente.'}]};
const current=location.pathname.includes('sibilancias-preescolar')?'sibilancias-preescolar':'asma-6-anos';
const container=document.getElementById('quizContainer');
if(container){const qs=quizData[current];container.innerHTML=qs.map((q,i)=>'<div class="quiz-question"><h3>'+(i+1)+'. '+q.q+'</h3>'+q.o.map((opt,j)=>'<label class="quiz-option"><input type="radio" name="q'+i+'" value="'+j+'"><span>'+opt+'</span></label>').join('')+'<div class="quiz-feedback" id="feedback'+i+'" hidden></div></div>').join('')+'<div class="quiz-score" id="quizScore">Respondé las preguntas para ver tu resultado.</div><button class="quiz-reset" id="quizReset" type="button">Reiniciar autoevaluación</button>';
qs.forEach((q,i)=>{container.querySelectorAll('input[name="q'+i+'"]').forEach(input=>input.addEventListener('change',()=>{const feedback=document.getElementById('feedback'+i);feedback.hidden=false;const correct=Number(input.value)===q.a;feedback.innerHTML='<strong>'+(correct?'Correcto.':'Revisá esta respuesta.')+'</strong> '+q.e;updateScore();}));});
function updateScore(){let answered=0,correct=0;qs.forEach((q,i)=>{const selected=container.querySelector('input[name="q'+i+'"]:checked');if(selected){answered++;if(Number(selected.value)===q.a)correct++;}});document.getElementById('quizScore').textContent=answered<qs.length?'Respondidas: '+answered+'/'+qs.length+' · Aciertos hasta ahora: '+correct:'Resultado: '+correct+'/'+qs.length+' respuestas correctas.';}
document.getElementById('quizReset').addEventListener('click',()=>{container.querySelectorAll('input').forEach(input=>input.checked=false);qs.forEach((q,i)=>{const f=document.getElementById('feedback'+i);f.hidden=true;f.innerHTML='';});document.getElementById('quizScore').textContent='Respondé las preguntas para ver tu resultado.';});}

// Mostrar u ocultar respuestas de las preguntas y casos de repaso.
document.querySelectorAll('.answer-toggle').forEach(button=>{
  button.addEventListener('click',()=>{
    const answer=button.closest('.review-question')?.querySelector('.review-answer');
    if(!answer)return;
    const opening=answer.hidden;
    answer.hidden=!opening;
    button.setAttribute('aria-expanded',String(opening));
    button.textContent=opening?'OCULTAR RESPUESTA':'RESPUESTA';
  });
});
