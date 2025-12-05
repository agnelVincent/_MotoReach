
import { Wrench, MapPin, DollarSign, Calendar, PackageCheck, Shield, Clock, TrendingDown, Sparkles, Users, Zap } from 'lucide-react';


const LandingPage = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Workshop Listings',
      description: 'Browse verified workshops near you with detailed profiles, ratings, and specializations.'
    },
    {
      icon: Wrench,
      title: 'Mechanic On-Site Services',
      description: 'Request professional mechanics to come to your location for convenient repairs.'
    },
    {
      icon: DollarSign,
      title: 'Transparent Platform Fee',
      description: 'Clear pricing with no hidden charges. Know exactly what you pay upfront.'
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book appointments instantly with real-time availability from workshops and mechanics.'
    },
    {
      icon: PackageCheck,
      title: 'Service Tracking',
      description: 'Track your service status in real-time from booking to completion.'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Multiple payment options with encrypted transactions for your safety.'
    }
  ];

  const whyChoose = [
    {
      icon: Shield,
      title: 'Verified Workshops & Mechanics',
      description: 'All service providers undergo thorough verification for your peace of mind.'
    },
    {
      icon: Clock,
      title: 'Fast & Reliable Service',
      description: 'Quick response times and dependable service delivery every time.'
    },
    {
      icon: TrendingDown,
      title: 'Affordable Pricing',
      description: 'Competitive rates that fit your budget without compromising quality.'
    },
    {
      icon: Sparkles,
      title: 'Seamless User Experience',
      description: 'Intuitive platform designed for effortless navigation and booking.'
    },
    {
      icon: Users,
      title: 'Trusted by Customers',
      description: 'Join thousands of satisfied customers who trust MotoReach for their vehicle needs.'
    },
    {
      icon: Zap,
      title: 'Real-Time Updates',
      description: 'Stay informed with instant notifications about your service status.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center space-y-6 animate-fadeIn">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Welcome to <span className="text-blue-200">MotoReach</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Your smart platform connecting you with trusted workshops and professional mechanics. 
              Get quality automotive services delivered with transparency, convenience, and reliability.
            </p>
            <div className="pt-4">
              <button className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">
                Request a Service
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover what makes MotoReach the preferred choice for automotive services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="bg-blue-50 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose MotoReach Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose MotoReach?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our commitment to excellence and customer satisfaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {whyChoose.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-100"
              >
                <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-sm">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of satisfied customers and experience premium automotive services today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-300">
              Request a Service
            </button>
            <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-blue-700 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;