import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign, Plus, Trash2, Send, Edit2, Save, X, FileText,
  CheckCircle, XCircle, AlertCircle, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  createEstimate,
  updateEstimate,
  sendEstimate,
  fetchEstimates,
  deleteEstimate,
  resendEstimate,
} from '../redux/slices/serviceRequestSlice';
import { toast } from 'react-hot-toast';

const EstimateManager = ({ connectionId, requestId, onEstimateSent, onResend }) => {
  const dispatch = useDispatch();
  const { estimates, currentEstimate, loading } = useSelector((state) => state.serviceRequest);

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
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
    if (currentEstimate && (currentEstimate.status === 'DRAFT' || currentEstimate.status === 'REJECTED')) {
      const items = (currentEstimate.line_items || []).map((item) => ({
        item_type: item.item_type || 'LABOR',
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      }));
      setFormData({
        tax_rate: Number(currentEstimate.tax_rate) || 0,
        discount_amount: Number(currentEstimate.discount_amount) || 0,
        notes: currentEstimate.notes || '',
        expires_at: currentEstimate.expires_at ? currentEstimate.expires_at.split('T')[0] : '',
        line_items: items,
      });
      if (currentEstimate.status === 'DRAFT') setIsEditing(true);
    }
  }, [currentEstimate]);

  const handleAddLineItem = () => {
    const newIndex = formData.line_items.length;
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
    setExpandedItem(newIndex);
  };

  const handleRemoveLineItem = (index) => {
    const newLineItems = formData.line_items.filter((_, i) => i !== index);
    setFormData({ ...formData, line_items: newLineItems });
    if (expandedItem === index) setExpandedItem(null);
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index][field] = value;
    
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

  const buildEstimatePayload = () => {
    const line_items = formData.line_items.map((item) => ({
      item_type: item.item_type || 'LABOR',
      description: String(item.description || '').trim(),
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
    }));
    return {
      tax_rate: Number(formData.tax_rate) || 0,
      discount_amount: Number(formData.discount_amount) || 0,
      notes: String(formData.notes || '').trim() || null,
      expires_at: formData.expires_at || null,
      line_items,
    };
  };

  const handleSaveEstimate = async () => {
    if (formData.line_items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    const invalidItems = formData.line_items.filter(
      (item) => !String(item.description || '').trim()
    );
    if (invalidItems.length > 0) {
      toast.error('Please add a description for all line items');
      return;
    }

    const estimateData = buildEstimatePayload();
    try {
      if (currentEstimate && (currentEstimate.status === 'DRAFT' || currentEstimate.status === 'REJECTED')) {
        await dispatch(updateEstimate({
          estimateId: currentEstimate.id,
          estimateData,
        })).unwrap();
        toast.success('Estimate saved successfully');
        setIsEditing(false);
      } else {
        await dispatch(createEstimate({
          connectionId,
          estimateData,
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
  const rejectedEstimate = estimates.find(e => e.status === 'REJECTED');
  const activeEstimate = draftEstimate || sentEstimate || rejectedEstimate || estimates[0];

  if (!connectionId) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="text-center py-6">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No active connection found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Compact Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Estimate</h3>
              {activeEstimate && (
                <span className={`text-xs font-semibold ${
                  activeEstimate.status === 'DRAFT' ? 'text-yellow-600' :
                  activeEstimate.status === 'SENT' ? 'text-blue-600' :
                  activeEstimate.status === 'APPROVED' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {activeEstimate.status}
                </span>
              )}
            </div>
          </div>
          {!activeEstimate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Create Estimate"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {activeEstimate && activeEstimate.status === 'DRAFT' && (
            <div className="flex gap-1">
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

      <div className="p-4">
        {/* Estimate Form */}
        {(isEditing || showCreateModal) && (
          <div className="space-y-4">
            {/* Line Items - Collapsible */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-gray-900">Items ({formData.line_items.length})</h4>
                <button
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg border border-gray-200">
                    {/* Compact Header */}
                    <div 
                      onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                      className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              {item.item_type}
                            </span>
                            {expandedItem === index ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.description || 'Click to edit'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Qty {item.quantity} × ₹{parseFloat(item.unit_price || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                            ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLineItem(index);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Form */}
                    {expandedItem === index && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                          <select
                            value={item.item_type}
                            onChange={(e) => handleLineItemChange(index, 'item_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                          >
                            <option value="LABOR">Labor</option>
                            <option value="PARTS">Parts</option>
                            <option value="ADDITIONAL">Additional</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            placeholder="Enter description..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white placeholder-gray-400 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.quantity === undefined || item.quantity === null ? '' : item.quantity}
                              onChange={(e) => {
                                const v = e.target.value;
                                handleLineItemChange(index, 'quantity', v === '' ? 0 : parseFloat(v));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unit_price === undefined || item.unit_price === null ? '' : item.unit_price}
                              onChange={(e) => {
                                const v = e.target.value;
                                handleLineItemChange(index, 'unit_price', v === '' ? 0 : parseFloat(v));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {formData.line_items.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500">No items added</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tax and Discount */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none bg-white"
              />
            </div>

            {/* Totals Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-300">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Tax ({formData.tax_rate}%)</span>
                  <span className="font-bold text-gray-900">₹{taxAmount.toFixed(2)}</span>
                </div>
                {formData.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-₹{formData.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSaveEstimate}
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {currentEstimate ? 'Update' : 'Save'}
              </button>
              {currentEstimate && currentEstimate.status === 'DRAFT' && (
                <button
                  onClick={handleSendEstimate}
                  disabled={loading || formData.line_items.length === 0 || totalAmount <= 0}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send to Customer
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
                className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* View Mode - Display Estimate */}
        {activeEstimate && !isEditing && !showCreateModal && (
          <div className="space-y-4">
            {/* Status Badge with Expiry */}
            {activeEstimate.expires_at && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">Expires:</span>
                <span>{new Date(activeEstimate.expires_at).toLocaleDateString()}</span>
              </div>
            )}

            {/* Line Items Display */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Items</h4>
              <div className="space-y-2">
                {activeEstimate.line_items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {item.item_type}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        ₹{parseFloat(item.total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Display */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-300">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                </div>
                {activeEstimate.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Tax ({activeEstimate.tax_rate}%)</span>
                    <span className="font-bold text-gray-900">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {activeEstimate.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-green-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes Display */}
            {activeEstimate.notes && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700 leading-relaxed">{activeEstimate.notes}</p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {activeEstimate.status === 'SENT' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-900 text-sm">Sent to Customer</p>
                  <p className="text-xs text-blue-700">Waiting for approval</p>
                </div>
              </div>
            )}
            {activeEstimate.status === 'APPROVED' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-900 text-sm">Approved</p>
                  <p className="text-xs text-green-700">Customer approved</p>
                </div>
              </div>
            )}
            {activeEstimate.status === 'REJECTED' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 text-sm">Rejected</p>
                    <p className="text-xs text-red-700">Edit and resend or send as-is</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        tax_rate: Number(activeEstimate.tax_rate) || 0,
                        discount_amount: Number(activeEstimate.discount_amount) || 0,
                        notes: activeEstimate.notes || '',
                        expires_at: activeEstimate.expires_at ? activeEstimate.expires_at.split('T')[0] : '',
                        line_items: (activeEstimate.line_items || []).map((item) => ({
                          item_type: item.item_type || 'LABOR',
                          description: item.description || '',
                          quantity: Number(item.quantity) || 0,
                          unit_price: Number(item.unit_price) || 0,
                        })),
                      });
                      setIsEditing(true);
                    }}
                    className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await dispatch(resendEstimate({ estimateId: activeEstimate.id, requestId })).unwrap();
                        toast.success('Estimate resent to customer');
                        if (connectionId) dispatch(fetchEstimates(connectionId));
                        if (onResend) onResend();
                      } catch (e) {
                        toast.error(e?.error || 'Failed to resend estimate');
                      }
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Resend
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!activeEstimate && !showCreateModal && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">No Estimate</p>
            <p className="text-xs text-gray-500 mb-4">Create one for the customer</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimateManager;