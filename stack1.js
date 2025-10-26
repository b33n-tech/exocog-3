// --- Elements ---
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const archiveBtn = document.getElementById("archiveBtn");
const tasksContainer = document.getElementById("tasksContainer");
const promptsContainer = document.getElementById("promptsContainer");
const copiedMsg = document.getElementById("copiedMsg");
const uploadJson = document.getElementById("uploadJson");
const llmSelect = document.getElementById("llmSelect");
const pasteDownloadBtn = document.getElementById("pasteDownloadBtn");
const jsonPasteBox = document.getElementById("jsonPasteBox");

// --- Tâches stockées localement ---
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// --- Format date ---
function formatDate(iso){
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2,'0');
  const month = String(d.getMonth()+1).padStart(2,'0');
  const hours = String(d.getHours()).padStart(2,'0');
  const minutes = String(d.getMinutes()).padStart(2,'0');
  return `${day}/${month} ${hours}:${minutes}`;
}

// --- Render tasks ---
function renderTasks() {
  tasksContainer.innerHTML = "";
  tasks.slice().sort((a,b)=> new Date(a.date)-new Date(b.date))
    .forEach(task=>{
      const li = document.createElement("li");
      li.className = "task-item";

      const taskText = document.createElement("div");
      taskText.className = "task-text";
      taskText.textContent = task.text + " (ajoutée le "+task.date.split("T")[0]+")";
      taskText.style.cursor = "pointer";

      if(task.comments?.length){
        taskText.title = task.comments.map(c=>`• ${c.text} (${formatDate(c.date)})`).join("\n");
      }

      const commentBlock = document.createElement("div");
      commentBlock.className = "comment-section";
      commentBlock.style.display = "none";

      const commentList = document.createElement("ul");
      commentList.className = "comment-list";
      if(task.comments?.length){
        task.comments.forEach(c=>{
          const cLi = document.createElement("li");
          cLi.textContent = `[${formatDate(c.date)}] ${c.text}`;
          commentList.appendChild(cLi);
        });
      }
      commentBlock.appendChild(commentList);

      const commentInputDiv = document.createElement("div");
      commentInputDiv.className = "comment-input";
      const commentInput = document.createElement("input");
      commentInput.placeholder = "Ajouter un commentaire…";
      const commentBtn = document.createElement("button");
      commentBtn.textContent = "+";
      commentBtn.addEventListener("click", ()=>{
        const val = commentInput.value.trim();
        if(val!==""){
          if(!task.comments) task.comments=[];
          task.comments.push({text: val, date: new Date().toISOString()});
          localStorage.setItem("tasks", JSON.stringify(tasks));
          commentInput.value="";
          renderTasks();
        }
      });
      commentInputDiv.appendChild(commentInput);
      commentInputDiv.appendChild(commentBtn);
      commentBlock.appendChild(commentInputDiv);

      li.appendChild(taskText);
      li.appendChild(commentBlock);

      taskText.addEventListener("click", ()=>{
        commentBlock.style.display = commentBlock.style.display==="none"?"flex":"none";
      });

      tasksContainer.appendChild(li);
    });
}

// --- Ajouter tâche ---
addBtn.addEventListener("click", ()=>{
  const text = taskInput.value.trim();
  if(text!==""){
    tasks.push({text,date:new Date().toISOString(),comments:[]});
    localStorage.setItem("tasks", JSON.stringify(tasks));
    taskInput.value="";
    renderTasks();
  }
});

// --- Archiver JSON ---
archiveBtn.addEventListener("click", ()=>{
  if(tasks.length===0){ alert("Aucune tâche à archiver !"); return; }
  const blob = new Blob([JSON.stringify(tasks,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- Paste + download JSON depuis textarea ---
pasteDownloadBtn.addEventListener("click", ()=>{
  const raw = jsonPasteBox.value.trim();
  if(!raw){ alert("JSON vide !"); return; }

  try{
    const data = JSON.parse(raw);
    if(Array.isArray(data)){
      data.forEach(item=>{
        if(item.text && item.date){
          if(!item.comments) item.comments=[];
          item.comments = item.comments.map(c=>typeof c==='string'?{text:c,date:new Date().toISOString()}:c);
          tasks.push({text:item.text,date:item.date,comments:item.comments});
        }
      });
    }
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();

    // téléchargement JSON
    const blob = new Blob([JSON.stringify(tasks,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download=`taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);

    alert("✅ JSON collé et téléchargé !");
    jsonPasteBox.value="";
  }catch(err){
    console.error(err);
    alert("❌ JSON invalide !");
  }
});

// --- Prompts ---
const prompts = [
  {id:"planifier", label:"Plan", text:"Transforme ces tâches en plan structuré étape par étape :"},
  {id:"prioriser", label:"Priorité", text:"Classe ces tâches par ordre de priorité et urgence :"},
  {id:"categoriser", label:"Catégories", text:"Range ces tâches dans des catégories logiques :"}
];

prompts.forEach(p=>{
  const btn = document.createElement("button");
  btn.textContent = p.label;
  btn.addEventListener("click", ()=>{
    const combined = p.text + "\n\n" + tasks.map(t=>{
      let str = "- "+t.text;
      if(t.comments?.length){
        str += "\n  Commentaires :\n" + t.comments.map(c=>`    - [${formatDate(c.date)}] ${c.text}`).join("\n");
      }
      return str;
    }).join("\n");
    navigator.clipboard.writeText(combined).then(()=>{
      copiedMsg.style.display="block";
      setTimeout(()=>copiedMsg.style.display="none",2000);
      // ouvre le LLM sélectionné
      window.open(llmSelect.value, "_blank");
    });
  });
  promptsContainer.appendChild(btn);
});

// --- Upload JSON additionnel ---
uploadJson.addEventListener("change", event=>{
  const files = Array.from(event.target.files);
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        const data = JSON.parse(e.target.result);
        if(Array.isArray(data)){
          data.forEach(item=>{
            if(item.text && item.date){
              if(!item.comments) item.comments=[];
              item.comments = item.comments.map(c=>typeof c==='string'?{text:c,date:new Date().toISOString()}:c);
              tasks.push({text:item.text,date:item.date,comments:item.comments});
            }
          });
        }
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
      }catch(err){ console.error("Erreur lecture JSON:",err); }
    };
    reader.readAsText(file);
  });
});

// --- Initial render ---
renderTasks();
