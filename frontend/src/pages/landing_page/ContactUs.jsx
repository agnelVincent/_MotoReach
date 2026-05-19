import { useState, useEffect } from 'react';
import { Mail, MapPin, Clock, MessageCircle, ArrowRight, Car } from 'lucide-react';

const ContactUs = () => {
  const [mounted, setMounted] = useState(false);
  const contactEmail = 'agnelvincent779@gmail.com';

  useEffect(() => { setMounted(true); }, []);

  const infoCards = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: contactEmail,
      sub: 'We reply within 24 hours',
      href: `mailto:${contactEmail}`,
      clickable: true,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      icon: MapPin,
      title: 'Our Location',
      detail: 'Kerala, India',
      sub: 'Serving customers across India',
      clickable: false,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      icon: Clock,
      title: 'Support Hours',
      detail: 'Mon – Sat, 9 AM – 6 PM',
      sub: 'Indian Standard Time (IST)',
      clickable: false,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
        }
        .glow-dot {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .badge-pill {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .grid-lines {
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        .info-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .info-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
          transform: translateY(-3px);
        }
        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .cta-btn {
          background: white;
          color: #1e1b4b;
          transition: all 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .cta-btn:hover {
          background: #f5f3ff;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-20 right-10" />
        <div className="glow-dot w-64 h-64 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-7 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <MessageCircle className="w-3.5 h-3.5 text-indigo-300" />
            <span className="section-label text-white/80">We're here to help</span>
          </div>

          <h1 className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05] mb-5 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Contact{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              MotoReach
            </span>
          </h1>

          <p className={`font-body text-white/55 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            Have a question, concern, or feedback? Reach out and our team will get back to you as soon as possible.
          </p>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── INFO CARDS ── */}
      <section className="grid-lines py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="section-label text-indigo-500 block mb-2">Get in touch</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
              Ways to reach us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {infoCards.map((card, idx) => {
              const Icon = card.icon;
              const inner = (
                <div className={`info-card bg-white rounded-2xl p-7 flex flex-col items-center text-center ${card.clickable ? 'cursor-pointer group' : ''}`}>
                  <div className={`w-14 h-14 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-gray-900 text-base mb-2">{card.title}</h3>
                  {card.clickable ? (
                    <a
                      href={card.href}
                      className="font-body text-indigo-600 font-medium hover:text-indigo-800 hover:underline break-all text-sm transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {card.detail}
                    </a>
                  ) : (
                    <p className="font-body text-gray-700 font-medium text-sm">{card.detail}</p>
                  )}
                  <p className="font-body text-gray-400 text-xs mt-1.5">{card.sub}</p>
                </div>
              );

              return card.clickable ? (
                <div key={idx} onClick={() => window.location.href = card.href}>
                  {inner}
                </div>
              ) : (
                <div key={idx}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EMAIL CTA ── */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7 text-indigo-600" />
              </div>

              <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-3">
                Send Us an Email
              </h2>
              <p className="font-body text-gray-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                Click the button below to open your email client and send us a message. We aim to respond within one business day.
              </p>

              <a
                href={`mailto:${contactEmail}`}
                className="action-btn inline-flex items-center gap-3 px-7 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl group"
              >
                <Mail className="w-4 h-4" />
                {contactEmail}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <p className="font-body text-xs text-gray-400 mt-5">Your email client will open automatically</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER BANNER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 md:p-12 overflow-hidden">
          <div className="glow-dot w-64 h-64 bg-white opacity-5 -top-16 -right-10" />
          <div className="glow-dot w-48 h-48 bg-violet-300 opacity-10 bottom-0 left-10" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2.5 mb-3">
                <div className="bg-white/15 rounded-xl p-2">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-white text-xl">MotoReach</span>
              </div>
              <p className="font-body text-white/60 text-sm max-w-xs leading-relaxed">
                Your trusted partner for automotive services across India.
              </p>
            </div>

            <a
              href={`mailto:${contactEmail}`}
              className="cta-btn flex-shrink-0 font-display font-bold text-indigo-700 text-sm px-7 py-4 rounded-2xl inline-flex items-center gap-2.5 group"
            >
              <Mail className="w-4 h-4 text-indigo-500 group-hover:rotate-6 transition-transform" />
              Get in Touch
              <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;