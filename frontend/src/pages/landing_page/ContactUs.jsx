import { Mail, MapPin, Clock, MessageCircle, ArrowRight, Car } from 'lucide-react';

const ContactUs = () => {
  const contactEmail = 'agnelvincent779@gmail.com';

  const infoCards = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: contactEmail,
      sub: 'We reply within 24 hours',
      href: `mailto:${contactEmail}`,
      clickable: true,
    },
    {
      icon: MapPin,
      title: 'Our Location',
      detail: 'Kerala, India',
      sub: 'Serving customers across India',
      clickable: false,
    },
    {
      icon: Clock,
      title: 'Support Hours',
      detail: 'Mon – Sat, 9 AM – 6 PM',
      sub: 'Indian Standard Time (IST)',
      clickable: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 border border-blue-400/40 text-blue-100 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <MessageCircle className="w-4 h-4" />
            We're here to help
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Contact <span className="text-blue-200">MotoReach</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Have a question, concern, or feedback? Reach out to us and our team
            will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {infoCards.map((card, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-7 shadow-md border border-gray-100 flex flex-col items-center text-center transition-all duration-300
                  ${card.clickable ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer group' : ''}`}
                onClick={card.clickable ? () => window.location.href = card.href : undefined}
              >
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-blue-100">
                  <card.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.title}</h3>
                {card.clickable ? (
                  <a
                    href={card.href}
                    className="text-blue-600 font-medium hover:text-blue-800 hover:underline break-all transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {card.detail}
                  </a>
                ) : (
                  <p className="text-gray-700 font-medium">{card.detail}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Email CTA */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Top accent strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                Send Us an Email
              </h2>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
                Click the button below to open your email client and send us a
                message. We aim to respond within one business day.
              </p>

              <a
                href={`mailto:${contactEmail}`}
                id="contact-email-btn"
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200 group"
              >
                <Mail className="w-5 h-5" />
                {contactEmail}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>

              <p className="text-xs text-gray-400 mt-5">
                Your email client will open automatically
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Banner */}
      <section className="py-14 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MotoReach</span>
          </div>
          <p className="text-blue-100 text-lg mb-6">
            Your trusted partner for automotive services across India.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow hover:shadow-md hover:bg-blue-50 transition-all duration-200"
          >
            <Mail className="w-4 h-4" />
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
