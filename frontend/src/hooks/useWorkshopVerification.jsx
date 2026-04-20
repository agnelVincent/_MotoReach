import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { verifyWorkshop } from '../redux/slices/adminSlice';
import { useState } from 'react';

const VerificationToast = ({ t, action, workshopId, confirmAction }) => {
  const [reason, setReason] = useState("");

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      style={{ zIndex: 9999 }} 
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <AlertCircle className={`h-10 w-10 ${action === 'approve' ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Are you sure you want to <span className="font-bold">{action}</span> this workshop?
            </p>
            {action === 'reject' && (
              <textarea 
                className="w-full mt-3 p-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:border-red-500"
                placeholder="Type the reason for rejection here..."
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          type="button" 
          onClick={(btnEvent) => {
            btnEvent.stopPropagation(); 

            let finalReason = null;
            if (action === 'reject') {
              finalReason = reason.trim();
              if (!finalReason) {
                toast.error("Please provide a reason for rejection");
                return; 
              }
            }
            confirmAction(workshopId, action, finalReason);
            toast.dismiss(t.id);
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none cursor-pointer"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={(btnEvent) => {
            btnEvent.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const useWorkshopVerification = () => {
  const dispatch = useDispatch();

  const confirmAction = (workshopId, action, reason = null) => {
    const loadingToast = toast.loading(`Processing ${action}...`);

    dispatch(verifyWorkshop({ workshopId, action, reason }))
      .unwrap()
      .then(() => {
        toast.success(`Workshop ${action === 'approve' ? 'approved' : 'rejected'} successfully!`, {
          id: loadingToast,
        });
      })
      .catch((err) => {
        toast.error(err || "Failed to update status", {
          id: loadingToast,
        });
      });
  };

  const handleStatusUpdate = (e, workshopId, action) => {
    if (e && e.stopPropagation) {
        e.stopPropagation();
        e.preventDefault();
    }

    toast.custom((t) => (
      <VerificationToast 
        t={t} 
        action={action} 
        workshopId={workshopId} 
        confirmAction={confirmAction} 
      />
    ), { 
        duration: 5000,
        position: 'top-center' 
    });
  };

  return { handleStatusUpdate };
};