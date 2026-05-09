"use client";
import { useState, useEffect, useRef } from "react";
import { Save, ImageIcon, PlayCircle, Link2, X, CheckCircle, Eye, Trash2 } from "lucide-react";
import styles from "./manager.module.css";

/* ── YouTube URL → embed URL ── */
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    let videoId = u.searchParams.get("v");
    if (!videoId && u.hostname === "youtu.be") videoId = u.pathname.slice(1);
    if (!videoId && u.pathname.includes("/shorts/")) videoId = u.pathname.split("/shorts/")[1].split("?")[0];
    if (!videoId && u.pathname.includes("/embed/")) return url; // already embed
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
  } catch { return null; }
}

function MediaTypeBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      padding: "14px 10px", border: `2px solid ${active ? "#e8527f" : "#eee"}`,
      borderRadius: 12, background: active ? "#fff0f5" : "white",
      cursor: "pointer", transition: "all 0.2s",
    }}>
      <span style={{ color: active ? "#e8527f" : "#aaa" }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#e8527f" : "#aaa" }}>{label}</span>
    </button>
  );
}

export default function HeroBannerManager() {
  const [mediaType, setMediaType] = useState("image_url"); // "image_upload" | "image_url" | "youtube"
  const [imageBase64, setImageBase64] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Shop Now");
  const [ctaHref, setCtaHref] = useState("/products");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadHero(); }, []);

  const loadHero = async () => {
    setLoading(true);
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDoc(doc(db, "settings", "hero"));
      if (snap.exists()) {
        const d = snap.data();
        setMediaType(d.mediaType || "image_url");
        setImageBase64(d.imageBase64 || "");
        setImageUrl(d.imageUrl || "");
        setYoutubeUrl(d.youtubeUrl || "");
        setHeadline(d.headline || "");
        setSubtext(d.subtext || "");
        setCtaLabel(d.ctaLabel || "Shop Now");
        setCtaHref(d.ctaHref || "/products");
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => setImageBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveHero = async () => {
    setSaving(true); setSaved(false);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(doc(db, "settings", "hero"), {
        mediaType, imageBase64, imageUrl: imageUrl.trim(),
        youtubeUrl: youtubeUrl.trim(), headline, subtext, ctaLabel, ctaHref,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const clearMedia = () => { setImageBase64(""); setImageUrl(""); setYoutubeUrl(""); };

  // Compute what to actually display
  const activeMedia = mediaType === "image_upload" ? imageBase64
    : mediaType === "image_url" ? imageUrl.trim()
    : youtubeUrl.trim();

  const embedUrl = mediaType === "youtube" ? toYouTubeEmbed(youtubeUrl) : null;
  const isYoutubeValid = mediaType === "youtube" && !!embedUrl;
  const isImageValid = (mediaType === "image_url" && imageUrl.trim()) || (mediaType === "image_upload" && imageBase64);

  if (loading) return (
    <div className={styles.loadingState}><div className={styles.spinner}/><p>Loading hero settings...</p></div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className={styles.title}>Hero Banner</h1>
        <p className={styles.subtitle}>Customize the image or video shown on the store homepage hero section.</p>
      </div>

      {/* ── Media Type Selector ── */}
      <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 14 }}>Choose Media Type</p>
        <div style={{ display: "flex", gap: 12 }}>
          <MediaTypeBtn active={mediaType === "image_upload"} onClick={() => setMediaType("image_upload")} icon={<ImageIcon size={22}/>} label="Upload Image" />
          <MediaTypeBtn active={mediaType === "image_url"}    onClick={() => setMediaType("image_url")}    icon={<Link2 size={22}/>}     label="Image URL" />
          <MediaTypeBtn active={mediaType === "youtube"}      onClick={() => setMediaType("youtube")}      icon={<PlayCircle size={22}/>}   label="YouTube Video" />
        </div>
      </div>

      {/* ── Upload Image ── */}
      {mediaType === "image_upload" && (
        <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 14 }}>Upload Hero Image <span style={{color:"#aaa",fontWeight:400}}>(Max 2MB · JPG/PNG/WebP)</span></p>
          {imageBase64 ? (
            <div style={{ position: "relative" }}>
              <img src={imageBase64} alt="Hero preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10, border: "1px solid #f0e6ec" }}/>
              <button onClick={() => setImageBase64("")} style={{ position: "absolute", top: 8, right: 8, background: "#e8527f", color: "white", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14}/></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current.click()} style={{ width: "100%", height: 140, border: "2px dashed #f9a8c9", borderRadius: 10, background: "#fff8fb", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ImageIcon size={32} color="#e8527f"/>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e8527f" }}>Click to upload hero image</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>JPG, PNG, WebP · Max 2MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload}/>
        </div>
      )}

      {/* ── Image URL ── */}
      {mediaType === "image_url" && (
        <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 10 }}>Paste Image Link / URL</p>
          <p style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Use any direct image URL (Google Drive public link, Imgur, Cloudinary, etc.)</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" placeholder="https://example.com/your-banner-image.jpg"
              value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className={styles.input} style={{ flex: 1 }}/>
            {imageUrl && <button onClick={() => setImageUrl("")} style={{ background: "none", border: "1.5px solid #eee", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: "#aaa" }}><X size={14}/></button>}
          </div>
          {imageUrl.trim() && (
            <img src={imageUrl.trim()} alt="Preview" onError={e => e.target.style.display="none"}
              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginTop: 12, border: "1px solid #f0e6ec" }}/>
          )}
        </div>
      )}

      {/* ── YouTube Video ── */}
      {mediaType === "youtube" && (
        <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 10 }}>
            <PlayCircle size={16} color="#ff0000" style={{display:"inline",marginRight:6}}/> YouTube Video URL
          </p>
          <p style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Paste any YouTube video link — it will auto-play muted on the homepage.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX or https://youtu.be/..."
              value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
              className={styles.input} style={{ flex: 1 }}/>
            {youtubeUrl && <button onClick={() => setYoutubeUrl("")} style={{ background: "none", border: "1.5px solid #eee", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: "#aaa" }}><X size={14}/></button>}
          </div>
          {youtubeUrl && !isYoutubeValid && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>⚠️ Invalid YouTube URL. Try: youtube.com/watch?v=... or youtu.be/...</p>
          )}
          {isYoutubeValid && (
            <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid #f0e6ec" }}>
              <iframe src={embedUrl} width="100%" height="180" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen style={{ display: "block" }}/>
            </div>
          )}
        </div>
      )}

      {/* ── Headline + Text (optional) ── */}
      <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 14 }}>Hero Text & CTA <span style={{color:"#aaa",fontWeight:400}}>(optional — leave empty to keep default)</span></p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Headline</label>
            <input type="text" placeholder="e.g. Fashion Finds Under ₹299" value={headline} onChange={e => setHeadline(e.target.value)} className={styles.input}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Subtext</label>
            <input type="text" placeholder="e.g. New arrivals every week — free shipping above ₹999" value={subtext} onChange={e => setSubtext(e.target.value)} className={styles.input}/>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Button Label</label>
              <input type="text" placeholder="Shop Now" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} className={styles.input}/>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Button Link</label>
              <input type="text" placeholder="/products" value={ctaHref} onChange={e => setCtaHref(e.target.value)} className={styles.input}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Save Row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={saveHero} disabled={saving} className={styles.saveBtn} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saving ? <><div className={styles.spinnerSm}/> Saving...</> : <><Save size={16}/> Save Hero Banner</>}
        </button>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 600, fontSize: 14 }}>
            <CheckCircle size={16}/> Saved! Homepage hero updated.
          </div>
        )}
        {(isImageValid || isYoutubeValid) && (
          <button onClick={() => setPreview(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #f0e6ec", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13, color: "#888" }}>
            <Eye size={14}/> {preview ? "Hide" : "Preview"}
          </button>
        )}
      </div>

      {/* ── Live Preview ── */}
      {preview && (
        <div style={{ marginTop: 20, border: "2px dashed #f9a8c9", borderRadius: 16, overflow: "hidden" }}>
          <p style={{ background: "#fff0f5", padding: "8px 16px", fontSize: 12, color: "#e8527f", fontWeight: 700, margin: 0 }}>🖥 HOMEPAGE HERO PREVIEW</p>
          <div style={{ background: "linear-gradient(135deg,#fff8fb,#fce8f0)", padding: 24, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              {headline && <p style={{ fontSize: 11, letterSpacing: 2, color: "#e8527f", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>New Collection</p>}
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, color: "#1a1a2e", lineHeight: 1.3, marginBottom: 8 }}>{headline || "Fashion Finds Under ₹299"}</h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{subtext || "New arrivals every week"}</p>
              <span style={{ background: "#e8527f", color: "white", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700 }}>{ctaLabel || "Shop Now"} →</span>
            </div>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 340, borderRadius: 12, overflow: "hidden", border: "1px solid #f0e6ec" }}>
              {mediaType === "youtube" && embedUrl ? (
                <iframe src={embedUrl} width="100%" height="200" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen style={{ display: "block" }}/>
              ) : (
                <img src={mediaType === "image_upload" ? imageBase64 : imageUrl} alt="Hero" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} onError={e => e.target.style.display="none"}/>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
