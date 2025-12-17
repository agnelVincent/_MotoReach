import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { verifyWorkshop } from '../redux/slices/adminSlice';


export const useWorkshopVerification = () => {
  const dispatch = useDispatch();

  const confirmAction = (workshopId, action) => {

    const loadingToast = toast.loading(`Processing ${action}...`);

    dispatch(verifyWorkshop({ workshopId, action }))
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
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        // 2. Ensure the div doesn't stop events itself
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
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            type="button" 
            onClick={(btnEvent) => {
              btnEvent.stopPropagation(); 
              confirmAction(workshopId, action);
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
    ), { 
        duration: 5000,
        position: 'top-center' 
    });
  };

  return { handleStatusUpdate };
};