import { Edit2, ExternalLink, Camera, PlayCircle, Music, ChevronRight } from "lucide-react";
import type { BrandCentreData } from "../types";

interface BrandDNAProps {
  data: BrandCentreData;
}

export function BrandDNA({ data }: BrandDNAProps) {
  return (
    <div className="aurora-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Brand DNA</h2>
      </div>
      
      <div style={{ padding: '24px' }}>
        {/* Section 1: Brand Profile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderBottom: '1px solid var(--border-default)', paddingBottom: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Profile</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="aurora-header__btn" style={{ width: '32px', height: '32px' }}><Edit2 size={14} /></button>
                <button className="aurora-header__btn" style={{ width: '32px', height: '32px' }}><ExternalLink size={14} /></button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--surface-page)', border: '1px solid var(--border-default)', marginBottom: '16px', overflow: 'hidden' }}>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKcy-KoZVFLh85JQKH-sOHpiCnLJhMI3EuQwKzqYgPpH_YXCtQYK3dTKLEXZFlDiLG_V8_7uOvtMvcw6tE_vmRvvrFbAwFeEopbwtniXzVxJD5ksgtm0jKe7YBpC_GVXQc1OOOUcdxTTLt5_pnzSRUweD9BPJHKGAsBzfm1w4FsRdR8CisL8v2_oVZhsTIas1EVtLjazkK7R7S_N5DDIVEy-J3FUoocpTjlOxa0by-8GZmZwDeSPlgcZeR-lOdOi4u4YPyPZgkNOs" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>{data.brandName}</h4>
              <a href={`https://${data.website}`} style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600, textDecoration: 'none', marginBottom: '12px' }}>{data.website}</a>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                <Camera size={20} />
                <PlayCircle size={20} />
                <Music size={20} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '24px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Market Setup</p>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{data.marketSetup}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Industry</p>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{data.industry}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Lifecycle Stage</p>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{data.lifecycleStage}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Brand Narrative */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '32px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Narrative</h3>
          <div style={{ maxWidth: '800px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>"{data.narrativeTitle}"</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>{data.narrativeDescription}</p>
            <button style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              View More Details <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Section 3: Aesthetics & Audience */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aesthetics & Audience</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Visual Identity</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {data.colors.map(color => (
                  <div key={color} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-default)', background: color }}></div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.fonts.map(font => (
                  <div key={font} style={{ background: 'var(--surface-page)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>{font}</div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Tone & Presence</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Educational', 'Direct', 'Minimalist'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.2)' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Core Personas</p>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }}>
                {data.personas.map(persona => (
                  <div key={persona.name} style={{ minWidth: '200px', display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid var(--border-default)', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img src={persona.imageUrl} alt={persona.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{persona.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
