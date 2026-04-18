import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Phone, Mail, ArrowLeft, Wrench, IndianRupee, Gift, Calendar, CheckCircle, 
    TrendingUp, Award
} from 'lucide-react';

const WorkshopMechanicDetail = () => {
    const { mechanicId } = useParams();
    const navigate = useNavigate();

    // DUMMY STATE
    const [mechanic] = useState({
        id: mechanicId,
        name: "Abhishek Sharma",
        email: "abhishek@example.com",
        phone: "+91 9876543210",
        joinedDate: "15 Jan 2026",
        status: "Active",
        totalServices: 14,
        totalEarnings: 12500
    });

    const [services] = useState([
        {
            id: '1029',
            category: 'Engine Repair',
            vehicle: 'Royal Enfield Classic 350',
            date: '10 Apr 2026',
            mechanicShare: 1200,
            status: 'COMPLETED'
        },
        {
            id: '1014',
            category: 'General Service',
            vehicle: 'Honda Activa 6G',
            date: '05 Apr 2026',
            mechanicShare: 800,
            status: 'COMPLETED'
        },
        {
            id: '1005',
            category: 'Oil Change',
            vehicle: 'TVS Jupiter',
            date: '28 Mar 2026',
            mechanicShare: 450,
            status: 'COMPLETED'
        }
    ]);

    // Modal state for Payment
    const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [bonusAmount, setBonusAmount] = useState('');

    const openBonusModal = (service) => {
        setSelectedService(service);
        setIsBonusModalOpen(true);
    };

    const closeBonusModal = () => {
        setIsBonusModalOpen(false);
        setSelectedService(null);
        setBonusAmount('');
    };

    const handlePayBonus = () => {
        // Dummy logic
        if (!bonusAmount || isNaN(bonusAmount) || bonusAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        alert(`Processing bonus of ₹${bonusAmount} for Service #${selectedService?.id} to ${mechanic.name}`);
        closeBonusModal();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/workshop/team')}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Team
                </button>

                {/* Mechanic Profile Banner */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 mb-6">
                            <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-lg">
                                <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-4xl font-black text-blue-600">
                                    {mechanic.name.charAt(0)}
                                </div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-extrabold text-gray-900">{mechanic.name}</h1>
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {mechanic.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 font-medium tracking-wide">ID: MECH-{mechanic.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg"><Phone className="w-5 h-5 text-gray-500" /></div>
                                <div><p className="text-xs text-gray-400 font-semibold uppercase">Phone</p><p className="text-sm font-medium text-gray-900">{mechanic.phone}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg"><Mail className="w-5 h-5 text-gray-500" /></div>
                                <div><p className="text-xs text-gray-400 font-semibold uppercase">Email</p><p className="text-sm font-medium text-gray-900">{mechanic.email}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg"><Calendar className="w-5 h-5 text-gray-500" /></div>
                                <div><p className="text-xs text-gray-400 font-semibold uppercase">Joined</p><p className="text-sm font-medium text-gray-900">{mechanic.joinedDate}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg"><Wrench className="w-5 h-5 text-blue-600" /></div>
                                <div><p className="text-xs text-gray-400 font-semibold uppercase">Total Services</p><p className="text-sm font-bold tracking-tight text-blue-600">{mechanic.totalServices}</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance & Services Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Award className="w-6 h-6 text-blue-600" />
                            Service History & Payouts
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {services.map(service => (
                            <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 flex-1 w-full relative">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Wrench className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-900">{service.category}</h3>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-semibold hidden sm:inline-block">REQ #{service.id}</span>
                                        </div>
                                        <p className="text-gray-500 font-medium text-sm mb-2">{service.vehicle}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {service.date}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6 md:border-l md:border-gray-100 md:pl-8">
                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Service Share</p>
                                        <div className="flex items-center gap-1 text-xl font-extrabold text-gray-900">
                                            <IndianRupee className="w-5 h-5 text-gray-400" />
                                            {service.mechanicShare}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => openBonusModal(service)}
                                        className="h-full px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-sm font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5"
                                    >
                                        <Gift className="w-4 h-4" />
                                        Pay Bonus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bonus Payment Modal */}
                {isBonusModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-8 h-8 text-purple-600" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Send Bonus</h3>
                            <p className="text-center text-gray-500 mb-8 text-sm">
                                Reward <span className="font-semibold text-gray-800">{mechanic.name}</span> for their excellent work on Request #{selectedService?.id}.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₹)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IndianRupee className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 500"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all font-bold text-gray-900 text-lg"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-center mt-3 text-purple-600 font-medium">This amount will be deducted from your workshop wallet</p>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={closeBonusModal}
                                    className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayBonus}
                                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-200"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default WorkshopMechanicDetail;
