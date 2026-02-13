import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc
} from 'firebase/firestore';
import { 
  ChevronRight, 
  ChevronLeft,
  Globe, 
  Beef, 
  Drumstick, 
  Container, 
  Apple, 
  Croissant, 
  Fish,
  Settings,
  Lock,
  Save,
  X,
  Image as ImageIcon,
  FileText,
  Home
} from 'lucide-react';

// --- ROBUST FIREBASE INITIALIZATION ---
const getFirebaseInstance = () => {
  try {
    if (typeof __firebase_config !== 'undefined') {
      const config = JSON.parse(__firebase_config);
      if (config && config.projectId && config.projectId !== "placeholder") {
        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        return {
          db: getFirestore(app),
          auth: getAuth(app),
          isOffline: false
        };
      }
    }
  } catch (e) {
    console.log("Running in local/offline mode.");
  }
  return { db: null, auth: null, isOffline: true };
};

const { db, auth, isOffline } = getFirebaseInstance();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'grocery-catalog-demo';
const ADMIN_PASSWORD = "admin123";

const ICON_MAP = {
  beef: <Beef />,
  chicken: <Drumstick />,
  canned: <Container />,
  produce: <Apple />,
  bakery: <Croissant />,
  seafood: <Fish />
};

const DEFAULT_CATEGORIES = [
  { id: 'beef', nameEn: 'Beef & Steak', nameEs: 'Res y Carne', img: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400', pdf: '/beef.pdf' },
  { id: 'chicken', nameEn: 'Poultry & Chicken', nameEs: 'Pollo y Aves', img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400', pdf: '/chicken.pdf' },
  { id: 'canned', nameEn: 'Canned Items', nameEs: 'Artículos Enlatados', img: 'https://images.unsplash.com/photo-1584263343327-cc4628614d44?w=400', pdf: '/beef.pdf' },
  { id: 'produce', nameEn: 'Fresh Produce', nameEs: 'Frutas y Verduras', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', pdf: '/beef.pdf' },
  { id: 'bakery', nameEn: 'Bakery & Bread', nameEs: 'Panadería', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', pdf: '/beef.pdf' },
  { id: 'seafood', nameEn: 'Fresh Seafood', nameEs: 'Mariscos Frescos', img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400', pdf: '/beef.pdf' },
];

const Navigation = ({ lang, setLang, onHome }) => (
  <div className="flex justify-between items-center mb-8 md:mb-12">
    <div onClick={onHome} className="cursor-pointer group relative">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 transition-all group-hover:scale-110 group-hover:bg-blue-500">
        <Home size={28} />
      </div>
    </div>
    <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="bg-white px-5 py-2.5 rounded-full border border-slate-200 font-bold text-sm shadow-sm hover:shadow-md flex items-center gap-2 transition-all">
      <Globe size={16} className="text-blue-600" />
      {lang === 'en' ? 'ENGLISH' : 'ESPAÑOL'}
    </button>
  </div>
);

const PDFViewerPage = ({ category, lang }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const totalPages = 5; 

  const isLocalFile = category.pdf.startsWith('/');
  
  // For local files, we use the standard path. 
  // For external files, we use Google Docs Viewer.
  const finalUrl = isLocalFile 
    ? `${category.pdf}#page=${pageNumber}` 
    : `https://docs.google.com/viewer?url=${encodeURIComponent(category.pdf)}&embedded=true#page=${pageNumber}`;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
            {lang === 'en' ? category.nameEn : category.nameEs}
          </h2>
          <p className="text-slate-500 font-medium mt-1">{lang === 'en' ? 'Digital Catalog' : 'Catálogo Digital'}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-3 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-blue-600 transition-colors"><ChevronLeft size={24} /></button>
          <span className="px-4 font-black text-slate-700 min-w-[100px] text-center text-sm">{lang === 'en' ? 'PAGE' : 'PÁGINA'} {pageNumber} / {totalPages}</span>
          <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => p + 1)} className="p-3 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-blue-600 transition-colors"><ChevronRight size={24} /></button>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative">
        {/* CHANGED: Using <embed> for local files often prevents the auto-download bug in Chrome */}
        {isLocalFile ? (
          <embed 
            key={finalUrl} 
            src={finalUrl} 
            type="application/pdf"
            className="w-full h-full border-none rounded-[2.5rem]"
          />
        ) : (
          <iframe 
            key={finalUrl} 
            src={finalUrl} 
            className="w-full h-full border-none" 
            title="PDF Viewer" 
          />
        )}
        
        {isLocalFile && (
           <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-200 pointer-events-none">
             Local Test Mode
           </div>
        )}
      </div>
    </div>
  );
};

const AdminPortal = ({ categories, onSave, onExit }) => {
  const [editingData, setEditingData] = useState(categories);
  const updateField = (id, field, value) => setEditingData(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900"><Settings className="text-blue-600" /> Catalog Manager</h1>
          <button onClick={onExit} className="px-6 py-2 bg-white border rounded-xl font-bold shadow-sm hover:bg-slate-50">Exit</button>
        </div>
        <div className="grid gap-6">
          {editingData.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 grid md:grid-cols-2 gap-6 hover:border-blue-200 transition-colors">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Names (EN / ES)</label>
                <input type="text" value={cat.nameEn} onChange={(e) => updateField(cat.id, 'nameEn', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="English Name" />
                <input type="text" value={cat.nameEs} onChange={(e) => updateField(cat.id, 'nameEs', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Spanish Name" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Links (Image / PDF)</label>
                <input type="text" value={cat.img} onChange={(e) => updateField(cat.id, 'img', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-blue-600 text-sm font-mono" placeholder="Image URL" />
                <input type="text" value={cat.pdf} onChange={(e) => updateField(cat.id, 'pdf', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-red-600 text-sm font-mono" placeholder="PDF URL (/filename.pdf)" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onSave(editingData)} className="w-full mt-12 bg-blue-600 text-white font-black py-5 rounded-[2.5rem] shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg">
          <Save size={24} /> Save Changes {isOffline && "(Demo Mode)"}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(isOffline ? { uid: 'offline' } : null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(!isOffline);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [passInput, setPassInput] = useState("");

  useEffect(() => {
    if (isOffline) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { setLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOffline || !user) { setLoading(false); return; }
    const categoriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'categories');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_CATEGORIES.forEach(async (cat) => await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', cat.id), cat));
      } else {
        const data = snapshot.docs.map(doc => doc.data());
        setCategories(data.sort((a,b) => a.id.localeCompare(b.id)));
        setLoading(false);
      }
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [user]);

  const handleAdminAccess = () => {
    if (passInput === ADMIN_PASSWORD) {
      setView('admin');
      setShowLogin(false);
      setPassInput("");
    } else { alert("Incorrect password"); }
  };

  const handleSave = async (newData) => {
    if (isOffline) { setCategories(newData); setView('home'); return; }
    try {
      await Promise.all(newData.map(cat => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', cat.id), cat)));
      setView('home');
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (view === 'admin') return <AdminPortal categories={categories} onExit={() => setView('home')} onSave={handleSave} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Navigation lang={lang} setLang={setLang} onHome={() => setSelectedCategory(null)} />

        {!selectedCategory ? (
          <>
            <div className="text-center mb-16 md:mb-24 max-w-2xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight text-slate-900">
                {lang === 'en' ? 'Quality choice.' : 'Calidad seleccionada.'}
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium px-4">
                {lang === 'en' ? 'Select a digital catalog to view this week\'s exclusive deals.' : 'Seleccione un catálogo digital para ver las ofertas exclusivas.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {categories.map((cat) => (
                <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="group cursor-pointer bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <div className="h-64 overflow-hidden relative">
                    <img src={cat.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {React.cloneElement(ICON_MAP[cat.id] || <FileText />, { size: 20 })}
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{lang === 'en' ? cat.nameEn : cat.nameEs}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                       <span className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors tracking-widest uppercase">View Catalog</span>
                       <ChevronRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <PDFViewerPage category={selectedCategory} lang={lang} />
        )}

        <footer className="mt-32 text-center pb-12 opacity-20 hover:opacity-100 transition-opacity">
          <button onClick={() => setShowLogin(true)} className="p-4"><Lock size={14} /></button>
        </footer>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-50 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">Admin Access</h3>
              <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-2xl mb-6 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()} autoFocus />
            <button onClick={handleAdminAccess} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all active:scale-95">Unlock Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}