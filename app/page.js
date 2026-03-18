"use client";
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  const canvasRef = useRef(null);
  const curRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Fetch data
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  useEffect(() => {
    if (!data) return;

    // CURSOR Logic
    const cur = curRef.current;
    const ring = ringRef.current;
    let mx = 0, my = 0, rx = 0, ry = 0;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cur) {
        cur.style.left = mx + 'px';
        cur.style.top = my + 'px';
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      requestAnimationFrame(animateRing);
    };

    document.addEventListener('mousemove', onMouseMove);
    animateRing();

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, .sc, .pc');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (ring) { ring.style.width = '56px'; ring.style.height = '56px'; }
        if (cur) { cur.style.transform = 'translate(-50%,-50%) scale(1.5)'; }
      });
      el.addEventListener('mouseleave', () => {
        if (ring) { ring.style.width = '36px'; ring.style.height = '36px'; }
        if (cur) { cur.style.transform = 'translate(-50%,-50%) scale(1)'; }
      });
    });

    // CANVAS Logic
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 500 + 100;
        this.vz = -(Math.random() * 1.5 + 0.3);
        this.o = Math.random() * 0.6 + 0.1;
      }
      update() {
        this.z += this.vz;
        if (this.z <= 0) this.reset();
      }
      draw() {
        const s = 500 / this.z;
        const px = (this.x - canvas.width / 2) * s + canvas.width / 2;
        const py = (this.y - canvas.height / 2) * s + canvas.height / 2;
        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) {
          this.reset();
          return;
        }
        ctx.beginPath();
        ctx.arc(px, py, 1.5 * s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 255, ${this.o * s / 3})`;
        ctx.fill();
      }
    }

    class DigitalRain {
      constructor() {
        this.reset();
        this.y = Math.random() * -canvas.height;
      }
      reset() {
        this.x = Math.floor(Math.random() * (canvas.width / 25)) * 25;
        this.y = -20;
        this.length = Math.random() * 10 + 5;
        this.speed = Math.random() * 3 + 2; // FASTER
        this.chars = Array.from({ length: this.length }, () =>
          Math.random() > 0.5 ? Math.floor(Math.random() * 2) : String.fromCharCode(0x30A0 + Math.random() * 96)
        );
      }
      update() {
        this.y += this.speed;
        if (this.y > canvas.height + 100) this.reset();
      }
      draw() {
        ctx.font = '14px Share Tech Mono'; // Slightly larger
        this.chars.forEach((c, i) => {
          const alpha = (1 - (i / this.length)) * 0.25; // More opaque
          ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`; // Classic Matrix Green
          ctx.fillText(c, this.x, this.y - (i * 18));
        });
      }
    }

    const particles = Array.from({ length: 150 }, () => new Particle());
    const rains = Array.from({ length: 80 }, () => new DigitalRain());

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(0,100,180,.08)';
      ctx.lineWidth = 0.4;
      const vx = canvas.width / 2;
      const vy = canvas.height * 0.55;
      for (let i = 0; i <= 10; i++) {
        const y = canvas.height * 0.6 + i * 80;
        const p = i / 10;
        ctx.beginPath();
        ctx.moveTo(vx - vx * 2 * p, y);
        ctx.lineTo(vx + vx * 2 * p, y);
        ctx.stroke();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = ctx.createRadialGradient(mx * 0.2 + canvas.width * 0.4, canvas.height * 0.3, 0, canvas.width / 2, canvas.height / 2, canvas.width);
      bg.addColorStop(0, 'rgba(0,15,35,1)');
      bg.addColorStop(0.6, 'rgba(1,2,8,1)');
      bg.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      rains.forEach(r => { r.update(); r.draw(); });
      drawGrid();
      particles.forEach(p => { p.update(); p.draw(); });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    // INTERSECTION OBSERVER
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.querySelectorAll('.sb').forEach(b => {
            b.style.width = b.dataset.pct + '%';
          });
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .tli').forEach(el => obs.observe(el));

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [data]);

  const [formStatus, setFormStatus] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', interest: 'Work Related', subject: '', message: '' });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('TRANSMITTING...');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormStatus('SUCCESS');
        setFormData({ name: '', email: '', phone: '', interest: 'Work Related', subject: '', message: '' });
        setTimeout(() => setFormStatus(''), 4000);
      } else {
        setFormStatus('ERROR');
      }
    } catch (err) {
      setFormStatus('ERROR');
    }
  };

  if (!data) return <div className="loading" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#00f5ff', fontFamily: 'Orbitron' }}>INITIATING SYSTEM...</div>;

  return (
    <>
      <div id="cur" ref={curRef}></div>
      <div id="cur-ring" ref={ringRef}></div>
      <canvas id="bgc" ref={canvasRef}></canvas>

      <nav>
        <div className="logo glitch-text">KOSHUR.CODER</div>
        <div className="nav-links">
          <a href="#about">ABOUT</a>
          <a href="#skills">SKILLS</a>
          <a href="#experience">EXPERIENCE</a>
          <a href="#projects">PROJECTS</a>
          <a href="#startup">STARTUP</a>
          <a href="#contact">CONTACT</a>
        </div>
      </nav>

      <section id="hero" className="hero-section">
        <div className="hero-container">

          <div className="hero-content">
            <div className="reveal visible" style={{ animationDelay: '0.1s' }}>
              <div className="hero-tag">{data.hero.tag}</div>
              <h1 className="hero-name glitch-text">
                <span className="gname">{data.hero.name}</span>
                <span className="gsub">{data.hero.subtitle}</span>
              </h1>
              <div className="hero-roles">
                {data.hero.roles.map(role => <div key={role} className="rb">{role}</div>)}
              </div>
              <p className="hero-desc">{data.hero.description}</p>
              <div className="hero-btns">
                <a href="#projects" className="btn-p">VIEW PROJECTS</a>
                <a href="#contact" className="btn-g">GET IN TOUCH</a>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="reveal visible hero-image-wrapper">
              {/* Back Frame */}
              <div className="hero-back-frame"></div>

              {/* Image Container */}
              <div className="hero-img-container">
                <img
                  src={data.hero.image}
                  alt={data.hero.name}
                  className="hero-main-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500/020408/00f5ff?text=BIOMETRIC_ERROR'; }}
                />

                {/* Scanning Line overlay */}
                <div className="hero-scan-line"></div>

                {/* Glitch Overlay Effect */}
                <div className="hero-glitch-overlay"></div>
              </div>

              {/* HUD Elements */}
              <div className="hero-hud-top">
                IDENTITY_VERIFIED // 100%
              </div>
              <div className="hero-hud-side">
                PROJECT: ASRAR_PROTO
              </div>
            </div>
          </div>

        </div>

        <div className="scroll-ind">
          <div className="scroll-line"></div>
          <span>SCROLL</span>
        </div>
      </section>

      <section id="about">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 01</div><h2 className="st">{data.about.title}</h2><div className="sl"></div></div>
          <div className="ag">
            <div className="at card reveal">
              {data.about.text.map((p, i) => <p key={i}>{p}</p>)}
              <div className="sr">
                {data.about.stats.map(s => (
                  <div key={s.label}>
                    <span className="snum" data-target={s.value}>{s.value}</span>
                    <div className="slbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card reveal" style={{ padding: '24px' }}>
                <div className="tldate">EDUCATION</div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{data.about.education.degree}</div>
                <div style={{ color: 'var(--cyan)', fontSize: '14px', letterSpacing: '2px', marginBottom: '6px' }}>{data.about.education.institution}</div>
                <div style={{ fontSize: '13px', color: 'var(--dim)' }}>{data.about.education.details}</div>
              </div>
              <div className="card reveal" style={{ padding: '24px' }}>
                <div className="tldate">LOCATION</div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>LOCATION</div>
                <div style={{ fontSize: '13px', color: 'var(--dim)' }}>{data.about.location}</div>
              </div>
              <div className="card reveal" style={{ padding: '24px' }}>
                <div className="tldate">CERTIFICATION</div>
                <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>CERTIFICATION</div>
                <div style={{ fontSize: '13px', color: 'var(--dim)' }}>{data.about.certification}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="skills">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 02</div><h2 className="st">TECH STACK</h2><div className="sl"></div></div>
          <div className="sg">
            {data.skills.map((s, idx) => (
              <div key={s.name} className={`sc reveal reveal-${(idx % 6) + 1}`}>
                <span className="si">{s.icon}</span>
                <div className="sname">{s.name}</div>
                <div style={{ overflow: 'hidden' }}><div className="sp">{s.percent}%</div></div>
                <div className="sbw"><div className="sb" data-pct={s.percent}></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 03</div><h2 className="st">EXPERIENCE</h2><div className="sl"></div></div>
          <div className="tl">
            {data.experience.map((exp, i) => (
              <div key={i} className="tli">
                <div className="tld"></div>
                <div className="tldate">{exp.date}</div>
                <div className="tltitle">{exp.title}</div>
                <div className="tlco">{exp.company}</div>
                <ul className="tlul">
                  {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 04</div><h2 className="st">PROJECTS</h2><div className="sl"></div></div>
          <div className="pg">
            {data.projects.map((p, i) => (
              <div key={i} className={`pc reveal reveal-${(i % 3) + 1}`}>
                <div className="pty">{p.type}</div>
                <div className="ptit">{p.title}</div>
                <div className="pdesc">{p.description}</div>
                <div className="ptags">
                  {p.tags.map(t => <span key={t} className="ptag">{t}</span>)}
                </div>
                <a href={p.github} target="_blank" className="pgit">
                  <span className="pgit-icon">⌥</span> VIEW ON GITHUB
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="startup">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 05</div><h2 className="st">STARTUP</h2><div className="sl"></div></div>
          <div className="stcard reveal">
            <div className="stbadge"><div className="ldot"></div>{data.startup.badge}</div>
            <div className="sttitle">{data.startup.name.split('CARE')[0]}<span>CARE</span></div>
            <div className="stsub">{data.startup.role}</div>
            <div className="stpts">
              {data.startup.points.map((pt, i) => (
                <div key={i} className="spt">
                  <div className="sptl">{pt.label}</div>
                  <div className="sptxt">{pt.text}</div>
                </div>
              ))}
            </div>
            <div className="ts">
              {data.startup.tags.map(t => <span key={t} className="tt">{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section id="team">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 06</div><h2 className="st">OUR TEAMS</h2><div className="sl"></div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
            {data.teams.map((team, idx) => (
              <div key={idx} className="at card reveal" style={{ display: 'flex', flexDirection: idx % 2 === 0 ? (window.innerWidth < 768 ? 'column' : 'row') : (window.innerWidth < 768 ? 'column' : 'row-reverse'), gap: '40px', alignItems: 'center', padding: '40px' }}>
                <div style={{ flex: '1' }}>
                  <h3 style={{ fontFamily: 'Orbitron, monospace', color: 'var(--cyan)', fontSize: '24px', marginBottom: '15px', letterSpacing: '2px' }}>{team.title}</h3>
                  <p style={{ color: 'var(--dim)', lineHeight: '1.8', fontSize: '16px', marginBottom: '25px' }}>{team.description}</p>

                  {team.socials && (
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', opacity: 0.8 }}>
                      {Object.entries(team.socials).map(([platform, url]) => (
                        <a key={platform} href={url} target="_blank" style={{ color: 'var(--cyan)', textDecoration: 'none', fontSize: '12px', fontFamily: 'Share Tech Mono', border: '1px solid rgba(0,245,255,0.2)', padding: '5px 12px' }}>
                          {platform.toUpperCase()}
                        </a>
                      ))}
                    </div>
                  )}

                  {team.website && (
                    <a href={team.website} target="_blank" className="btn-g" style={{ padding: '8px 24px', fontSize: '12px' }}>VISIT PRODUCTION WEBSITE</a>
                  )}
                </div>
                <div style={{ flex: '1', width: '100%', maxWidth: '450px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: idx % 2 === 0 ? '-10px' : '10px', right: idx % 2 === 0 ? '10px' : '-10px', bottom: '10px', border: '1px solid var(--cyan)', zIndex: 0 }}></div>
                  <img
                    src={team.image}
                    alt={team.title}
                    style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block', position: 'relative', zIndex: 1, border: '1px solid rgba(0,245,255,0.3)' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div style={{ width: '100%', height: '300px', background: 'rgba(0,10,20,0.8)', display: 'none', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, border: '1px solid var(--cyan)', flexDirection: 'column', gap: '15px' }}>
                    <span style={{ fontSize: '40px' }}>{idx === 0 ? '👥' : '🎬'}</span>
                    <span style={{ fontFamily: 'Share Tech Mono', color: 'rgba(200,232,255,0.4)', textAlign: 'center', padding: '0 20px' }}>IMAGE_NOT_FOUND: PLACEHOLDER_ACTIVE.<br />PLEASE UPLOAD TO /public{team.image}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div style={{ maxWidth: '1100px', width: '100%' }}>
          <div className="sh reveal"><div className="sn">// 07</div><h2 className="st">CONTACT</h2><div className="sl"></div></div>
          <div className="contact-grid reveal">
            <div className="contact-info">
              <p className="cd">{data.contact.description}</p>
              <div className="cl">
                {/* TOP EMAIL CONTACT */}
                <a href="mailto:haqasrar264@gmail.com" className="ci" style={{ border: '2px solid #00f5ff', background: 'rgba(0,245,255,0.1)' }}>
                  <span style={{ fontSize: '22px' }}>📧</span>
                  <span style={{ fontFamily: 'Orbitron', fontSize: '13px', letterSpacing: '1px', color: '#fff', fontWeight: '700' }}>haqasrar264@gmail.com</span>
                </a>

                {data.contact.links.filter(l => l.label !== 'EMAIL').map((l, idx) => (
                  <a key={l.label} href={l.url} target="_blank" className={`ci reveal reveal-${(idx % 4) + 1}`}>
                    <span style={{ fontSize: '20px' }}>{l.icon}</span>
                    <span style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: '13px', letterSpacing: '1px' }}>{l.label}</span>
                  </a>
                ))}

                {/* BOTTOM EMAIL CONTACT */}
                <a href="mailto:haqasrar264@gmail.com" className="ci" style={{ opacity: 0.9, fontSize: '12px' }}>
                  <span style={{ fontSize: '18px' }}>✉</span>
                  <span style={{ fontFamily: 'Share Tech Mono', letterSpacing: '1px', color: '#00f5ff' }}>QUICK_MAIL: haqasrar264@gmail.com</span>
                </a>
              </div>
              <div className="lr">
                {data.contact.languages.map(lang => <span key={lang} className="lt">{lang}</span>)}
              </div>
            </div>

            <div className="contact-form-wrap">
              <div className="form-header">
                <span className="form-tag">// SEND MESSAGE</span>
              </div>
              <form onSubmit={handleContactSubmit}>
                <div className="cf-row">
                  <div className="cf-group">
                    <label className="cf-label">YOUR NAME</label>
                    <div className="cf-input-wrap">
                      <input type="text" className="cf-input" placeholder="John Doe" autoComplete="off" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      <div className="cf-line"></div>
                    </div>
                  </div>
                  <div className="cf-group">
                    <label className="cf-label">YOUR EMAIL</label>
                    <div className="cf-input-wrap">
                      <input type="email" className="cf-input" placeholder="john@example.com" autoComplete="off" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      <div className="cf-line"></div>
                    </div>
                  </div>
                </div>
                <div className="cf-row">
                  <div className="cf-group">
                    <label className="cf-label">PHONE NUMBER</label>
                    <div className="cf-input-wrap">
                      <input type="text" className="cf-input" placeholder="+91 XXXX XXXX" autoComplete="off" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      <div className="cf-line"></div>
                    </div>
                  </div>
                  <div className="cf-group">
                    <label className="cf-label">I'M INTERESTED IN...</label>
                    <div className="cf-input-wrap">
                      <select
                        className="cf-input"
                        style={{ background: 'transparent', border: 'none', appearance: 'none', color: '#fff', paddingRight: '20px' }}
                        value={formData.interest}
                        onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      >
                        <option style={{ background: '#020408' }} value="Work Related">Work Related</option>
                        <option style={{ background: '#020408' }} value="Internship">Internship</option>
                        <option style={{ background: '#020408' }} value="Collaboration">Collaboration</option>
                        <option style={{ background: '#020408' }} value="Something Else">Something Else</option>
                      </select>
                      <div className="cf-line"></div>
                    </div>
                  </div>
                </div>
                <div className="cf-group">
                  <label className="cf-label">SUBJECT</label>
                  <div className="cf-input-wrap">
                    <input type="text" className="cf-input" placeholder="Collaboration / Internship / Project" autoComplete="off" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                    <div className="cf-line"></div>
                  </div>
                </div>
                <div className="cf-group">
                  <label className="cf-label">MESSAGE</label>
                  <div className="cf-input-wrap">
                    <textarea className="cf-input cf-textarea" placeholder="Tell me about your project or opportunity..." required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}></textarea>
                    <div className="cf-line"></div>
                  </div>
                </div>
                <button type="submit" className="cf-submit" disabled={formStatus === 'TRANSMITTING...'}>
                  <span>{formStatus === 'TRANSMITTING...' ? 'TRANSMITTING...' : 'SEND MESSAGE'}</span>
                  <span className="cf-arrow">→</span>
                </button>
                {formStatus === 'SUCCESS' && (
                  <div className="cf-success" style={{ display: 'flex' }}>
                    <span className="cf-success-icon">✦</span> MESSAGE TRANSMITTED SUCCESSFULLY
                  </div>
                )}
                {formStatus === 'ERROR' && (
                  <div className="cf-success" style={{ display: 'flex', borderColor: 'red', color: 'red' }}>
                    <span className="cf-success-icon">✦</span> ERROR: TRANSMISSION FAILED
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div style={{ marginBottom: '8px', color: 'var(--cyan)', fontFamily: 'Orbitron,monospace', letterSpacing: '4px', fontSize: '14px' }}>ASRAR</div>
        © 2026 MOHAMMAD ASRAR UL HAQUE AHANGER · TEAM KOSHUR CODER · DESIGNED & CODED WITH ♥
      </footer>
    </>
  );
}
