import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMacroCategory, HIERARCHY } from '@/utils/categoryConfig'; 
import { fetchGameData } from '@/utils/serverData';
import { IMG_BASE_URL } from '@/utils/constants';
import '@/app/homepage.css'; 

// --- FIX: QUESTA FUNZIONE È OBBLIGATORIA PER L'EXPORT STATICO ---
export async function generateStaticParams() {
    // Genera una pagina per ogni ID nella HIERARCHY (es: /arsenal, /entities, etc.)
    return HIERARCHY.map(macro => ({
        macroCategory: macro.id
    }));
}

export default async function MacroCategoryPage({ params }) {
    const resolvedParams = await params;
    const category = getMacroCategory(resolvedParams.macroCategory);

    if (!category) return notFound();

    return (
        <main className="landing-page">
            <div className="landing-content">
                <div className="landing-header">
                    <Link href="/" style={{textDecoration:'none', color:'#666', fontSize:'12px', marginBottom:'10px', display:'block'}}>
                        &larr; BACK TO HUB
                    </Link>
                    <h1 className="landing-title" style={{color: category.color}}>
                        {category.title}
                    </h1>
                    <div className="landing-subtitle">{category.subtitle}</div>
                </div>

                <div className="cards-scroll-container">
                    <div className="cards-row">
                        {category.items.map((micro) => (
                            <MicroCard key={micro.id} micro={micro} color={category.color} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

// Componente Card per le Micro Categorie
async function MicroCard({ micro, color }) {
    const data = await fetchGameData(micro.json);
    
    // Trova immagine rappresentativa
    const targetItem = data.find(i => 
        (micro.filter ? micro.filter(i) : true) && 
        i.imageName && 
        !i.imageName.includes("fanart")
    );
    
    const imgUrl = targetItem ? `${IMG_BASE_URL}/${targetItem.imageName}` : null;

    return (
        <Link href={`/list/${micro.id}`} style={{textDecoration:'none'}}>
            <div 
                className="menu-card"
                style={{ '--card-color': color, '--card-glow': `${color}66`, width: '180px', height: '260px' }}
            >
                <div className="card-visual-area">
                    {imgUrl ? (
                        <img src={imgUrl} alt={micro.title} className="card-img-element" />
                    ) : (
                        <div style={{background:'#222', width:'100%', height:'100%'}}></div>
                    )}
                </div>
                
                <div className="card-content">
                    <h2 className="card-title" style={{fontSize:'18px'}}>{micro.title}</h2>
                    <p className="card-sub">BROWSE COLLECTION</p>
                </div>
            </div>
        </Link>
    );
}