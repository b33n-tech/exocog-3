document.addEventListener("DOMContentLoaded", () => {
  const jalonsList = document.getElementById("jalonsList");
  const messagesTableBody = document.querySelector("#messagesTable tbody");
  const rdvList = document.getElementById("rdvList");
  const livrablesList = document.getElementById("livrablesList");

  const generateMailBtn = document.getElementById("generateMailBtn");
  const mailPromptSelect = document.getElementById("mailPromptSelect");
  const generateLivrableBtn = document.getElementById("generateLivrableBtn");
  const livrablePromptSelect = document.getElementById("livrablePromptSelect");

  const mailPrompts = {
    1: "Écris un email professionnel clair et concis pour :",
    2: "Écris un email amical et léger pour :"
  };

  const livrablePrompts = {
    1: "Génère un plan détaillé pour :",
    2: "Génère un résumé exécutif pour :",
    3: "Génère une checklist rapide pour :"
  };

  // Récupère les tâches depuis Stack 1
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  function renderModules() {
    // Jalons (fictive pour l'exemple, récupère les tâches "jalons")
    jalonsList.innerHTML = "";
    tasks.filter(t => t.text.toLowerCase().includes("jalon")).forEach(t => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox";
      li.appendChild(cb);
      li.appendChild(document.createTextNode(` ${t.text}`));
      jalonsList.appendChild(li);
    });

    // Messages
    messagesTableBody.innerHTML = "";
    tasks.filter(t => t.text.toLowerCase().includes("message")).forEach(m=>{
      const tr = document.createElement("tr");
      const tdCheck = document.createElement("td");
      const cb = document.createElement("input");
      cb.type="checkbox";
      tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);
      tr.appendChild(document.createElement("td")).textContent = "destinataire"; // mock
      tr.appendChild(document.createElement("td")).textContent = m.text;
      tr.appendChild(document.createElement("td")).textContent = "contenu"; // mock
      messagesTableBody.appendChild(tr);
    });

    // RDV
    rdvList.innerHTML = "";
    tasks.filter(t => t.text.toLowerCase().includes("rdv")).forEach(r=>{
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox";
      li.appendChild(cb);
      li.appendChild(document.createTextNode(` ${r.text}`));
      rdvList.appendChild(li);
    });

    // Livrables
    livrablesList.innerHTML = "";
    tasks.filter(t => t.text.toLowerCase().includes("livrable")).forEach(l=>{
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox";
      li.appendChild(cb);
      li.appendChild(document.createTextNode(` ${l.text}`));
      livrablesList.appendChild(li);
    });
  }

  renderModules();

  // Push mails vers LLM
  generateMailBtn.addEventListener("click", ()=>{
    const selected = Array.from(messagesTableBody.querySelectorAll("input[type=checkbox]:checked"));
    if(!selected.length){ alert("Coche au moins un message !"); return; }
    const prompt = mailPrompts[mailPromptSelect.value];
    const content = selected.map(cb=>{
      return cb.parentElement.parentElement.querySelectorAll("td")[2].textContent;
    }).join("\n\n");
    navigator.clipboard.writeText(`${prompt}\n\n${content}`).then(()=> alert("✅ Copié dans le presse-papier !"));
    window.open(document.getElementById("llmSelect")?.value || "https://chat.openai.com/", "_blank");
  });

  // Push livrables vers LLM
  generateLivrableBtn.addEventListener("click", ()=>{
    const selected = Array.from(livrablesList.querySelectorAll("input[type=checkbox]:checked"));
    if(!selected.length){ alert("Coche au moins un livrable !"); return; }
    const prompt = livrablePrompts[livrablePromptSelect.value];
    const content = selected.map(cb=>cb.nextSibling.textContent).join("\n\n");
    navigator.clipboard.writeText(`${prompt}\n\n${content}`).then(()=> alert("✅ Copié dans le presse-papier !"));
    window.open(document.getElementById("llmSelect")?.value || "https://chat.openai.com/", "_blank");
  });
});
