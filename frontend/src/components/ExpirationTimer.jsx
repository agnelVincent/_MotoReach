import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ExpirationTimer = ({ requestedAt }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(requestedAt);
            const expires = new Date(created.getTime() + 60 * 60 * 1000); // 1 hour expiration
            const now = new Date();
            const difference = expires - now;

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60); // Keeping seconds for precision
            setTimeLeft(`${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [requestedAt]);

    if (isExpired) return <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">Expired</span>;

    return (
        <div className="flex items-center gap-1 text-orange-600 font-mono text-xs bg-orange-50 px-2 py-1 rounded border border-orange-100">
            <Clock className="w-3 h-3" />
            <span>{timeLeft} left</span>
        </div>
    );
};

export default ExpirationTimer;
