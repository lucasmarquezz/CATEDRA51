const tabs=document.querySelectorAll('.topic-tab');
const panels=document.querySelectorAll('.tab-panel');

tabs.forEach(tab=>{
  tab.addEventListener('click',()=>{
    const target=tab.dataset.tab;
    tabs.forEach(item=>{
      const active=item===tab;
      item.classList.toggle('active',active);
      item.setAttribute('aria-selected',active?'true':'false');
    });
    panels.forEach(panel=>{
      const active=panel.id===target;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
    window.scrollTo({top:0,behavior:'smooth'});
  });
});
