// ============================================================
//  ÉDITEUR D'ANNOTATION DE PHOTOS
//  Permet de poser des PNG (mâts, antennes) et du texte sur
//  une photo, avec déplacement / redimensionnement / rotation.
//  À la sauvegarde, exporte en PNG via <canvas>.
// ============================================================

const Editor = (function () {
  // État de l'éditeur
  let currentPhotoKey = null;     // clé du photoStore en cours d'édition
  let stageEl = null;             // élément .editor-stage
  let bgPhotoEl = null;           // <img> de fond
  let elements = [];              // [{el, type, src?, text?, font?, ...}]
  let selectedEl = null;
  let stageW = 0, stageH = 0;     // taille naturelle de la photo (px)
  let scale = 1;                  // facteur d'échelle d'affichage

  // ---- Initialisation des miniatures de la barre d'outils ----
  function initThumbnails() {
    Object.keys(ANNOTATION_ASSETS).forEach(key => {
      const img = document.getElementById("thumb_" + key);
      if (img) img.src = ANNOTATION_ASSETS[key];
    });
  }

  // ---- Ouvrir l'éditeur ----
  function open(photoKey, label) {
    currentPhotoKey = photoKey;
    document.getElementById("editorTitle").textContent = label;

    stageEl = document.getElementById("editorStage");
    bgPhotoEl = document.getElementById("editorBgPhoto");

    // Réinitialiser l'éditeur
    elements = [];
    selectedEl = null;
    // Vider la stage (mais conserver l'image de fond)
    [...stageEl.querySelectorAll(".editor-element")].forEach(e => e.remove());

    // Charger la photo de fond
    const photo = photoStore[photoKey];
    if (!photo) return;

    // Si la photo a déjà été annotée, on repart du dataURL "annoté" en bg
    // (sinon on réannote par-dessus l'annotation, ce qui dégrade la qualité)
    const srcUrl = photo.originalDataUrl || photo.dataUrl;

    bgPhotoEl.onload = () => {
      stageW = bgPhotoEl.naturalWidth;
      stageH = bgPhotoEl.naturalHeight;
      fitStage();
    };
    bgPhotoEl.src = srcUrl;

    document.getElementById("editorOverlay").classList.add("shown");
  }

  // Adapter la taille d'affichage au conteneur
  function fitStage() {
    const wrap = document.getElementById("editorCanvasWrap");
    const padding = 40;
    const availW = wrap.clientWidth - padding;
    const availH = wrap.clientHeight - padding;
    const sW = availW / stageW;
    const sH = availH / stageH;
    scale = Math.min(sW, sH, 1.5); // jamais au-delà de 1.5x
    stageEl.style.width = (stageW * scale) + "px";
    stageEl.style.height = (stageH * scale) + "px";
    bgPhotoEl.style.width = "100%";
    bgPhotoEl.style.height = "100%";
  }

  // ---- Fermer ----
  function close() {
    document.getElementById("editorOverlay").classList.remove("shown");
    currentPhotoKey = null;
  }

  // ---- Ajouter un asset image (PNG mât/antenne) ----
  function addAsset(assetKey) {
    const src = ANNOTATION_ASSETS[assetKey];
    if (!src) return;

    const wrapper = document.createElement("div");
    wrapper.className = "editor-element";

    const img = document.createElement("img");
    img.src = src;
    img.draggable = false;
    wrapper.appendChild(img);

    // Taille initiale : largeur = 25% de la photo (en coords naturelles)
    const initialNatW = stageW * 0.25;

    // On stocke les coords en "naturel" (px de la photo originale)
    // mais on positionne en "écran" (multipliées par scale)
    const data = {
      type: "image",
      src: src,
      assetKey: assetKey,
      x: stageW * 0.4,    // centré-ish
      y: stageH * 0.4,
      w: initialNatW,
      h: initialNatW,     // sera recalculé après onload
      rotation: 0,
    };

    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth;
      data.h = data.w * ratio;
      applyTransform(wrapper, data);
    };

    wrapper.dataset.uid = uid();
    wrapper._data = data;
    stageEl.appendChild(wrapper);
    elements.push({ el: wrapper, data });

    attachHandlers(wrapper);
    select(wrapper);
    applyTransform(wrapper, data);
  }

  // ---- Ajouter un texte (style "WordArt") ----
  function addText() {
    const text = document.getElementById("textInput").value.trim();
    if (!text) {
      alert("Tapez d'abord un texte dans le champ.");
      return;
    }
    const font = document.getElementById("textFont").value;
    const size = parseInt(document.getElementById("textSize").value, 10) || 20;
    const color = document.getElementById("textColor").value;
    const stroke = document.getElementById("textStroke").value;
    const bold = document.getElementById("textBold").checked;
    const shadow = document.getElementById("textShadow").checked;

    const wrapper = document.createElement("div");
    wrapper.className = "editor-element text-element";
    wrapper.textContent = text;
    applyTextStyle(wrapper, { font, size, color, stroke, bold, shadow });

    // Pour les textes, on laisse la largeur être auto (ne pas la forcer)
    const data = {
      type: "text",
      text, font, size, color, stroke, bold, shadow,
      x: stageW * 0.3,
      y: stageH * 0.5,
      rotation: 0,
    };

    wrapper.dataset.uid = uid();
    wrapper._data = data;
    stageEl.appendChild(wrapper);
    elements.push({ el: wrapper, data });

    attachHandlers(wrapper);
    select(wrapper);
    applyTransform(wrapper, data);

    // double-clic pour éditer le texte
    wrapper.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const newText = prompt("Modifier le texte :", data.text);
      if (newText !== null && newText.trim() !== "") {
        data.text = newText;
        wrapper.textContent = newText;
      }
    });
  }

  function applyTextStyle(el, s) {
    el.style.fontFamily = s.font;
    el.style.fontSize = (s.size * scale) + "px"; // taille à l'écran
    el.style.color = s.color;
    el.style.fontWeight = s.bold ? "900" : "400";
    el.dataset.naturalSize = s.size; // pour ré-appliquer après resize
    // contour + ombre via text-shadow combiné
    const strokes = [
      `-1px -1px 0 ${s.stroke}`,
      `1px -1px 0 ${s.stroke}`,
      `-1px 1px 0 ${s.stroke}`,
      `1px 1px 0 ${s.stroke}`,
      `0 -1px 0 ${s.stroke}`,
      `0 1px 0 ${s.stroke}`,
      `-1px 0 0 ${s.stroke}`,
      `1px 0 0 ${s.stroke}`,
    ];
    if (s.shadow) strokes.push(`2px 2px 4px rgba(0,0,0,0.6)`);
    el.style.textShadow = strokes.join(", ");
  }

  // ---- Application du transform (position + taille + rotation) ----
  function applyTransform(el, data) {
    el.style.left = (data.x * scale) + "px";
    el.style.top = (data.y * scale) + "px";
    if (data.type === "image") {
      el.style.width = (data.w * scale) + "px";
      el.style.height = (data.h * scale) + "px";
    } else {
      // text : taille auto, mais on ré-applique la fontSize
      el.style.fontSize = (data.size * scale) + "px";
    }
    el.style.transform = `rotate(${data.rotation}deg)`;
  }

  // ---- Sélection ----
  function select(el) {
    if (selectedEl) {
      selectedEl.classList.remove("selected");
      [...selectedEl.querySelectorAll(".handle")].forEach(h => h.remove());
    }
    selectedEl = el;
    if (!el) return;
    el.classList.add("selected");
    addHandles(el);
  }

  function addHandles(el) {
    // Resize (bottom-right)
    const r = document.createElement("div");
    r.className = "handle resize";
    el.appendChild(r);
    r.addEventListener("pointerdown", startResize);

    // Rotate (top center)
    const rot = document.createElement("div");
    rot.className = "handle rotate";
    rot.title = "Pivoter";
    el.appendChild(rot);
    rot.addEventListener("pointerdown", startRotate);

    // Delete (top right)
    const d = document.createElement("div");
    d.className = "handle delete";
    d.textContent = "✕";
    d.title = "Supprimer";
    el.appendChild(d);
    d.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      deleteElement(el);
    });
  }

  function deleteElement(el) {
    elements = elements.filter(it => it.el !== el);
    el.remove();
    if (selectedEl === el) selectedEl = null;
  }

  // ---- Drag (déplacement) ----
  function attachHandlers(el) {
    el.addEventListener("pointerdown", (e) => {
      // ignorer si on clique sur un handle
      if (e.target.classList.contains("handle")) return;
      e.stopPropagation();
      e.preventDefault();
      select(el);
      startDrag(e, el);
    });
  }

  function startDrag(e, el) {
    const data = el._data;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = data.x;
    const origY = data.y;

    function onMove(ev) {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      data.x = origX + dx;
      data.y = origY + dy;
      applyTransform(el, data);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startResize(e) {
    e.stopPropagation();
    e.preventDefault();
    const el = selectedEl;
    if (!el) return;
    const data = el._data;
    const startX = e.clientX;
    const startY = e.clientY;

    if (data.type === "image") {
      const origW = data.w;
      const origH = data.h;
      const ratio = origH / origW;
      function onMove(ev) {
        const dx = (ev.clientX - startX) / scale;
        const newW = Math.max(20, origW + dx);
        data.w = newW;
        data.h = newW * ratio; // garde les proportions
        applyTransform(el, data);
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    } else {
      // texte : on agrandit la fontSize
      const origSize = data.size;
      function onMove(ev) {
        const dx = (ev.clientX - startX) / scale;
        const newSize = Math.max(10, origSize + dx * 0.5);
        data.size = newSize;
        applyTransform(el, data);
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    }
  }

  function startRotate(e) {
    e.stopPropagation();
    e.preventDefault();
    const el = selectedEl;
    if (!el) return;
    const data = el._data;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    const origRot = data.rotation;
    function onMove(ev) {
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      data.rotation = origRot + (a - startAngle);
      applyTransform(el, data);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // ---- Désélection au clic sur la stage ----
  function setupStageClick() {
    document.getElementById("editorStage").addEventListener("pointerdown", (e) => {
      if (e.target === stageEl || e.target === bgPhotoEl) {
        select(null);
      }
    });
  }

  // ---- Suppression au clavier ----
  function setupKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (!document.getElementById("editorOverlay").classList.contains("shown")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEl) {
        // Ne pas intercepter si on est dans un input
        if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        deleteElement(selectedEl);
      }
      if (e.key === "Escape") close();
    });
  }

  // ---- Aperçu du style de texte ----
  function updateTextPreview() {
    const prev = document.getElementById("textPreview");
    const txt = document.getElementById("textInput").value || "Aperçu";
    const font = document.getElementById("textFont").value;
    const size = parseInt(document.getElementById("textSize").value, 10) || 20;
    const color = document.getElementById("textColor").value;
    const stroke = document.getElementById("textStroke").value;
    const bold = document.getElementById("textBold").checked;
    const shadow = document.getElementById("textShadow").checked;
    prev.textContent = txt;
    applyTextStyle(prev, { font, size, color, stroke, bold, shadow });
    prev.style.fontSize = Math.min(size, 30) + "px"; // bornage pour l'aperçu
  }

  // ---- EXPORT : rendu canvas haute résolution ----
  async function exportAnnotated() {
    // On rend dans un canvas à la taille NATURELLE de la photo, pour préserver la qualité
    const canvas = document.createElement("canvas");
    canvas.width = stageW;
    canvas.height = stageH;
    const ctx = canvas.getContext("2d");

    // 1) Dessiner la photo de fond
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, stageW, stageH);
        resolve();
      };
      img.src = bgPhotoEl.src;
    });

    // 2) Dessiner chaque élément, dans l'ordre du DOM (=> z-order correct)
    for (const it of elements) {
      const d = it.data;
      if (d.type === "image") {
        await drawImageEl(ctx, d);
      } else if (d.type === "text") {
        drawTextEl(ctx, d);
      }
    }

    return canvas;
  }

  function drawImageEl(ctx, d) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        // Translation au centre de l'élément, rotation, puis dessin centré
        const cx = d.x + d.w / 2;
        const cy = d.y + d.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(d.rotation * Math.PI / 180);
        ctx.drawImage(img, -d.w / 2, -d.h / 2, d.w, d.h);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = d.src;
    });
  }

  function drawTextEl(ctx, d) {
    ctx.save();
    // Centre approx : on calcule la largeur pour translater au centre
    const fontWeight = d.bold ? "900" : "400";
    ctx.font = `${fontWeight} ${d.size}px ${d.font}`;
    ctx.textBaseline = "top";
    const metrics = ctx.measureText(d.text);
    const textW = metrics.width;
    // Hauteur approximative
    const textH = d.size * 1.1;
    const cx = d.x + textW / 2;
    const cy = d.y + textH / 2;
    ctx.translate(cx, cy);
    ctx.rotate(d.rotation * Math.PI / 180);

    // Ombre (si activée)
    if (d.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Contour : on dessine plusieurs fois en décalé
    ctx.lineWidth = Math.max(2, d.size / 12);
    ctx.strokeStyle = d.stroke;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(d.text, -textW / 2, -textH / 2);

    // Désactiver l'ombre pour le fill (sinon double application)
    ctx.shadowColor = "transparent";
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, -textW / 2, -textH / 2);

    ctx.restore();
  }

  // ---- Sauvegarde (appelée depuis le bouton "Enregistrer") ----
  async function save() {
    if (!currentPhotoKey) return;
    const photo = photoStore[currentPhotoKey];
    if (!photo) return;

    const canvas = await exportAnnotated();
    const dataUrl = canvas.toDataURL("image/png");

    // Convertir le dataURL en Uint8Array pour docx
    const u8 = await dataUrlToUint8Array(dataUrl);

    // Conserver l'original pour permettre de réannoter sans perte
    if (!photo.originalDataUrl) photo.originalDataUrl = photo.dataUrl;

    // Mettre à jour le photoStore
    photo.data = u8;
    photo.type = "png";
    photo.dataUrl = dataUrl;
    photo.annotated = true;

    // Mettre à jour l'aperçu dans le formulaire
    const prev = document.getElementById("preview_" + currentPhotoKey);
    if (prev) {
      prev.src = dataUrl;
      prev.classList.add("shown");
    }

    close();
  }

  // ---- Helpers ----
  function uid() {
    return "el_" + Math.random().toString(36).slice(2, 9);
  }

  async function dataUrlToUint8Array(dataUrl) {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  // ---- Init au DOMContentLoaded ----
  function init() {
    initThumbnails();
    setupStageClick();
    setupKeyboard();

    // Boutons "Ajouter" assets
    document.querySelectorAll("[data-add-asset]").forEach(btn => {
      btn.addEventListener("click", () => addAsset(btn.dataset.addAsset));
    });

    // Bouton "Ajouter texte"
    document.getElementById("btnAddText").addEventListener("click", addText);

    // Aperçu live
    ["textInput","textFont","textSize","textColor","textStroke","textBold","textShadow"].forEach(id => {
      document.getElementById(id).addEventListener("input", updateTextPreview);
    });

    // Swatches couleur
    document.querySelectorAll(".swatch").forEach(s => {
      s.addEventListener("click", () => {
        document.getElementById("textColor").value = s.dataset.color;
        updateTextPreview();
      });
    });

    updateTextPreview();

    // Resize de la fenêtre → réajuster
    window.addEventListener("resize", () => {
      if (currentPhotoKey && stageW) {
        fitStage();
        // Réappliquer transform sur tous les éléments
        elements.forEach(it => {
          if (it.data.type === "text") {
            applyTextStyle(it.el, it.data);
          }
          applyTransform(it.el, it.data);
        });
      }
    });
  }

  return { init, open, close, save };
})();

// Exposer les fonctions appelées depuis le HTML
function closeEditor() { Editor.close(); }
function saveAnnotation() { Editor.save(); }

document.addEventListener("DOMContentLoaded", Editor.init);
