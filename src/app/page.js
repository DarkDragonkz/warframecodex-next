import Link from 'next/link';
import { IMG_BASE_URL } from '@/utils/constants';
import { HIERARCHY } from '@/utils/categoryConfig';
import { fetchGameData } from '@/utils/serverData';
import './homepage.css';

async function getCategoryCovers() {
    const dataSets = await Promise.all(
        HIERARCHY.map(cat => fetchGameData(cat.jsonFile))
    );

    return HIERARCHY.map((cat, index) => {
        const data = dataSets[index] || [];
        const targetItem = data.find(item => item?.name?.includes(cat.coverItem)) || 
                           data.find(item => item?.imageName);
        const imgUrl = targetItem?.imageName ? `${IMG_BASE_URL}/${targetItem.imageName}` : null;
        return { ...cat, imgUrl };
    });
}

function MacroCard({ cat }) {
    return (
        <Link href={`/${cat.id}`} style={{textDecoration:'none'}}>
            <div 
                className={`menu-card ${cat.id}`}
                style={{ '--card-color': cat.color, '--card-glow': `${cat.color}66` }}
            >
                <div className="card-visual-area">
                    {cat.imgUrl ? (
                        <img src={cat.imgUrl} alt={cat.title} className="card-img-element" />
                    ) : (
                        <div style={{background:'#151518', width:'100%', height:'100%'}}></div>
                    )}
                </div>
                
                <div className="card-content">
                    <h2 className="card-title">{cat.title}</h2>
                    <p className="card-sub">{cat.subtitle}</p>
                </div>
            </div>
        </Link>
    );
}

export default async function LandingPage() {
    const categories = await getCategoryCovers();

    return (
        <main className="landing-page">
            <div className="landing-content">
                <div className="landing-header">
                    <h1 className="landing-title">ORDIS CODEX</h1>
                    <div className="landing-subtitle">Tracker & Database System</div>
                </div>

                <div className="cards-scroll-container">
                    <div className="cards-row">
                        {categories.map((cat) => (
                            <MacroCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </div>
                
                <div className="landing-footer">
                    Operator Interface v3.0 // System Ready
                </div>
            </div>

            <nav className="mobile-bottom-nav">
                <Link href="/" className="mobile-bottom-link active">Home</Link>
                <Link href="/arsenal" className="mobile-bottom-link">Arsenal</Link>
                <Link href="/entities" className="mobile-bottom-link">Entities</Link>
                <Link href="/upgrades" className="mobile-bottom-link">Upgrades</Link>
            </nav>
        </main>
    );
}
