"use client";
import { useState, useEffect } from 'react';

export default function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTab, setActiveTab] = useState('protocol'); // 'protocol' or 'messages'
  const [activeSection, setActiveSection] = useState('hero');
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [portfolioRes, messagesRes] = await Promise.all([
          fetch('/api/portfolio'),
          fetch('/api/messages')
        ]);
        const portfolioData = await portfolioRes.json();
        const messagesData = await messagesRes.json();
        setData(portfolioData);
        setMessages(messagesData);
      } catch (err) {
        console.error("Failed to boot system", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Default key is asrar2026 if no env var is set
    const validKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'asrar2026';
    if (adminKey === validKey) {
      setIsAuthorized(true);
    } else {
      setStatusMsg('ACCESS_DENIED: INVALID_PROTO_KEY');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setStatusMsg('PROTOCOL UPDATED SUCCESSFULLY');
      } else {
        setStatusMsg('ERROR: TRANSMISSION FAILED');
      }
    } catch (e) {
      setStatusMsg('ERROR: ' + e.message);
    }
    setSaving(false);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const updateData = (path, value) => {
    const newData = { ...data };
    const parts = path.split('.');
    let current = newData;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    setData(newData);
  };

  const addItem = (listPath, template) => {
    const newData = { ...data };
    const parts = listPath.split('.');
    let current = newData;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = [...current[parts[parts.length - 1]], template];
    setData(newData);
  }

  const removeItem = (listPath, index) => {
    const newData = { ...data };
    const parts = listPath.split('.');
    let current = newData;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = current[parts[parts.length - 1]].filter((_, i) => i !== index);
    setData(newData);
  }
  const handleFileUpload = async (e, path) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatusMsg('UPLOAD_IN_PROGRESS...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        updateData(path, result.url);
        setStatusMsg('FILE_UPLOAD_SUCCESS');
      } else {
        setStatusMsg('UPLOAD_FAILED: ' + (result.error || 'UNKNOWN_ERROR'));
      }
    } catch (err) {
      setStatusMsg('UPLOAD_ERROR: ' + err.message);
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (loading) return (
    <div style={{ background: '#020408', color: '#00f5ff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron' }}>
      ACCESSING CORE SYSTEM...
    </div>
  );

  if (!isAuthorized) {
    return (
      <div style={{ background: '#020408', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#c8e8ff' }}>
        <h1 style={{ fontFamily: 'Orbitron', color: '#00f5ff', letterSpacing: '4px' }}>ADMIN.OS LOGIN</h1>
        <form onSubmit={handleLogin} style={{ marginTop: '30px', textAlign: 'center' }}>
          <input
            type="password"
            placeholder="ENTER_PROTO_KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ background: 'transparent', border: '1px solid #00f5ff', color: '#fff', padding: '12px 20px', fontFamily: 'Share Tech Mono', outline: 'none', textAlign: 'center' }}
          />
          <button type="submit" style={{ display: 'block', margin: '20px auto', background: '#00f5ff', border: 'none', color: '#020408', padding: '10px 30px', fontFamily: 'Orbitron', fontWeight: 700, cursor: 'pointer' }}>INITIATE_AUTH</button>
        </form>
        {statusMsg && <p style={{ color: '#ff0055', fontSize: '12px' }}>{statusMsg}</p>}
      </div>
    );
  }

  const SectionNav = ({ id, label }) => (
    <button
      onClick={() => setActiveSection(id)}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 20px', background: activeSection === id ? 'rgba(0,245,255,0.1)' : 'transparent',
        border: 'none', borderLeft: activeSection === id ? '2px solid #00f5ff' : '2px solid transparent',
        color: activeSection === id ? '#00f5ff' : '#c8e8ff', fontFamily: 'Share Tech Mono', cursor: 'pointer', transition: 'all 0.3s'
      }}
    >
      {label}
    </button>
  );

  const InputGroup = ({ label, value, onChange, type = "text", textarea = false, onFileUpload = null, uniqueKey = "" }) => {
    const fieldId = `file_up_${label.replace(/\s+/g, '_')}_${uniqueKey}`;
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#00f5ff', fontSize: '11px', marginBottom: '8px', letterSpacing: '2px' }}>{label.toUpperCase()}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {textarea ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,245,255,0.2)', color: '#fff', padding: '12px', fontFamily: 'Rajdhani', outline: 'none', height: '100px', resize: 'vertical' }}
            />
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,245,255,0.2)', color: '#fff', padding: '12px', fontFamily: 'Rajdhani', outline: 'none' }}
            />
          )}
          {onFileUpload && (
            <div style={{ position: 'relative' }}>
              <button
                style={{ padding: '0 15px', background: 'rgba(0,245,255,0.1)', border: '1px solid #00f5ff', color: '#00f5ff', height: '100%', fontFamily: 'Orbitron', fontSize: '10px', cursor: 'pointer' }}
                onClick={() => document.getElementById(fieldId).click()}
              >
                UPLOAD_IMAGE
              </button>
              <input
                id={fieldId}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileUpload}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#020408', minHeight: '100vh', color: '#c8e8ff', fontFamily: 'Share Tech Mono, monospace' }}>
      {/* HEADER */}
      <nav style={{ padding: '20px 40px', borderBottom: '1px solid rgba(0,245,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2,4,8,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ fontFamily: 'Orbitron', color: '#00f5ff', fontSize: '18px', letterSpacing: '4px', margin: 0 }}>ADMIN.OS</h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('protocol')}
              style={{
                background: 'transparent', border: 'none', color: activeTab === 'protocol' ? '#00f5ff' : '#dim', fontFamily: 'Share Tech Mono', cursor: 'pointer', padding: '10px',
                borderBottom: activeTab === 'protocol' ? '2px solid #00f5ff' : 'none'
              }}
            >
              PROJECT PROTOCOL
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                background: 'transparent', border: 'none', color: activeTab === 'messages' ? '#00f5ff' : '#dim', fontFamily: 'Share Tech Mono', cursor: 'pointer', padding: '10px',
                borderBottom: activeTab === 'messages' ? '2px solid #00f5ff' : 'none',
                position: 'relative'
              }}
            >
              MESSAGES {messages.length > 0 && <span style={{ fontSize: '10px', background: '#ff0055', color: '#fff', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' }}>{messages.length}</span>}
            </button>
          </div>
        </div>

        {activeTab === 'protocol' && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #0066ff, #00f5ff)',
              border: 'none', padding: '10px 24px', fontFamily: 'Orbitron', fontWeight: '700', cursor: 'pointer', color: '#020408',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)', opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'SYNCING...' : 'SAVE CHANGES'}
          </button>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ padding: '0', maxWidth: '1400px', margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 80px)' }}>

        {activeTab === 'protocol' && (
          <aside style={{ width: '250px', borderRight: '1px solid rgba(0,245,255,0.1)', padding: '20px 0', background: 'rgba(2,4,8,0.4)' }}>
            <SectionNav id="hero" label="HERO SECTION" />
            <SectionNav id="about" label="ABOUT ME" />
            <SectionNav id="skills" label="TECH STACK" />
            <SectionNav id="experience" label="EXPERIENCE" />
            <SectionNav id="projects" label="PROJECTS" />
            <SectionNav id="startup" label="STARTUP" />
            <SectionNav id="team" label="TEAM SECTION" />
            <SectionNav id="contact" label="CONTACT INFO" />
          </aside>
        )}

        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {statusMsg && (
            <div style={{ padding: '15px', border: '1px solid #00ff88', color: '#00ff88', marginBottom: '20px', textAlign: 'center', background: 'rgba(0,255,136,0.05)', animation: 'fadeUp 0.5s forwards' }}>
              {statusMsg}
            </div>
          )}

          {activeTab === 'protocol' && (
            <div style={{ maxWidth: '800px' }}>
              {/* HERO SECTION */}
              {activeSection === 'hero' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// HERO PROTOCOL</h2>
                  <InputGroup label="Tagline" value={data.hero.tag} onChange={(v) => updateData('hero.tag', v)} />
                  <InputGroup label="Main Name" value={data.hero.name} onChange={(v) => updateData('hero.name', v)} />
                  <InputGroup label="Subtitle" value={data.hero.subtitle} onChange={(v) => updateData('hero.subtitle', v)} />
                  <InputGroup label="Description" value={data.hero.description} onChange={(v) => updateData('hero.description', v)} textarea />
                  <InputGroup label="Official Profile Image (2D)" value={data.hero.image} onChange={(v) => updateData('hero.image', v)} onFileUpload={(e) => handleFileUpload(e, 'hero.image')} uniqueKey="hero" />
                  <div style={{ padding: '15px', background: 'rgba(0,245,255,0.05)', borderLeft: '2px solid #00f5ff', color: '#c8e8ff', fontSize: '12px', marginBottom: '20px' }}>
                    <span style={{ color: '#00f5ff' }}>ℹ BIOMETRIC UPLOAD:</span> Click 'UPLOAD_IMAGE' to sync your photo directly to the protocol.
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#00f5ff', fontSize: '11px', marginBottom: '8px', letterSpacing: '2px' }}>ROLES (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={data.hero.roles.join(', ')}
                      onChange={(e) => updateData('hero.roles', e.target.value.split(',').map(s => s.trim()))}
                      style={{ width: '100%', background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,245,255,0.2)', color: '#fff', padding: '12px', fontFamily: 'Rajdhani', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* ABOUT SECTION */}
              {activeSection === 'about' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// BIOGRAPHY PROTOCOL</h2>
                  <InputGroup label="Section Title" value={data.about.title} onChange={(v) => updateData('about.title', v)} />
                  <InputGroup label="Intro Text (Paragraph 1)" value={data.about.text[0]} onChange={(v) => { const texts = [...data.about.text]; texts[0] = v; updateData('about.text', texts); }} textarea />
                  <InputGroup label="Location" value={data.about.location} onChange={(v) => updateData('about.location', v)} />
                  <InputGroup label="Education Degree" value={data.about.education.degree} onChange={(v) => updateData('about.education.degree', v)} />
                  <InputGroup label="Institution" value={data.about.education.institution} onChange={(v) => updateData('about.education.institution', v)} />
                </div>
              )}

              {/* SKILLS SECTION */}
              {activeSection === 'skills' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// TECH STACK PROTOCOL</h2>
                  {data.skills.map((skill, idx) => (
                    <div key={idx} style={{ padding: '20px', background: 'rgba(0,20,40,0.3)', border: '1px solid rgba(0,245,255,0.1)', marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <InputGroup label={`Skill ${idx + 1} Name`} value={skill.name} onChange={(v) => {
                          const skills = [...data.skills]; skills[idx].name = v; updateData('skills', skills);
                        }} />
                      </div>
                      <div style={{ width: '100px' }}>
                        <InputGroup label="%" type="number" value={skill.percent} onChange={(v) => {
                          const skills = [...data.skills]; skills[idx].percent = parseInt(v); updateData('skills', skills);
                        }} />
                      </div>
                      <div style={{ width: '60px' }}>
                        <InputGroup label="Icon" value={skill.icon} onChange={(v) => {
                          const skills = [...data.skills]; skills[idx].icon = v; updateData('skills', skills);
                        }} />
                      </div>
                      <button onClick={() => removeItem('skills', idx)} style={{ background: '#ff0055', border: 'none', color: '#fff', padding: '12px', cursor: 'pointer', marginBottom: '20px' }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addItem('skills', { name: 'New Skill', percent: 50, icon: '⚡' })} style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px dashed #00f5ff', color: '#00f5ff', cursor: 'pointer', fontFamily: 'Orbitron' }}>+ ADD NEW SKILL</button>
                </div>
              )}

              {/* EXPERIENCE SECTION */}
              {activeSection === 'experience' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// TIMELINE PROTOCOL</h2>
                  {data.experience.map((exp, idx) => (
                    <div key={idx} style={{ padding: '30px', background: 'rgba(0,20,40,0.3)', border: '1px solid rgba(0,245,255,0.1)', marginBottom: '30px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ color: '#00f5ff', marginBottom: '20px' }}>ENTRY #{idx + 1}</h3>
                        <button onClick={() => removeItem('experience', idx)} style={{ color: '#ff0055', background: 'transparent', border: 'none', cursor: 'pointer' }}>REMOVE ENTRY</button>
                      </div>
                      <InputGroup label="Duration" value={exp.date} onChange={(v) => { const exps = [...data.experience]; exps[idx].date = v; updateData('experience', exps); }} />
                      <InputGroup label="Role Title" value={exp.title} onChange={(v) => { const exps = [...data.experience]; exps[idx].title = v; updateData('experience', exps); }} />
                      <InputGroup label="Company" value={exp.company} onChange={(v) => { const exps = [...data.experience]; exps[idx].company = v; updateData('experience', exps); }} />
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#00f5ff', fontSize: '11px', marginBottom: '8px', letterSpacing: '2px' }}>BULLET POINTS (ONE PER LINE)</label>
                        <textarea
                          value={exp.bullets.join('\n')}
                          onChange={(e) => { const exps = [...data.experience]; exps[idx].bullets = e.target.value.split('\n'); updateData('experience', exps); }}
                          style={{ width: '100%', background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,245,255,0.2)', color: '#fff', padding: '12px', fontFamily: 'Rajdhani', outline: 'none', height: '100px' }}
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addItem('experience', { date: 'DATE RANGE', title: 'ROLE', company: 'COMPANY', bullets: ['Responsibility'] })} style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px dashed #00f5ff', color: '#00f5ff', cursor: 'pointer', fontFamily: 'Orbitron' }}>+ ADD EXPERIENCE ENTRY</button>
                </div>
              )}

              {/* PROJECTS SECTION */}
              {activeSection === 'projects' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// DEPLOYMENT PROTOCOL</h2>
                  {data.projects.map((p, idx) => (
                    <div key={idx} style={{ padding: '30px', background: 'rgba(0,20,40,0.3)', border: '1px solid rgba(0,245,255,0.1)', marginBottom: '30px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ color: '#00f5ff', marginBottom: '20px' }}>PROJECT #{idx + 1}</h3>
                        <button onClick={() => removeItem('projects', idx)} style={{ color: '#ff0055', background: 'transparent', border: 'none', cursor: 'pointer' }}>REMOVE PROJECT</button>
                      </div>
                      <InputGroup label="Type (e.g. CLIENT PROJECT)" value={p.type} onChange={(v) => { const ps = [...data.projects]; ps[idx].type = v; updateData('projects', ps); }} />
                      <InputGroup label="Project Name" value={p.title} onChange={(v) => { const ps = [...data.projects]; ps[idx].title = v; updateData('projects', ps); }} />
                      <InputGroup label="Description" value={p.description} onChange={(v) => { const ps = [...data.projects]; ps[idx].description = v; updateData('projects', ps); }} textarea />
                      <InputGroup label="Tags (Comma Separated)" value={p.tags.join(', ')} onChange={(v) => { const ps = [...data.projects]; ps[idx].tags = v.split(',').map(s => s.trim()); updateData('projects', ps); }} />
                      <InputGroup label="GitHub Link" value={p.github} onChange={(v) => { const ps = [...data.projects]; ps[idx].github = v; updateData('projects', ps); }} />
                    </div>
                  ))}
                  <button onClick={() => addItem('projects', { type: 'PROJECT TYPE', title: 'TITLE', description: 'DESC', tags: ['TECH'], github: '#' })} style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px dashed #00f5ff', color: '#00f5ff', cursor: 'pointer', fontFamily: 'Orbitron' }}>+ ADD NEW PROJECT</button>
                </div>
              )}

              {/* STARTUP SECTION */}
              {activeSection === 'startup' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// STARTUP PROTOCOL</h2>
                  <InputGroup label="Name" value={data.startup.name} onChange={(v) => updateData('startup.name', v)} />
                  <InputGroup label="Status Badge" value={data.startup.badge} onChange={(v) => updateData('startup.badge', v)} />
                  <InputGroup label="Role Info" value={data.startup.role} onChange={(v) => updateData('startup.role', v)} />
                </div>
              )}

              {/* TEAM SECTION */}
              {activeSection === 'team' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '10px', fontSize: '20px' }}>// TEAM PROTOCOL</h2>
                  <p style={{ color: 'var(--cyan)', fontSize: '11px', marginBottom: '30px', letterSpacing: '2px' }}>MANAGE ORGANIZATIONS AND PRODUCTION HOUSES</p>

                  {data.teams.map((team, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.1)', padding: '25px', marginBottom: '30px', position: 'relative' }}>
                      <button
                        onClick={() => removeItem('teams', idx)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff0055', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px 10px', fontSize: '10px' }}
                      >
                        REMOVE
                      </button>
                      <InputGroup label="Organization Name" value={team.title} onChange={(v) => {
                        const newTeams = [...data.teams];
                        newTeams[idx].title = v;
                        setData({ ...data, teams: newTeams });
                      }} />
                      <InputGroup label="Description" value={team.description} onChange={(v) => {
                        const newTeams = [...data.teams];
                        newTeams[idx].description = v;
                        setData({ ...data, teams: newTeams });
                      }} textarea />
                      <InputGroup
                        label="Image Path"
                        value={team.image}
                        onChange={(v) => {
                          const newTeams = [...data.teams];
                          newTeams[idx].image = v;
                          setData({ ...data, teams: newTeams });
                        }}
                        onFileUpload={(e) => handleFileUpload(e, `teams.${idx}.image`)}
                        uniqueKey={`team_${idx}`}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {['facebook', 'instagram', 'youtube', 'x', 'linkedin'].map(platform => (
                          <InputGroup
                            key={platform}
                            label={platform}
                            value={team.socials?.[platform] || ''}
                            onChange={(v) => {
                              const newTeams = [...data.teams];
                              if (!newTeams[idx].socials) newTeams[idx].socials = {};
                              newTeams[idx].socials[platform] = v;
                              setData({ ...data, teams: newTeams });
                            }}
                          />
                        ))}
                      </div>
                      <InputGroup label="Production Website URL (Optional)" value={team.website || ''} onChange={(v) => {
                        const newTeams = [...data.teams];
                        newTeams[idx].website = v;
                        setData({ ...data, teams: newTeams });
                      }} />
                    </div>
                  ))}

                  <button
                    onClick={() => addItem('teams', { title: 'NEW TEAM', description: '', image: '/new_team.jpg', website: '', socials: {} })}
                    style={{ width: '100%', padding: '15px', background: 'transparent', border: '1px dashed #00f5ff', color: '#00f5ff', fontFamily: 'Orbitron', cursor: 'pointer' }}
                  >
                    + ADD NEW ORGANIZATION
                  </button>

                  <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0,245,255,0.05)', borderLeft: '2px solid #00f5ff', color: '#c8e8ff', fontSize: '13px' }}>
                    <span style={{ color: '#00f5ff' }}>ℹ PRODUCTION NOTE:</span> Ensure your team images are located in the <strong>/public</strong> folder for correct deployment.
                  </div>
                </div>
              )}

              {/* CONTACT SECTION */}
              {activeSection === 'contact' && (
                <div>
                  <h2 style={{ fontFamily: 'Orbitron', color: '#fff', marginBottom: '30px', fontSize: '20px' }}>// COM-CHANNEL PROTOCOL</h2>
                  <InputGroup label="Contact Description" value={data.contact.description} onChange={(v) => updateData('contact.description', v)} textarea />
                  <InputGroup label="Languages (Comma Separated)" value={data.contact.languages.join(', ')} onChange={(v) => updateData('contact.languages', v.split(',').map(s => s.trim()))} />

                  <h3 style={{ color: '#00f5ff', fontSize: '14px', marginTop: '30px', marginBottom: '20px', fontFamily: 'Orbitron' }}>// EXTERNAL LINKS</h3>
                  {data.contact.links.map((link, idx) => (
                    <div key={idx} style={{ padding: '20px', background: 'rgba(0,10,30,0.4)', border: '1px solid rgba(0,245,255,0.1)', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{link.icon}</span>
                        <span style={{ color: '#fff', fontFamily: 'Share Tech Mono', letterSpacing: '2px' }}>{link.label}</span>
                      </div>
                      <InputGroup
                        label="URL"
                        value={link.url}
                        onChange={(v) => {
                          const newLinks = [...data.contact.links];
                          newLinks[idx].url = v;
                          updateData('contact.links', newLinks);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', border: '1px dashed rgba(0,245,255,0.2)', color: 'rgba(200,232,255,0.4)' }}>
                  COMTOWER SILENT. NO INCOMING TRANSMISSIONS DETECTED.
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{ background: 'rgba(0,20,40,0.7)', border: '1px solid rgba(0,245,255,0.2)', padding: '24px', position: 'relative', clipPath: 'polygon(15px 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(0,245,255,0.1)', paddingBottom: '10px' }}>
                      <div>
                        <span style={{ color: '#00f5ff', fontSize: '12px' }}>FROM:</span> <span style={{ color: '#fff', fontWeight: '700' }}>{msg.name}</span>
                        <span style={{ margin: '0 10px', color: 'rgba(200,232,255,0.2)' }}>|</span>
                        <span style={{ color: '#00f5ff', fontSize: '12px' }}>CONTACT:</span> <span style={{ color: '#fff' }}>{msg.email}</span>
                        <span style={{ margin: '0 10px', color: 'rgba(200,232,255,0.2)' }}>|</span>
                        <span style={{ color: '#00f5ff', fontSize: '12px' }}>PHONE:</span> <span style={{ color: '#fff' }}>{msg.phone || 'N/A'}</span>
                      </div>
                      <span style={{ color: '#00ff88', fontSize: '11px' }}>{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '20px' }}>
                      <div>
                        <span style={{ color: '#8800ff', fontSize: '12px' }}>INTEREST:</span> <span style={{ color: '#fff', background: 'rgba(136,0,255,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(136,0,255,0.3)' }}>{msg.interest || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#00f5ff', fontSize: '12px' }}>SUBJECT:</span> <span style={{ color: '#fff', letterSpacing: '1px' }}>{msg.subject}</span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--dim)', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '15px', borderLeft: '2px solid var(--purple)', marginBottom: '15px' }}>
                      {msg.message}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a
                        href={`https://wa.me/${msg.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${msg.name}, I saw your message regarding '${msg.interest}' on my portfolio. Let's discuss!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: '#25D366', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'Orbitron', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <span style={{ fontSize: '16px' }}>💬</span> WHATSAPP
                      </a>
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent('RE: ' + msg.subject)}&body=${encodeURIComponent(`Hi ${msg.name},\n\nI saw your message regarding ${msg.interest} on my portfolio. Let's connect!`)}`}
                        style={{ border: '1px solid #00f5ff', color: '#00f5ff', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'Orbitron', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <span style={{ fontSize: '16px' }}>✉</span> EMAIL
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
