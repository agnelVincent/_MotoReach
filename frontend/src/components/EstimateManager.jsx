import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign, Plus, Trash2, Send, Edit2, Save, X, FileText,
  CheckCircle, XCircle, AlertCircle, Calendar
} from 'lucide-react';
import {
  createEstimate,
  updateEstimate,
  sendEstimate,
  fetchEstimates,
  deleteEstimate
} from '../redux/slices/serviceRequestSlice';
import { toast } from 'react-hot-toast';

const EstimateManager = ({ connectionId, requestId, onEstimateSent }) => {
  const dispatch = useDispatch();
  const { estimates, currentEstimate, loading } = useSelector((state) => state.serviceRequest);

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    tax_rate: 0,
    discount_amount: 0,
    notes: '',
    expires_at: '',
    line_items: []
  });

  useEffect(() => {
    if (connectionId) {
      dispatch(fetchEstimates(connectionId));
    }
  }, [connectionId, dispatch]);

  useEffect(() => {
    if (currentEstimate && currentEstimate.status === 'DRAFT') {
      setFormData({
        tax_rate: currentEstimate.tax_rate || 0,
        discount_amount: currentEstimate.discount_amount || 0,
        notes: currentEstimate.notes || '',
        expires_at: currentEstimate.expires_at ? currentEstimate.expires_at.split('T')[0] : '',
        line_items: currentEstimate.line_items || []
      });
      setIsEditing(true);
    }
  }, [currentEstimate]);

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        {
          item_type: 'LABOR',
          description: '',
          quantity: 1,
          unit_price: 0
        }
      ]
    });
  };

  const handleRemoveLineItem = (index) => {
    const newLineItems = formData.line_items.filter((_, i) => i !== index);
    setFormData({ ...formData, line_items: newLineItems });
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index][field] = value;
    
    // Auto-calculate total for this line item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(newLineItems[index].quantity) || 0;
      const unitPrice = parseFloat(newLineItems[index].unit_price) || 0;
      newLineItems[index].total = quantity * unitPrice;
    }
    
    setFormData({ ...formData, line_items: newLineItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      return sum + total;
    }, 0);

    const taxAmount = (subtotal * (parseFloat(formData.tax_rate) || 0)) / 100;
    const totalAmount = subtotal + taxAmount - (parseFloat(formData.discount_amount) || 0);

    return { subtotal, taxAmount, totalAmount };
  };

  const handleSaveEstimate = async () => {
    if (formData.line_items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    const invalidItems = formData.line_items.filter(
      item => !item.description || !item.quantity || !item.unit_price
    );

    if (invalidItems.length > 0) {
      toast.error('Please fill in all fields for all line items');
      return;
    }

    try {
      if (currentEstimate && currentEstimate.status === 'DRAFT') {
        await dispatch(updateEstimate({
          estimateId: currentEstimate.id,
          estimateData: formData
        })).unwrap();
        toast.success('Estimate updated successfully');
        setIsEditing(false);
      } else {
        await dispatch(createEstimate({
          connectionId,
          estimateData: formData
        })).unwrap();
        toast.success('Estimate created successfully');
        setShowCreateModal(false);
        setFormData({
          tax_rate: 0,
          discount_amount: 0,
          notes: '',
          expires_at: '',
          line_items: []
        });
      }
      dispatch(fetchEstimates(connectionId));
    } catch (error) {
      toast.error(error.error || 'Failed to save estimate');
    }
  };

  const handleSendEstimate = async () => {
    if (!currentEstimate) {
      toast.error('No estimate to send');
      return;
    }

    if (formData.line_items.length === 0) {
      toast.error('Cannot send estimate without line items');
      return;
    }

    const { totalAmount } = calculateTotals();
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }

    try {
      await dispatch(sendEstimate({
        estimateId: currentEstimate.id,
        requestId
      })).unwrap();
      toast.success('Estimate sent successfully');
      setIsEditing(false);
      if (onEstimateSent) {
        onEstimateSent();
      }
    } catch (error) {
      toast.error(error.error || 'Failed to send estimate');
    }
  };

  const handleDeleteEstimate = async () => {
    if (!currentEstimate || currentEstimate.status !== 'DRAFT') {
      toast.error('Can only delete draft estimates');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this estimate?')) {
      return;
    }

    try {
      await dispatch(deleteEstimate({
        estimateId: currentEstimate.id,
        connectionId
      })).unwrap();
      toast.success('Estimate deleted successfully');
      setFormData({
        tax_rate: 0,
        discount_amount: 0,
        notes: '',
        expires_at: '',
        line_items: []
      });
      setIsEditing(false);
    } catch (error) {
      toast.error(error.error || 'Failed to delete estimate');
    }
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();
  const draftEstimate = estimates.find(e => e.status === 'DRAFT');
  const sentEstimate = estimates.find(e => e.status === 'SENT');
  const activeEstimate = draftEstimate || sentEstimate || estimates[0];

  if (!connectionId) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <p className="text-gray-500 text-center">No active connection found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Service Estimate
        </h3>
        {!activeEstimate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Estimate
          </button>
        )}
      </div>

      {/* Estimate Status Display */}
      {activeEstimate && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                activeEstimate.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                activeEstimate.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                activeEstimate.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {activeEstimate.status}
              </span>
              {activeEstimate.expires_at && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Expires: {new Date(activeEstimate.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
            {activeEstimate.status === 'DRAFT' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteEstimate}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estimate Form */}
      {(isEditing || showCreateModal) && (
        <div className="space-y-6 mb-6">
          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-700">Line Items</h4>
              <button
                onClick={handleAddLineItem}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.line_items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={item.item_type}
                        onChange={(e) => handleLineItemChange(index, 'item_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      >
                        <option value="LABOR">Labor</option>
                        <option value="PARTS">Parts</option>
                        <option value="ADDITIONAL">Additional</option>
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        onClick={() => handleRemoveLineItem(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-semibold text-gray-700">
                      Total: ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {formData.line_items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No line items added yet</p>
                  <p className="text-sm mt-1">Click "Add Item" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount (₹)</label>
              <input
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Additional notes or comments..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              {formData.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{formData.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total Amount:</span>
                <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveEstimate}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {currentEstimate ? 'Update Estimate' : 'Save Estimate'}
            </button>
            {currentEstimate && currentEstimate.status === 'DRAFT' && (
              <button
                onClick={handleSendEstimate}
                disabled={loading || formData.line_items.length === 0 || totalAmount <= 0}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                Send Estimate
              </button>
            )}
            <button
              onClick={() => {
                setIsEditing(false);
                setShowCreateModal(false);
                if (currentEstimate) {
                  setFormData({
                    tax_rate: currentEstimate.tax_rate || 0,
                    discount_amount: currentEstimate.discount_amount || 0,
                    notes: currentEstimate.notes || '',
                    expires_at: currentEstimate.expires_at ? currentEstimate.expires_at.split('T')[0] : '',
                    line_items: currentEstimate.line_items || []
                  });
                }
              }}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View Mode - Display Estimate */}
      {activeEstimate && !isEditing && !showCreateModal && (
        <div className="space-y-4">
          {/* Line Items Display */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Line Items</h4>
            <div className="space-y-2">
              {activeEstimate.line_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                        {item.item_type}
                      </span>
                      <span className="font-medium text-gray-800">{item.description}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    ₹{parseFloat(item.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Display */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
              </div>
              {activeEstimate.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({activeEstimate.tax_rate}%):</span>
                  <span className="font-semibold">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {activeEstimate.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total Amount:</span>
                <span className="text-green-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Display */}
          {activeEstimate.notes && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{activeEstimate.notes}</p>
            </div>
          )}

          {/* Status Messages */}
          {activeEstimate.status === 'SENT' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Estimate Sent</p>
                <p className="text-sm text-blue-600">Waiting for customer approval</p>
              </div>
            </div>
          )}
          {activeEstimate.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Estimate Approved</p>
                <p className="text-sm text-green-600">Customer has approved this estimate</p>
              </div>
            </div>
          )}
          {activeEstimate.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Estimate Rejected</p>
                <p className="text-sm text-red-600">Customer has rejected this estimate</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!activeEstimate && !showCreateModal && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">No estimate created yet</p>
          <p className="text-sm text-gray-500 mb-4">Create an estimate to share with the customer</p>
        </div>
      )}
    </div>
  );
};

export default EstimateManager;
