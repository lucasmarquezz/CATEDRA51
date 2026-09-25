const root=document.documentElement;
const themeButton=document.getElementById('themeToggle');
const menuButton=document.getElementById('menuToggle');
const sidebar=document.getElementById('sidebar');

const savedTheme=localStorage.getItem('catedra51-theme');
if(savedTheme) root.dataset.theme=savedTheme;

function updateThemeButton(){
  const dark=root.dataset.theme==='dark';
  themeButton.innerHTML=dark?'☀ <span>Modo día</span>':'☾ <span>Modo oscuro</span>';
}
updateThemeButton();

themeButton.addEventListener('click',()=>{
  const next=root.dataset.theme==='dark'?'light':'dark';
  root.dataset.theme=next;
  localStorage.setItem('catedra51-theme',next);
  updateThemeButton();
});

menuButton.addEventListener('click',()=>{
  const open=sidebar.classList.toggle('open');
  menuButton.setAttribute('aria-expanded',open);
  menuButton.textContent=open?'×':'☰';
});

document.querySelectorAll('.sidebar a').forEach(link=>{
  link.addEventListener('click',()=>sidebar.classList.remove('open'));
});
