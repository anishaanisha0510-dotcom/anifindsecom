"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, ImageIcon, X, Save, RefreshCw } from "lucide-react";
import styles from "./manager.module.css";

const EMOJI_OPTIONS = ["💍","👗","👜","🎀","🧣","🌸","✨","💄","🎁","🛍","📿","🪬","🪮","🧸","💎"];

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "💍", imageBase64: "" });
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDocs(query(collection(db, "categories"), orderBy("createdAt", "desc")));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", emoji: "💍", imageBase64: "" });
    setImagePreview("");
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, emoji: cat.emoji || "💍", imageBase64: cat.imageBase64 || "" });
    setImagePreview(cat.imageBase64 || "");
    setShowForm(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Image must be under 500KB"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setImagePreview(ev.target.result);
      setForm(f => ({ ...f, imageBase64: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Category name is required"); return; }
    setSaving(true);
    try {
      const { doc, addDoc, updateDoc, collection, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const data = { name: form.name.trim(), emoji: form.emoji, imageBase64: form.imageBase64, updatedAt: new Date().toISOString() };
      if (editId) {
        await updateDoc(doc(db, "categories", editId), data);
      } else {
        await addDoc(collection(db, "categories"), { ...data, createdAt: new Date().toISOString() });
      }
      setShowForm(false);
      loadCategories();
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await deleteDoc(doc(db, "categories", id));
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Manage product categories shown on homepage</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={loadCategories}><RefreshCw size={14}/> Refresh</button>
          <button className={styles.addBtn} onClick={openAdd}><Plus size={16}/> Add Category</button>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>{editId ? "Edit Category" : "Add New Category"}</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}><X size={18}/></button>
            </div>

            {/* Image Upload */}
            <div className={styles.imageUploadArea}>
              {imagePreview ? (
                <div className={styles.imagePreviewWrap}>
                  <img src={imagePreview} alt="preview" className={styles.imagePreview}/>
                  <button className={styles.removeImg} onClick={() => { setImagePreview(""); setForm(f => ({...f, imageBase64:""})); fileRef.current.value=""; }}>
                    <X size={14}/> Remove
                  </button>
                </div>
              ) : (
                <button className={styles.uploadTrigger} onClick={() => fileRef.current.click()}>
                  <ImageIcon size={28} color="#e8527f"/>
                  <span>Upload Category Image</span>
                  <small>JPG/PNG · Max 500KB</small>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage}/>
            </div>

            <div className={styles.formField}>
              <label>Category Name *</label>
              <input type="text" placeholder="e.g. Earrings, Scrunchies..." value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={styles.input}/>
            </div>

            <div className={styles.formField}>
              <label>Emoji Icon</label>
              <div className={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(em => (
                  <button key={em} className={`${styles.emojiBtn} ${form.emoji === em ? styles.emojiActive : ""}`} onClick={() => setForm(f => ({...f, emoji: em}))}>{em}</button>
                ))}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : <><Save size={15}/> Save Category</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Grid */}
      {loading ? (
        <div className={styles.loadingState}><div className={styles.spinner}/><p>Loading categories...</p></div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyState}>
          <span style={{fontSize:56}}>🏷</span>
          <p>No categories yet. Add your first one!</p>
          <button className={styles.addBtn} onClick={openAdd}><Plus size={15}/> Add Category</button>
        </div>
      ) : (
        <div className={styles.categoryGrid}>
          {categories.map(cat => (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.catImageWrap}>
                {cat.imageBase64 ? (
                  <img src={cat.imageBase64} alt={cat.name} className={styles.catImage}/>
                ) : (
                  <div className={styles.catImagePlaceholder}>{cat.emoji || "💍"}</div>
                )}
              </div>
              <div className={styles.catInfo}>
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <p className={styles.catName}>{cat.name}</p>
              </div>
              <div className={styles.catActions}>
                <button className={styles.editBtn} onClick={() => openEdit(cat)}><Edit2 size={14}/></button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(cat.id, cat.name)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
