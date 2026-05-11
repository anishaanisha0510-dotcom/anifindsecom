"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, ImageIcon, X, Save, Heart, RefreshCw, Palette, Ruler, Loader2 } from "lucide-react";
import styles from "./manager.module.css";
import { uploadToCloudinary } from "@/lib/cloudinary";

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "6", "7", "8", "9", "10"];
const COLOR_PRESETS = [
  { name: "Black",    hex: "#1a1a1a" },
  { name: "White",    hex: "#ffffff" },
  { name: "Red",      hex: "#ef4444" },
  { name: "Pink",     hex: "#f472b6" },
  { name: "Blue",     hex: "#3b82f6" },
  { name: "Green",    hex: "#22c55e" },
  { name: "Yellow",   hex: "#facc15" },
  { name: "Purple",   hex: "#a855f7" },
  { name: "Orange",   hex: "#f97316" },
  { name: "Brown",    hex: "#92400e" },
  { name: "Grey",     hex: "#9ca3af" },
  { name: "Beige",    hex: "#d4b896" },
];

function Toggle({ checked, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onChange}>
      <div style={{
        width: 44, height: 24, borderRadius: 24, background: checked ? "#e8527f" : "#e0e0e0",
        position: "relative", transition: "background 0.25s", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s", display: "block",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? "#e8527f" : "#888" }}>{label}</span>
    </div>
  );
}

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0); // tracks concurrent uploads
  const fileRef = useRef(null);

  // Color variant state
  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState([]); // [{name, hex}]
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#e8527f");

  // Size variant state
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState([]); // ["S","M","L"]
  const [customSize, setCustomSize] = useState("");

  const [tempUrl, setTempUrl] = useState("");

  const EMPTY_FORM = {
    title: "", description: "", category: "", price: "", offerPrice: "",
    stock: "10", images: [], emoji: "💍", isBestSeller: false, isNew: true,
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageTab, setImageTab] = useState("upload"); // "upload" | "url"

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const prodSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const catSnap = await getDocs(collection(db, "categories"));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resetVariants = () => {
    setHasColors(false); setColors([]);
    setHasSizes(false); setSizes([]);
    setCustomColorName(""); setCustomColorHex("#e8527f");
    setCustomSize("");
  };

  const openAdd = () => {
    setEditId(null); setForm(EMPTY_FORM);
    setTempUrl("");
    resetVariants(); setImageTab("upload"); setShowForm(true);
  };

  const openEdit = (prod) => {
    setEditId(prod.id);
    let initialImages = prod.images || [];
    if (initialImages.length === 0) {
      if (prod.imageBase64) initialImages.push(prod.imageBase64);
      if (prod.imageUrl) initialImages.push(prod.imageUrl);
    }
    setForm({
      title: prod.title || "", description: prod.description || "",
      category: prod.category || "", price: prod.price || "",
      offerPrice: prod.offerPrice || "", stock: prod.stock || "10",
      images: initialImages,
      emoji: prod.emoji || "💍",
      isBestSeller: prod.isBestSeller || false, isNew: prod.isNew || false,
    });
    setTempUrl("");
    setImageTab("upload");
    // Restore variants
    const savedColors = prod.colors || [];
    const savedSizes = prod.sizes || [];
    setHasColors(savedColors.length > 0);
    setColors(savedColors);
    setHasSizes(savedSizes.length > 0);
    setSizes(savedSizes);
    setCustomColorName(""); setCustomColorHex("#e8527f"); setCustomSize("");
    setShowForm(true);
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    if ((form.images || []).length >= 4) { alert("Maximum 4 images allowed per product"); return; }

    setUploadingCount(c => c + 1);
    try {
      const { url } = await uploadToCloudinary(file);
      setForm(f => ({ ...f, images: [...(f.images || []), url] }));
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      // If Cloudinary not yet configured, fall back to Base64 preview with a warning
      if (err.message?.includes("not configured")) {
        alert(
          "⚠️ Cloudinary is not set up yet.\n\n" +
          "To enable cloud image storage:\n" +
          "1. Sign up at cloudinary.com (free)\n" +
          "2. Create an unsigned upload preset\n" +
          "3. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local\n\n" +
          "Falling back to Base64 (for testing only — avoid on production)."
        );
        // Base64 fallback for local testing
        const reader = new FileReader();
        reader.onload = ev => {
          setForm(f => ({ ...f, images: [...(f.images || []), ev.target.result] }));
          if (fileRef.current) fileRef.current.value = "";
        };
        reader.readAsDataURL(file);
      } else {
        alert("Upload failed: " + err.message);
      }
    } finally {
      setUploadingCount(c => c - 1);
    }
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    await handleImage({ target: { files: [file] } });
  };

  const addUrlImage = () => {
    if (!tempUrl.trim()) return;
    if ((form.images || []).length >= 4) { alert("Maximum 4 images allowed per product"); return; }
    setForm(f => ({ ...f, images: [...(f.images || []), tempUrl.trim()] }));
    setTempUrl("");
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));
  };

  // ── Color helpers ──
  const addPresetColor = (c) => {
    if (!colors.find(x => x.hex === c.hex)) setColors(prev => [...prev, c]);
  };
  const addCustomColor = () => {
    const name = customColorName.trim() || customColorHex;
    if (!colors.find(x => x.hex === customColorHex)) setColors(prev => [...prev, { name, hex: customColorHex }]);
    setCustomColorName("");
  };
  const removeColor = (hex) => setColors(prev => prev.filter(c => c.hex !== hex));

  // ── Size helpers ──
  const toggleSize = (s) => setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addCustomSize = () => {
    const s = customSize.trim();
    if (s && !sizes.includes(s)) setSizes(prev => [...prev, s]);
    setCustomSize("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Product name is required"); return; }
    if (!form.price) { alert("Price is required"); return; }
    setSaving(true);
    try {
      const { doc, addDoc, updateDoc, collection } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        offerPrice: Number(form.offerPrice || form.price),
        stock: Number(form.stock),
        images: form.images || [],
        emoji: form.emoji,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
        colors: hasColors ? colors : [],
        sizes: hasSizes ? sizes : [],
        updatedAt: new Date().toISOString(),
      };
      if (editId) {
        // nullify old single image fields to clean up
        await updateDoc(doc(db, "products", editId), { ...data, imageBase64: null, imageUrl: null });
      } else {
        await addDoc(collection(db, "products"), { ...data, likes: 0, createdAt: new Date().toISOString() });
      }
      
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "cache"), { productsLastUpdated: Date.now() }, { merge: true });

      setShowForm(false);
      loadData();
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { doc, deleteDoc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await deleteDoc(doc(db, "products", id));
      await setDoc(doc(db, "settings", "cache"), { productsLastUpdated: Date.now() }, { merge: true });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>{products.length} products · manage your catalog</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={loadData}><RefreshCw size={14}/> Refresh</button>
          <button className={styles.addBtn} onClick={openAdd}><Plus size={16}/> Add Product</button>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>{editId ? "Edit Product" : "Add New Product"}</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}><X size={18}/></button>
            </div>

            {/* Image Upload / URL Tabs */}
            <div className={styles.imageUploadArea}>
              {/* Image count indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e8527f" }}>📸 Product Images</span>
                <span style={{ fontSize: 11, color: (form.images?.length || 0) >= 4 ? "#ef4444" : "#aaa", fontWeight: 600 }}>
                  {form.images?.length || 0}/4 {(form.images?.length || 0) >= 4 ? "— Max reached" : "images"}
                </span>
              </div>

              {/* Image thumbnails */}
              {form.images?.length > 0 && (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
                  {form.images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                      <img src={img} alt={`preview-${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: "2px solid #f0c4d4" }}/>
                      {idx === 0 && (
                        <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 9, fontWeight: 800, background: "rgba(232,82,127,0.85)", color: "white", textAlign: "center", borderRadius: "0 0 8px 8px", padding: "2px 0" }}>MAIN</span>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        style={{ position: "absolute", top: -8, right: -8, background: "#fff", border: "2px solid #f9a8c9", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#e8527f", padding: 0, fontSize: 14, fontWeight: 700, zIndex: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab selector + upload area */}
              {(!form.images || form.images.length < 4) ? (
                <>
                  {/* Tab selector */}
                  <div style={{ display: "flex", gap: 0, marginBottom: 12, border: "1.5px solid #f0e6ec", borderRadius: 10, overflow: "hidden" }}>
                    {[["upload", "📁 Upload File"], ["url", "🔗 Image URL"]].map(([tab, label]) => (
                      <button key={tab} onClick={() => setImageTab(tab)} style={{
                        flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                        background: imageTab === tab ? "#e8527f" : "white",
                        color: imageTab === tab ? "white" : "#888",
                        transition: "all 0.2s",
                      }}>{label}</button>
                    ))}
                  </div>

                  {/* Upload tab — drag & drop + click */}
                  {imageTab === "upload" && (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleImageDrop}
                    >
                      <button
                        className={styles.uploadTrigger}
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadingCount > 0}
                        style={{ opacity: uploadingCount > 0 ? 0.7 : 1 }}
                      >
                        {uploadingCount > 0 ? (
                          <>
                            <Loader2 size={32} color="#e8527f" style={{ animation: "spin 1s linear infinite" }}/>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#e8527f" }}>Uploading to Cloudinary…</span>
                            <small>Please wait</small>
                          </>
                        ) : (
                          <>
                            <ImageIcon size={32} color="#e8527f"/>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Click or drag &amp; drop to upload</span>
                            <span style={{ fontSize: 13, color: "#888" }}>({form.images?.length || 0}/4 added) — saved to Cloudinary CDN</span>
                            <small>JPG · PNG · WebP · Max 5MB per image</small>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* URL tab */}
                  {imageTab === "url" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="url"
                          placeholder="https://example.com/product-image.jpg"
                          value={tempUrl}
                          onChange={e => setTempUrl(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addUrlImage()}
                          className={styles.input}
                          style={{ flex: 1 }}
                        />
                        <button
                          onClick={addUrlImage}
                          style={{ background: "#e8527f", color: "white", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
                        >+ Add URL</button>
                      </div>
                      <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>Paste a direct image link (Imgur, Cloudinary, Firebase Storage, Google Drive public, etc.)</p>
                    </div>
                  )}

                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage}/>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 12, color: "#e8527f", fontWeight: 600 }}>
                  ✅ All 4 image slots filled. Remove one to add another.
                </div>
              )}
            </div>

            {/* Name + Emoji */}
            <div className={styles.formRow}>
              <div className={styles.formField} style={{flex:1}}>
                <label>Product Name *</label>
                <input type="text" placeholder="e.g. Pearl Drop Earrings" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={styles.input}/>
              </div>
              <div className={styles.formField} style={{width:80}}>
                <label>Emoji</label>
                <input type="text" value={form.emoji} onChange={e => setForm(f => ({...f, emoji: e.target.value}))} className={styles.input} style={{textAlign:"center", fontSize:22}}/>
              </div>
            </div>

            {/* Description */}
            <div className={styles.formField}>
              <label>Description</label>
              <textarea placeholder="Short product description..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={styles.textarea} rows={2}/>
            </div>

            {/* Category + Stock */}
            <div className={styles.formRow}>
              <div className={styles.formField} style={{flex:1}}>
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={styles.select}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div className={styles.formField} style={{flex:1}}>
                <label>Stock</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} className={styles.input}/>
              </div>
            </div>

            {/* Price */}
            <div className={styles.formRow}>
              <div className={styles.formField} style={{flex:1}}>
                <label>MRP Price (₹) *</label>
                <input type="number" placeholder="499" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className={styles.input}/>
              </div>
              <div className={styles.formField} style={{flex:1}}>
                <label>Offer Price (₹)</label>
                <input type="number" placeholder="349" value={form.offerPrice} onChange={e => setForm(f => ({...f, offerPrice: e.target.value}))} className={styles.input}/>
              </div>
            </div>

            {/* Checkboxes */}
            <div className={styles.formRow} style={{gap:20}}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.isBestSeller} onChange={e => setForm(f => ({...f, isBestSeller: e.target.checked}))}/> ⭐ Best Seller
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.isNew} onChange={e => setForm(f => ({...f, isNew: e.target.checked}))}/> 🆕 New Arrival
              </label>
            </div>

            {/* ── COLOUR VARIANTS ── */}
            <div style={{ border: "1.5px solid #f0e6ec", borderRadius: 12, padding: 14, marginTop: 14 }}>
              <Toggle checked={hasColors} onChange={() => { setHasColors(v => !v); if (hasColors) setColors([]); }} label="This product has Colour variants" />
              {hasColors && (
                <div style={{ marginTop: 14 }}>
                  {/* Preset swatches */}
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Quick add:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {COLOR_PRESETS.map(c => (
                      <button key={c.hex} onClick={() => addPresetColor(c)} title={c.name}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: colors.find(x=>x.hex===c.hex) ? "2.5px solid #e8527f" : "2px solid #ddd",
                          background: c.hex, cursor: "pointer", transition: "transform 0.1s",
                          boxShadow: colors.find(x=>x.hex===c.hex) ? "0 0 0 3px #fce8f0" : "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Custom colour */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input type="color" value={customColorHex} onChange={e => setCustomColorHex(e.target.value)}
                      style={{ width: 36, height: 36, border: "none", borderRadius: 8, cursor: "pointer", padding: 2 }}/>
                    <input type="text" placeholder="Colour name (e.g. Rose Gold)" value={customColorName}
                      onChange={e => setCustomColorName(e.target.value)} className={styles.input} style={{ flex: 1 }}/>
                    <button onClick={addCustomColor} style={{ background: "#e8527f", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add</button>
                  </div>

                  {/* Selected colours */}
                  {colors.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Selected ({colors.length}):</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {colors.map(c => (
                          <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff8fb", border: "1.5px solid #f9a8c9", borderRadius: 20, padding: "4px 10px 4px 6px" }}>
                            <span style={{ width: 16, height: 16, borderRadius: "50%", background: c.hex, border: "1.5px solid #eee", display: "inline-block" }}/>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                            <button onClick={() => removeColor(c.hex)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#e8527f" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SIZE VARIANTS ── */}
            <div style={{ border: "1.5px solid #f0e6ec", borderRadius: 12, padding: 14, marginTop: 12 }}>
              <Toggle checked={hasSizes} onChange={() => { setHasSizes(v => !v); if (hasSizes) setSizes([]); }} label="This product has Size variants" />
              {hasSizes && (
                <div style={{ marginTop: 14 }}>
                  {/* Preset sizes */}
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Quick add:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {SIZE_PRESETS.map(s => (
                      <button key={s} onClick={() => toggleSize(s)}
                        style={{
                          padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
                          borderColor: sizes.includes(s) ? "#e8527f" : "#e0e0e0",
                          background: sizes.includes(s) ? "#fff0f5" : "white",
                          color: sizes.includes(s) ? "#e8527f" : "#555",
                          fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >{s}</button>
                    ))}
                  </div>

                  {/* Custom size */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input type="text" placeholder="Custom size (e.g. 32, UK7, One Size...)" value={customSize}
                      onChange={e => setCustomSize(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomSize()}
                      className={styles.input} style={{ flex: 1 }}/>
                    <button onClick={addCustomSize} style={{ background: "#e8527f", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Add</button>
                  </div>

                  {/* Selected sizes */}
                  {sizes.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Selected ({sizes.length}):</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {sizes.map(s => (
                          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff8fb", border: "1.5px solid #f9a8c9", borderRadius: 20, padding: "4px 10px" }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{s}</span>
                            <button onClick={() => setSizes(prev => prev.filter(x => x !== s))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#e8527f" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : <><Save size={15}/> Save Product</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className={styles.loadingState}><div className={styles.spinner}/><p>Loading products...</p></div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <span style={{fontSize:56}}>📦</span>
          <p>No products yet. Add your first product!</p>
          <button className={styles.addBtn} onClick={openAdd}><Plus size={15}/> Add Product</button>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {products.map(prod => {
            const discount = prod.price && prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : 0;
            return (
              <div key={prod.id} className={styles.productCard}>
                <div className={styles.prodImageWrap}>
                  {prod.images?.length > 0 ? (
                    <img src={prod.images[0]} alt={prod.title} className={styles.prodImage} loading="lazy" onError={e => e.target.style.display="none"}/>
                  ) : (prod.imageBase64 || prod.imageUrl) ? (
                    <img src={prod.imageBase64 || prod.imageUrl} alt={prod.title} className={styles.prodImage} loading="lazy" onError={e => e.target.style.display="none"}/>
                  ) : (
                    <div className={styles.prodImagePlaceholder}>{prod.emoji || "💍"}</div>
                  )}
                  {prod.isBestSeller && <span className={styles.badge} style={{background:"#fbbf24",color:"#78350f"}}>⭐ Best</span>}
                  {prod.isNew && <span className={styles.badge} style={{background:"#e8527f",color:"white",top:8,right:8}}>New</span>}
                  <div className={styles.likeCount}><Heart size={12} fill="#e8527f" color="#e8527f"/> {prod.likes || 0}</div>
                </div>
                <div className={styles.prodInfo}>
                  <p className={styles.prodCategory}>{prod.emoji} {prod.category || "—"}</p>
                  <p className={styles.prodTitle}>{prod.title}</p>
                  <div className={styles.prodPricing}>
                    <span className={styles.prodOffer}>₹{prod.offerPrice || prod.price}</span>
                    {discount > 0 && <span className={styles.prodMrp}>₹{prod.price}</span>}
                    {discount > 0 && <span className={styles.discountTag}>{discount}% off</span>}
                  </div>
                  {/* Colour swatches preview */}
                  {prod.colors?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Palette size={11} color="#aaa"/>
                      {prod.colors.map(c => (
                        <span key={c.hex} title={c.name} style={{ width: 14, height: 14, borderRadius: "50%", background: c.hex, border: "1.5px solid #ddd", display: "inline-block" }}/>
                      ))}
                    </div>
                  )}
                  {/* Size tags preview */}
                  {prod.sizes?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                      <Ruler size={11} color="#aaa"/>
                      {prod.sizes.slice(0, 5).map(s => (
                        <span key={s} style={{ fontSize: 10, fontWeight: 700, background: "#f9f0f4", borderRadius: 4, padding: "1px 5px", color: "#888" }}>{s}</span>
                      ))}
                      {prod.sizes.length > 5 && <span style={{ fontSize: 10, color: "#aaa" }}>+{prod.sizes.length - 5}</span>}
                    </div>
                  )}
                  <div className={styles.stockRow}>
                    <span className={prod.stock <= 5 ? styles.stockLow : styles.stockOk}>
                      {prod.stock <= 0 ? "Out of stock" : prod.stock <= 5 ? `Only ${prod.stock} left` : `${prod.stock} in stock`}
                    </span>
                  </div>
                </div>
                <div className={styles.prodActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(prod)}><Edit2 size={14}/> Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(prod.id, prod.title)}><Trash2 size={14}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
